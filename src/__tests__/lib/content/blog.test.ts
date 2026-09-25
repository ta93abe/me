import { describe, expect, it } from "vitest";

import {
	blogNeighbors,
	indexEntryToListItem,
	listBlogPosts,
	loadBlogPost,
	sortBlogList,
	toDate,
	type BlogListItem,
} from "@/lib/content/blog";
import { embedObjectKey } from "@/lib/content/embed-cache";

import { createMemoryR2 } from "../../../../worker/__tests__/memory-r2.ts";
import { rebuildContentIndexes } from "../../../../worker/content/index-store.ts";

const SAMPLE_DATE_ALIAS = `---
title: Hello Workers
excerpt: Stage 3 note
date: 2026-08-30
tags:
  - workers
  - r2
---

Published from R2.
`;

const SAMPLE_PUBLISH_DATE = `---
title: New Keys
excerpt: canonical dates
publish_date: 2026-09-07
revise_date: 2026-09-08
---

Canonical frontmatter.
`;

function item(
	partial: Partial<BlogListItem> &
		Pick<BlogListItem, "slug" | "title" | "publish_date">,
): BlogListItem {
	return {
		excerpt: partial.excerpt ?? "",
		tags: partial.tags ?? [],
		...partial,
	};
}

describe("blog content helpers", () => {
	it("parses date-like values", () => {
		expect(toDate("2026-08-30")?.toISOString()).toBe(
			new Date("2026-08-30").toISOString(),
		);
		expect(toDate("not-a-date")).toBeUndefined();
	});

	it("reads list and detail from date-only notes", async () => {
		const bucket = createMemoryR2();
		await bucket.put("md/blog/hello-workers.md", SAMPLE_DATE_ALIAS);
		await rebuildContentIndexes(bucket);

		const list = await listBlogPosts(bucket);
		expect(list).toHaveLength(1);
		expect(list[0]?.slug).toBe("hello-workers");
		expect(list[0]?.title).toBe("Hello Workers");
		expect(list[0]?.tags).toEqual(["workers", "r2"]);
		expect(list[0]?.publish_date.toISOString()).toBe(
			new Date("2026-08-30").toISOString(),
		);

		const post = await loadBlogPost(bucket, "hello-workers");
		expect(post?.body).toContain("Published from R2.");
		expect(post?.html).toContain("<p>");
		expect(post?.publish_date.toISOString()).toBe(
			new Date("2026-08-30").toISOString(),
		);
	});

	it("reads list and detail from publish_date notes", async () => {
		const bucket = createMemoryR2();
		await bucket.put("md/blog/new-keys.md", SAMPLE_PUBLISH_DATE);
		await rebuildContentIndexes(bucket);

		const list = await listBlogPosts(bucket);
		expect(list).toHaveLength(1);
		expect(list[0]?.slug).toBe("new-keys");
		expect(list[0]?.publish_date.toISOString()).toBe(
			new Date("2026-09-07").toISOString(),
		);
		expect(list[0]?.revise_date?.toISOString()).toBe(
			new Date("2026-09-08").toISOString(),
		);

		const post = await loadBlogPost(bucket, "new-keys");
		expect(post?.body).toContain("Canonical frontmatter.");
		expect(post?.revise_date?.toISOString()).toBe(
			new Date("2026-09-08").toISOString(),
		);
	});

	it("renders cached embed cards and falls back when the cache misses", async () => {
		const bucket = createMemoryR2();
		const markdown = `---
title: Cards
excerpt: embed cache
publish_date: 2026-09-18
---

https://coosenp.ai

https://x.com/jack/status/20

https://youtu.be/dQw4w9WgXcQ
`;
		await bucket.put("md/blog/cards.md", markdown);

		const linkKey = await embedObjectKey("https://coosenp.ai/");
		const tweetKey = await embedObjectKey("https://x.com/jack/status/20");
		const youtubeKey = await embedObjectKey(
			"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		);
		await bucket.put(
			linkKey,
			JSON.stringify({
				url: "https://coosenp.ai/",
				kind: "link",
				fetchedAt: "2026-09-18T00:00:00.000Z",
				expiresAt: "2026-09-25T00:00:00.000Z",
				link: {
					href: "https://coosenp.ai/",
					title: "CooSenpAI — アレコレソレが通じるAI",
					description: "helper",
					image: "https://coosenp.ai/og.png",
					domain: "coosenp.ai",
					favicon: "https://coosenp.ai/favicon.png",
				},
			}),
		);
		await bucket.put(
			tweetKey,
			JSON.stringify({
				url: "https://x.com/jack/status/20",
				kind: "tweet",
				fetchedAt: "2026-09-18T00:00:00.000Z",
				expiresAt: "2026-09-25T00:00:00.000Z",
				tweet: {
					id: "20",
					url: "https://x.com/jack/status/20",
					text: "just setting up my twttr",
					createdAt: "2006-03-21T20:50:14.000Z",
					author: {
						name: "jack",
						screenName: "jack",
						verified: true,
					},
					photos: [],
					entities: [],
				},
			}),
		);
		await bucket.put(
			youtubeKey,
			JSON.stringify({
				url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
				kind: "youtube",
				fetchedAt: "2026-09-18T00:00:00.000Z",
				expiresAt: "2026-09-25T00:00:00.000Z",
				youtube: {
					id: "dQw4w9WgXcQ",
					url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
					title: "Never Gonna Give You Up",
					authorName: "Rick Astley",
					thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
				},
			}),
		);

		const withCache = await loadBlogPost(bucket, "cards");
		expect(withCache?.html).toContain("CooSenpAI — アレコレソレが通じるAI");
		expect(withCache?.html).toContain("just setting up my twttr");
		expect(withCache?.html).toContain('class="tweet-embed"');
		expect(withCache?.html).toContain("Never Gonna Give You Up");
		expect(withCache?.html).toContain('class="youtube-embed"');

		const empty = createMemoryR2();
		await empty.put("md/blog/cards.md", markdown);
		const withoutCache = await loadBlogPost(empty, "cards");
		expect(withoutCache?.html).toContain("embed-card");
		expect(withoutCache?.html).toContain("coosenp.ai");
		expect(withoutCache?.html).not.toContain("CooSenpAI");
		expect(withoutCache?.html).toContain("tweet-embed-fallback");
		expect(withoutCache?.html).toContain("youtube-embed-lazy");
	});

	it("rejects invalid slugs and missing objects", async () => {
		const bucket = createMemoryR2();
		expect(await loadBlogPost(bucket, "Hello")).toBeNull();
		expect(await loadBlogPost(bucket, "missing")).toBeNull();
	});

	it("sorts newest first and builds neighbors", () => {
		const posts = sortBlogList([
			item({
				slug: "old",
				title: "Old",
				publish_date: new Date("2026-01-01"),
				tags: ["a"],
			}),
			item({
				slug: "new",
				title: "New",
				publish_date: new Date("2026-08-30"),
				tags: ["a"],
			}),
			item({
				slug: "mid",
				title: "Mid",
				publish_date: new Date("2026-03-01"),
				tags: ["b"],
			}),
		]);

		expect(posts.map((post) => post.slug)).toEqual(["new", "mid", "old"]);

		const aroundMid = blogNeighbors(posts, "mid");
		expect(aroundMid.prev?.id).toBe("old");
		expect(aroundMid.next?.id).toBe("new");
		expect(aroundMid.related.map((post) => post.slug)).toEqual([]);

		const aroundNew = blogNeighbors(posts, "new");
		expect(aroundNew.related.map((post) => post.slug)).toEqual(["old"]);
	});

	it("drops index entries without a blog date", () => {
		expect(
			indexEntryToListItem({
				collection: "blog",
				slug: "no-date",
				title: "No",
				excerpt: "no",
				updatedAt: new Date(0).toISOString(),
				frontmatter: { title: "No", excerpt: "no" },
			}),
		).toBeNull();
	});

	it("reads date from an existing index payload", () => {
		const itemFromIndex = indexEntryToListItem({
			collection: "blog",
			slug: "legacy",
			title: "Legacy",
			excerpt: "old key",
			updatedAt: new Date(0).toISOString(),
			frontmatter: {
				title: "Legacy",
				excerpt: "old key",
				date: "2026-08-30",
			},
		});
		expect(itemFromIndex?.publish_date.toISOString()).toBe(
			new Date("2026-08-30").toISOString(),
		);
	});

	it("falls back to date when the index publish_date is unparseable", () => {
		const itemFromIndex = indexEntryToListItem({
			collection: "blog",
			slug: "mixed",
			title: "Mixed",
			excerpt: "bad canonical",
			updatedAt: new Date(0).toISOString(),
			frontmatter: {
				title: "Mixed",
				excerpt: "bad canonical",
				publish_date: "soon",
				date: "2026-08-30",
			},
		});
		expect(itemFromIndex?.publish_date.toISOString()).toBe(
			new Date("2026-08-30").toISOString(),
		);
	});
});
