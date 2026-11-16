import { describe, expect, it, vi } from "vitest";

import {
	fetchTweetEmbed,
	tweetEmbedHtml,
	type TweetEmbedData,
} from "@/lib/content/tweet";

function sampleTweet(overrides: Partial<TweetEmbedData> = {}): TweetEmbedData {
	return {
		id: "20",
		url: "https://x.com/jack/status/20",
		text: "just setting up my twttr",
		createdAt: "2006-03-21T20:50:14.000Z",
		displayTextRange: [0, 24],
		author: {
			name: "jack",
			screenName: "jack",
			avatarUrl: "https://pbs.twimg.com/profile_images/example_x96.jpg",
			verified: true,
		},
		photos: [],
		entities: [],
		...overrides,
	};
}

describe("tweetEmbedHtml", () => {
	it("cuts entities by code point and decodes the API's HTML escapes once", () => {
		// 🙇 はサロゲートペア。X の indices はコードポイント単位で、本文は &amp; でエスケープされている
		const text = "解説&amp;実践🙇 #SnowflakeDB";
		const start = Array.from(text).indexOf("#");
		const html = tweetEmbedHtml(
			"https://x.com/jack/status/20",
			sampleTweet({
				text,
				displayTextRange: [0, Array.from(text).length],
				entities: [
					{
						indices: [start, start + 12],
						href: "https://x.com/hashtag/SnowflakeDB",
						label: "#SnowflakeDB",
					},
				],
			}),
		);
		expect(html).toContain(
			'解説&amp;実践🙇 <a href="https://x.com/hashtag/SnowflakeDB" rel="noopener noreferrer" target="_blank">#SnowflakeDB</a></p>',
		);
		expect(html).not.toContain("&amp;amp;");
	});

	it('hides photos, video, and the quoted post with media: false (cards="hidden")', () => {
		const tweet = sampleTweet({
			photos: [
				{ url: "https://pbs.twimg.com/media/a.jpg", width: 10, height: 10 },
			],
			videoPoster: "https://pbs.twimg.com/media/v.jpg",
			quoted: sampleTweet({ id: "21", text: "quoted" }),
		});
		const visible = tweetEmbedHtml(tweet.url, tweet);
		expect(visible).toContain("tweet-embed-photos");
		expect(visible).toContain("tweet-embed-video");
		expect(visible).toContain("tweet-embed-quoted");

		const hidden = tweetEmbedHtml(tweet.url, tweet, { media: false });
		expect(hidden).toContain("just setting up my twttr");
		expect(hidden).not.toContain("tweet-embed-photos");
		expect(hidden).not.toContain("tweet-embed-video");
		expect(hidden).not.toContain("tweet-embed-quoted");
	});

	it("renders a Zenn-like card with author, text, and permalink", () => {
		const html = tweetEmbedHtml("https://x.com/jack/status/20", sampleTweet());

		expect(html).toContain('class="tweet-embed"');
		expect(html).toContain("just setting up my twttr");
		expect(html).toContain("@jack");
		expect(html).toContain("2006年3月22日 5:50");
		expect(html).toContain('datetime="2006-03-21T20:50:14.000Z"');
		expect(html).toContain('aria-label="Xでポストを見る"');
		expect(html).toContain("tweet-embed-verified");
		expect(html).toContain('class="tweet-embed-identity"');
		expect(html).toContain('aria-label="jack (@jack) の X プロフィール"');
		expect(html).toContain('tabindex="-1"');
		expect(html).not.toContain(" inert");
		expect(html).not.toMatch(/tweet-embed-identity"[^>]*aria-hidden/);
		expect(html).not.toContain("tweet-embed-follow");
		expect(html).not.toContain("Follow");
		expect(html).not.toContain("intent/follow");
	});

	it("renders photos, video poster, and a quoted post", () => {
		const html = tweetEmbedHtml(
			"https://x.com/jack/status/21",
			sampleTweet({
				id: "21",
				url: "https://x.com/jack/status/21",
				text: "quoting",
				photos: [
					{
						url: "https://pbs.twimg.com/media/photo.jpg",
						width: 1200,
						height: 800,
					},
				],
				videoPoster: "https://pbs.twimg.com/media/poster.jpg",
				quoted: sampleTweet({
					id: "20",
					text: "inner quote",
					author: {
						name: "quoted",
						screenName: "quoted",
						verified: false,
					},
				}),
			}),
		);

		expect(html).toContain("tweet-embed-photos-1");
		expect(html).toContain('src="https://pbs.twimg.com/media/photo.jpg"');
		expect(html).toContain('width="1200"');
		expect(html).toContain("tweet-embed-video");
		expect(html).toContain("Watch on X");
		expect(html).toContain("inner quote");
		expect(html).toContain("tweet-embed-quoted");
		expect(html).toContain("@quoted");
	});

	it("linkifies entities and escapes untrusted HTML", () => {
		const html = tweetEmbedHtml(
			"https://x.com/jack/status/20",
			sampleTweet({
				text: "hello <script>alert(1)</script> @x https://t.co/x",
				displayTextRange: [0, 48],
				author: {
					name: "<img src=x onerror=alert(1)>",
					screenName: 'jack">',
					verified: false,
				},
				entities: [
					{
						indices: [35, 48],
						href: "https://example.com/safe",
						label: "example.com/safe",
					},
				],
			}),
		);

		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
		expect(html).not.toContain("<img src=x");
		expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
		expect(html).toContain(
			'aria-label="&lt;img src=x onerror=alert(1)&gt; (@jack&quot;&gt;) の X プロフィール"',
		);
		expect(html).toContain('href="https://example.com/safe"');
		expect(html).toContain("example.com/safe");
	});

	it("falls back to a permalink card when fetch data is missing", () => {
		const html = tweetEmbedHtml("https://x.com/jack/status/20", null);
		expect(html).toContain("tweet-embed-fallback");
		expect(html).toContain("Xでポストを見る");
		expect(html).toContain("x.com/jack/status/20");
		expect(html).toContain('href="https://x.com/jack/status/20"');
	});
});

describe("fetchTweetEmbed", () => {
	it("does not fetch invalid ids", async () => {
		const fetchImpl = vi.fn();
		expect(await fetchTweetEmbed("nope", { fetch: fetchImpl })).toBeNull();
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("reads a syndication payload", async () => {
		const fetchImpl = vi.fn(async () => {
			return new Response(
				JSON.stringify({
					__typename: "Tweet",
					id_str: "20",
					text: "just setting up my twttr",
					created_at: "2006-03-21T20:50:14.000Z",
					display_text_range: [0, 24],
					entities: {},
					user: {
						name: "jack",
						screen_name: "jack",
						profile_image_url_https:
							"https://pbs.twimg.com/profile_images/n_normal.jpg",
						is_blue_verified: true,
					},
				}),
				{ headers: { "content-type": "application/json" } },
			);
		});

		const tweet = await fetchTweetEmbed("20", { fetch: fetchImpl });
		expect(fetchImpl).toHaveBeenCalledOnce();
		expect(fetchImpl).toHaveBeenCalledWith(
			expect.stringContaining("cdn.syndication.twimg.com/tweet-result"),
			expect.anything(),
		);
		expect(tweet?.text).toBe("just setting up my twttr");
		expect(tweet?.author.screenName).toBe("jack");
		expect(tweet?.author.avatarUrl).toContain("_x96.");
		expect(tweet?.author.verified).toBe(true);
	});

	it("falls back to fxtwitter when syndication misses", async () => {
		const fetchImpl = vi.fn(async (input: string | URL | Request) => {
			const url = String(input);
			if (url.includes("syndication.twimg.com")) {
				return new Response("dog", { status: 404 });
			}
			return new Response(
				JSON.stringify({
					code: 200,
					tweet: {
						id: "20",
						text: "just setting up my twttr",
						created_at: "Tue Mar 21 20:50:14 +0000 2006",
						author: {
							name: "jack",
							screen_name: "jack",
							avatar_url: "https://pbs.twimg.com/profile_images/az.jpg",
							verification: { verified: true },
						},
					},
				}),
				{ headers: { "content-type": "application/json" } },
			);
		});

		const tweet = await fetchTweetEmbed("20", { fetch: fetchImpl });
		expect(fetchImpl).toHaveBeenCalledTimes(2);
		expect(fetchImpl).toHaveBeenNthCalledWith(
			2,
			expect.stringContaining("api.fxtwitter.com/status/20"),
			expect.anything(),
		);
		expect(tweet?.author.name).toBe("jack");
		expect(tweet?.createdAt).toBe("2006-03-21T20:50:14.000Z");
	});

	it("returns null when both sources fail", async () => {
		const fetchImpl = vi.fn(async () => new Response("no", { status: 500 }));
		expect(await fetchTweetEmbed("20", { fetch: fetchImpl })).toBeNull();
	});
});
