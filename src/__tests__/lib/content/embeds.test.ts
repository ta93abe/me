import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
	EMBED_TTL_MS,
	embedObjectKey,
	isFreshEmbed,
	parseEmbedRecord,
	type EmbedCacheRecord,
} from "@/lib/content/embed-cache";
import { collectBlogEmbeds } from "@/lib/content/markdown";

function hashUrl(url: string): string {
	return createHash("sha256").update(url).digest("hex");
}

describe("collectBlogEmbeds", () => {
	it("collects unique standalone tweet, YouTube, and link URLs in document order", () => {
		const embeds = collectBlogEmbeds(`Intro.

https://x.com/jack/status/20

https://youtu.be/dQw4w9WgXcQ

https://coosenp.ai

[again](https://x.com/jack/status/20)

@[youtube](dQw4w9WgXcQ)

https://github.com/ta93abe/me
`);

		expect(embeds).toEqual([
			{
				kind: "tweet",
				id: "20",
				href: "https://x.com/jack/status/20",
			},
			{
				kind: "youtube",
				id: "dQw4w9WgXcQ",
				href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			},
			{ kind: "link", href: "https://coosenp.ai/" },
			{ kind: "link", href: "https://github.com/ta93abe/me" },
		]);
	});

	it("ignores in-sentence URLs, fences, and tweet URLs as OGP links", () => {
		const embeds = collectBlogEmbeds(`See https://example.com here.

\`\`\`
https://example.com
https://x.com/jack/status/20
https://youtu.be/dQw4w9WgXcQ
\`\`\`

@[tweet](https://twitter.com/jack/status/20)
`);

		expect(embeds).toEqual([
			{
				kind: "tweet",
				id: "20",
				href: "https://x.com/jack/status/20",
			},
		]);
	});
});

describe("embedObjectKey", () => {
	it("stores URL-keyed JSON under derived/embeds/{sha256}.json", async () => {
		const url = "https://coosenp.ai/";
		expect(await embedObjectKey(url)).toBe(
			`derived/embeds/${hashUrl(url)}.json`,
		);
	});
});

describe("embed cache records", () => {
	it("treats records inside the 7-day TTL as fresh", () => {
		const now = new Date("2026-09-18T00:00:00.000Z");
		const record: EmbedCacheRecord = {
			url: "https://coosenp.ai/",
			kind: "link",
			fetchedAt: "2026-09-16T00:00:00.000Z",
			expiresAt: "2026-09-23T00:00:00.000Z",
			link: {
				href: "https://coosenp.ai/",
				title: "CooSenpAI",
				description: "",
				domain: "coosenp.ai",
				favicon: "",
			},
		};

		expect(EMBED_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
		expect(isFreshEmbed(record, now)).toBe(true);
		expect(
			isFreshEmbed({ ...record, expiresAt: "2026-09-17T23:59:59.000Z" }, now),
		).toBe(false);
	});

	it("rejects malformed R2 payloads", () => {
		expect(parseEmbedRecord(null)).toBeNull();
		expect(parseEmbedRecord({ url: "https://x.com" })).toBeNull();
		expect(
			parseEmbedRecord({
				url: "https://coosenp.ai/",
				kind: "link",
				fetchedAt: "2026-09-16T00:00:00.000Z",
				expiresAt: "2026-09-23T00:00:00.000Z",
			}),
		).toMatchObject({
			url: "https://coosenp.ai/",
			kind: "link",
		});
	});
});
