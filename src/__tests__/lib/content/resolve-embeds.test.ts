import { describe, expect, it, vi } from "vitest";

import { embedObjectKey } from "@/lib/content/embed-cache";
import { resolveEmbedsForMarkdown } from "@/lib/content/resolve-embeds";

import { createMemoryR2 } from "../../../../worker/__tests__/memory-r2.ts";

const now = new Date("2026-09-18T00:00:00.000Z");

describe("resolveEmbedsForMarkdown", () => {
	it("writes OGP, tweet, and YouTube JSON into derived/embeds on publish", async () => {
		const bucket = createMemoryR2();
		const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (
				url.includes("syndication.twimg.com") ||
				url.includes("fxtwitter.com")
			) {
				return new Response(
					JSON.stringify({
						id_str: "20",
						text: "just setting up my twttr",
						created_at: "Tue Mar 21 20:50:14 +0000 2006",
						display_text_range: [0, 24],
						user: {
							name: "jack",
							screen_name: "jack",
							profile_image_url_https: "https://pbs.twimg.com/profile.jpg",
							verified: true,
						},
					}),
					{ headers: { "content-type": "application/json" } },
				);
			}
			if (url.includes("youtube.com/oembed")) {
				return new Response(
					JSON.stringify({
						title: "Never Gonna Give You Up",
						author_name: "Rick Astley",
						thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
					}),
					{ headers: { "content-type": "application/json" } },
				);
			}
			return new Response(
				`<!doctype html><html><head>
<meta property="og:title" content="CooSenpAI">
<meta property="og:description" content="A helper AI">
<meta property="og:image" content="https://coosenp.ai/og.png">
</head></html>`,
				{ headers: { "content-type": "text/html; charset=utf-8" } },
			);
		});

		await resolveEmbedsForMarkdown(
			bucket,
			"https://x.com/jack/status/20\n\nhttps://coosenp.ai\n\nhttps://youtu.be/dQw4w9WgXcQ\n",
			{ fetch: fetchImpl, now },
		);

		const tweetKey = await embedObjectKey("https://x.com/jack/status/20");
		const linkKey = await embedObjectKey("https://coosenp.ai/");
		const youtubeKey = await embedObjectKey(
			"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		);
		const tweet = (await (await bucket.get(tweetKey))!.json()) as {
			kind: string;
			tweet: { text: string };
		};
		const link = (await (await bucket.get(linkKey))!.json()) as {
			kind: string;
			link: { title: string };
			expiresAt: string;
		};
		const youtube = (await (await bucket.get(youtubeKey))!.json()) as {
			kind: string;
			youtube: { title: string };
		};

		expect(tweet.kind).toBe("tweet");
		expect(tweet.tweet.text).toBe("just setting up my twttr");
		expect(link.kind).toBe("link");
		expect(link.link.title).toBe("CooSenpAI");
		expect(link.expiresAt).toBe("2026-09-25T00:00:00.000Z");
		expect(youtube.kind).toBe("youtube");
		expect(youtube.youtube.title).toBe("Never Gonna Give You Up");
	});

	it("skips a fresh cache unless force is set", async () => {
		const bucket = createMemoryR2();
		const key = await embedObjectKey("https://example.com/");
		await bucket.put(
			key,
			JSON.stringify({
				url: "https://example.com/",
				kind: "link",
				fetchedAt: "2026-09-16T00:00:00.000Z",
				expiresAt: "2026-09-23T00:00:00.000Z",
				link: {
					href: "https://example.com/",
					title: "Cached",
					description: "",
					domain: "example.com",
					favicon: "",
				},
			}),
		);

		const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 }));
		await resolveEmbedsForMarkdown(bucket, "https://example.com/\n", {
			fetch: fetchImpl,
			now,
		});
		expect(fetchImpl).not.toHaveBeenCalled();

		await resolveEmbedsForMarkdown(bucket, "https://example.com/\n", {
			fetch: fetchImpl,
			now,
			force: true,
		});
		expect(fetchImpl).toHaveBeenCalledOnce();
	});
});
