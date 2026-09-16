import { describe, expect, it } from "vitest";

import { FEATURED_WORKS, SITE } from "@/config/site";

import {
	BLOG_RSS_KEY,
	LLMS_BLOG_KEY,
	SITEMAP_URLS_KEY,
	buildBlogRssXml,
	buildLlmsBlogSection,
	buildLlmsFullDocument,
	buildLlmsFullText,
	buildSitemapIndexXml,
	feedPostsFromEntries,
	sitemapUrlEntries,
	writeDerivedDiscovery,
	type FeedPost,
} from "../content/derived.ts";
import { rebuildContentIndexes } from "../content/index-store.ts";
import { handleContentQueue } from "../content/queue.ts";
import { createMemoryR2 } from "./memory-r2.ts";

const HELLO: FeedPost = {
	slug: "hello-world",
	title: "Hello & Friends",
	excerpt: "最初の <投稿>",
	publish_date: new Date("2026-08-30T00:00:00.000Z"),
};

const OLDER: FeedPost = {
	slug: "older-note",
	title: "Older",
	excerpt: "before",
	publish_date: new Date("2026-01-01T00:00:00.000Z"),
};

const SAMPLE = `---
title: Hello Workers
excerpt: Stage 5 note
date: 2026-08-30
---

Published from R2.
`;

describe("derived discovery feeds", () => {
	it("builds RSS with newest first and escaped XML", () => {
		const xml = buildBlogRssXml([HELLO, OLDER], "https://ta93abe.com");

		expect(xml).toContain("<title>ta93abe | Blog</title>");
		expect(xml).toContain("<language>ja</language>");
		expect(xml).toContain("https://ta93abe.com/blog/hello-world/");
		expect(xml.indexOf("hello-world")).toBeLessThan(xml.indexOf("older-note"));
		expect(xml).toContain("Hello &amp; Friends");
		expect(xml).toContain("最初の &lt;投稿&gt;");
		expect(xml).not.toContain("Hello & Friends");
	});

	it("lists blog URLs and static sections for the sitemap", () => {
		const urls = sitemapUrlEntries([HELLO], "https://ta93abe.com");
		const locs = urls.map((entry) => entry.loc);

		expect(locs).toEqual([
			"https://ta93abe.com/",
			"https://ta93abe.com/blog/",
			"https://ta93abe.com/blog/hello-world/",
			"https://ta93abe.com/about/",
			"https://ta93abe.com/works/",
			"https://ta93abe.com/contact/",
			"https://ta93abe.com/links/",
			"https://ta93abe.com/slides/",
			"https://ta93abe.com/tools/",
			"https://ta93abe.com/gadgets/",
		]);
		expect(
			urls.find((entry) => entry.loc.endsWith("/hello-world/"))?.lastmod,
		).toBe("2026-08-30");
		expect(locs.join(" ")).not.toMatch(/gallery|atelier|bookshelf/);
	});

	it("lists published posts in the llms blog section", () => {
		const section = buildLlmsBlogSection([HELLO], "https://ta93abe.com");
		expect(section).toContain("## Blog");
		expect(section).toContain(
			"[Hello & Friends](https://ta93abe.com/blog/hello-world/)",
		);
		expect(section).toContain("最初の <投稿>");
	});

	it("points sitemap-index at the static sitemap and the blog sitemap", () => {
		const xml = buildSitemapIndexXml("https://ta93abe.com");
		expect(xml).toContain("https://ta93abe.com/sitemap-0.xml");
		expect(xml).toContain("https://ta93abe.com/sitemap-blog.xml");
	});

	it("reads dated blog entries from an index payload", () => {
		const posts = feedPostsFromEntries([
			{
				collection: "blog",
				slug: "hello-world",
				title: "Hello",
				excerpt: "note",
				updatedAt: "2026-08-30T00:00:00.000Z",
				frontmatter: {
					title: "Hello",
					excerpt: "note",
					date: "2026-08-30",
				},
			},
			{
				collection: "blog",
				slug: "canonical",
				title: "Canonical",
				excerpt: "new key",
				updatedAt: "2026-09-07T00:00:00.000Z",
				frontmatter: {
					title: "Canonical",
					excerpt: "new key",
					publish_date: "2026-09-07",
				},
			},
			{
				collection: "blog",
				slug: "no-date",
				title: "No",
				excerpt: "no",
				updatedAt: "2026-08-30T00:00:00.000Z",
				frontmatter: { title: "No", excerpt: "no" },
			},
			{
				collection: "blog",
				slug: "mixed",
				title: "Mixed",
				excerpt: "bad canonical",
				updatedAt: "2026-08-15T00:00:00.000Z",
				frontmatter: {
					title: "Mixed",
					excerpt: "bad canonical",
					publish_date: "soon",
					date: "2026-08-15",
				},
			},
		]);
		expect(posts.map((post) => post.slug)).toEqual([
			"canonical",
			"hello-world",
			"mixed",
		]);
	});

	it("writes derived RSS, sitemap, and llms after rebuilding indexes", async () => {
		const bucket = createMemoryR2();
		await bucket.put("md/blog/hello-world.md", SAMPLE);
		await rebuildContentIndexes(bucket);
		await writeDerivedDiscovery(bucket);

		const rss = await bucket.get(BLOG_RSS_KEY);
		const sitemap = await bucket.get(SITEMAP_URLS_KEY);
		const llms = await bucket.get(LLMS_BLOG_KEY);
		expect(rss).not.toBeNull();
		expect(sitemap).not.toBeNull();
		expect(llms).not.toBeNull();
		expect(await rss!.text()).toContain("hello-world");
		expect(await sitemap!.text()).toContain("/blog/hello-world/");
		expect(await llms!.text()).toContain("Hello Workers");
	});

	it("rebuilds derived files from a queue notification", async () => {
		const bucket = createMemoryR2();
		await bucket.put("md/blog/hello-world.md", SAMPLE);
		const purged: string[] = [];

		await handleContentQueue(
			{
				messages: [
					{
						id: "1",
						timestamp: new Date(),
						attempts: 1,
						body: {
							action: "PutObject",
							object: { key: "md/blog/hello-world.md" },
						},
						ack() {},
						retry() {},
					},
				],
			} as unknown as MessageBatch<unknown>,
			bucket,
			{
				origin: "https://ta93abe.com",
				purge: async (urls) => {
					purged.push(...urls);
				},
			},
		);

		expect(await (await bucket.get(BLOG_RSS_KEY))!.text()).toContain(
			"hello-world",
		);
		expect(purged).toContain("https://ta93abe.com/rss.xml");
		expect(purged).toContain("https://ta93abe.com/sitemap-index.xml");
		expect(purged).toContain("https://ta93abe.com/sitemap-blog.xml");
		expect(purged).toContain("https://ta93abe.com/llms.txt");
		expect(purged).toContain("https://ta93abe.com/llms-full.txt");
		expect(purged).toContain("https://ta93abe.com/og/blog/hello-world.png");
	});
});

const SNOWFLAKE_BODY =
	"シアターセッションを反復横跳びしていました。UNIQUE_SNOWFLAKE_BODY";

describe("llms-full corpus", () => {
	it("inlines About, Works, and published blog bodies under canonical URL headings", () => {
		const full = buildLlmsFullDocument(
			[
				{
					...HELLO,
					body: SNOWFLAKE_BODY,
				},
			],
			"https://ta93abe.com",
		);

		expect(full).toContain("## https://ta93abe.com/about/");
		expect(full).toContain("## https://ta93abe.com/works/");
		expect(full).toContain("## https://ta93abe.com/blog/hello-world/");
		expect(full).toContain(SITE.name);
		expect(full).toContain(SITE.tagline);
		expect(full).toContain(SITE.handle);
		for (const work of FEATURED_WORKS) {
			expect(full).toContain(`[${work.title}](${work.href})`);
			expect(full).toContain(work.excerpt);
		}
		expect(full).toContain("# Hello & Friends");
		expect(full).toContain(SNOWFLAKE_BODY);
		expect(full).toContain(
			"Content-Signal: ai-train=no, search=yes, ai-input=yes",
		);
	});

	it("keeps llms.txt as an index and llms-full.txt as the inlined corpus", () => {
		const posts = [{ ...HELLO, body: SNOWFLAKE_BODY }];
		const index = buildLlmsBlogSection(posts, "https://ta93abe.com");
		const full = buildLlmsFullDocument(posts, "https://ta93abe.com");

		expect(index).toContain(
			"[Hello & Friends](https://ta93abe.com/blog/hello-world/)",
		);
		expect(index).toContain("最初の <投稿>");
		expect(index).not.toContain(SNOWFLAKE_BODY);
		expect(full).toContain(SNOWFLAKE_BODY);
		expect(full.length).toBeGreaterThan(index.length);
	});

	it("rebuilds the corpus from current published markdown and drops old bodies", async () => {
		const bucket = createMemoryR2();
		await bucket.put("md/blog/hello-world.md", SAMPLE);
		await rebuildContentIndexes(bucket);

		const first = await buildLlmsFullText(bucket, "https://ta93abe.com");
		expect(first).toContain("Published from R2.");
		expect(first).toContain("## https://ta93abe.com/blog/hello-world/");

		await bucket.put(
			"md/blog/hello-world.md",
			`---
title: Hello Workers
excerpt: Stage 5 note
date: 2026-08-30
---

Updated body from R2.
`,
		);
		await bucket.put(
			"md/gallery/secret.md",
			`---
title: Secret Piece
excerpt: unpublished collection
publish_date: 2026-08-30
mediaType: drawing
coverImage: https://images.ta93abe.com/content/gallery/secret/cover.jpg
---

Secret gallery body that must not leak.
`,
		);
		await rebuildContentIndexes(bucket);

		const updated = await buildLlmsFullText(bucket, "https://ta93abe.com");
		expect(updated).toContain("Updated body from R2.");
		expect(updated).not.toContain("Published from R2.");
		expect(updated).not.toContain("Secret gallery body that must not leak.");
		expect(updated).not.toMatch(/\/gallery\//);
	});
});
