import { describe, expect, it, vi } from "vitest";

import {
	fetchYoutubeEmbed,
	youtubeEmbedHtml,
	type YoutubeEmbedData,
} from "@/lib/content/youtube";

function sampleVideo(
	overrides: Partial<YoutubeEmbedData> = {},
): YoutubeEmbedData {
	return {
		id: "dQw4w9WgXcQ",
		url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		title: "Rick Astley - Never Gonna Give You Up",
		authorName: "Rick Astley",
		thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
		...overrides,
	};
}

describe("youtubeEmbedHtml", () => {
	it("renders a Zenn-like card with thumbnail, title, and channel", () => {
		const html = youtubeEmbedHtml(
			"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			sampleVideo(),
		);

		expect(html).toContain('class="youtube-embed"');
		expect(html).toContain("Rick Astley - Never Gonna Give You Up");
		expect(html).toContain("Rick Astley");
		expect(html).toContain("YouTube");
		expect(html).toContain(
			'src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"',
		);
		expect(html).toContain("youtube-embed-play");
		expect(html).toContain('data-youtube-id="dQw4w9WgXcQ"');
		expect(html).toContain("youtube-embed-lazy");
		expect(html).not.toContain(
			'href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"',
		);
	});

	it("escapes untrusted HTML from oEmbed fields", () => {
		const html = youtubeEmbedHtml(
			"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			sampleVideo({
				title: "<script>alert(1)</script>",
				authorName: "<img src=x onerror=alert(1)>",
				thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg">',
			}),
		);

		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
		expect(html).not.toContain("<img src=x");
		expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
		expect(html).not.toContain('hqdefault.jpg">');
	});

	it("falls back to a thumbnail permalink card when fetch data is missing", () => {
		const html = youtubeEmbedHtml(
			"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			null,
		);

		expect(html).toContain("YouTubeで動画を見る");
		expect(html).toContain(
			'src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"',
		);
		expect(html).toContain('data-youtube-id="dQw4w9WgXcQ"');
		expect(html).toContain("youtube-embed-lazy");
	});
});

describe("fetchYoutubeEmbed", () => {
	it("does not fetch invalid ids", async () => {
		const fetchImpl = vi.fn();
		expect(await fetchYoutubeEmbed("nope", { fetch: fetchImpl })).toBeNull();
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("reads a YouTube oEmbed payload", async () => {
		const fetchImpl = vi.fn(async () => {
			return new Response(
				JSON.stringify({
					title: "Rick Astley - Never Gonna Give You Up",
					author_name: "Rick Astley",
					author_url: "https://www.youtube.com/@RickAstleyYT",
					thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
					provider_name: "YouTube",
				}),
				{ headers: { "content-type": "application/json" } },
			);
		});

		const video = await fetchYoutubeEmbed("dQw4w9WgXcQ", {
			fetch: fetchImpl,
		});
		expect(fetchImpl).toHaveBeenCalledOnce();
		expect(fetchImpl).toHaveBeenCalledWith(
			expect.stringContaining("youtube.com/oembed"),
			expect.anything(),
		);
		expect(video?.title).toBe("Rick Astley - Never Gonna Give You Up");
		expect(video?.authorName).toBe("Rick Astley");
		expect(video?.thumbnailUrl).toBe(
			"https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
		);
		expect(video?.url).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
	});

	it("returns null when oEmbed fails", async () => {
		const fetchImpl = vi.fn(async () => new Response("no", { status: 500 }));
		expect(
			await fetchYoutubeEmbed("dQw4w9WgXcQ", { fetch: fetchImpl }),
		).toBeNull();
	});

	it("ignores non-https thumbnails", async () => {
		const fetchImpl = vi.fn(async () => {
			return new Response(
				JSON.stringify({
					title: "Safe title",
					author_name: "Channel",
					thumbnail_url: "http://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
				}),
				{ headers: { "content-type": "application/json" } },
			);
		});

		const video = await fetchYoutubeEmbed("dQw4w9WgXcQ", {
			fetch: fetchImpl,
		});
		expect(video?.title).toBe("Safe title");
		expect(video?.thumbnailUrl).toBe(
			"https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
		);
	});
});
