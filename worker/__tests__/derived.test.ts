import { describe, expect, it } from "vitest";

import {
	BLOG_RSS_KEY,
	LLMS_BLOG_KEY,
	SITEMAP_URLS_KEY,
	buildBlogRssXml,
	buildLlmsBlogSection,
	buildSitemapIndexXml,
	childSitemapLastmod,
	feedPostsFromEntries,
	lastmodFromFeedPosts,
	lastmodFromSitemapXml,
	loadSitemapIndexXml,
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
		const xml = buildSitemapIndexXml("https://ta93abe.com", {
			staticSitemap: "2026-09-01",
			blogSitemap: "2026-09-16",
		});
		expect(xml).toContain("https://ta93abe.com/sitemap-0.xml");
		expect(xml).toContain("https://ta93abe.com/sitemap-blog.xml");
		expect(xml).toMatch(
			/<loc>https:\/\/ta93abe.com\/sitemap-0.xml<\/loc>\s*<lastmod>2026-09-01<\/lastmod>/,
		);
		expect(xml).toMatch(
			/<loc>https:\/\/ta93abe.com\/sitemap-blog.xml<\/loc>\s*<lastmod>2026-09-16<\/lastmod>/,
		);
	});

	it("uses the newest lastmod in a child sitemap xml", () => {
		expect(
			lastmodFromSitemapXml(`
				<urlset>
					<url><lastmod>2026-01-01</lastmod></url>
					<url><lastmod>2026-09-16T15:00:00.000Z</lastmod></url>
				</urlset>
			`),
		).toBe("2026-09-16");
	});

	it("uses the newest post lastmod for the blog sitemap", () => {
		const revised: FeedPost = {
			...OLDER,
			revise_date: new Date("2026-09-16T00:00:00.000Z"),
		};
		expect(lastmodFromFeedPosts([HELLO, revised])).toBe("2026-09-16");
	});

	it("falls back to Last-Modified when the static sitemap has no lastmod", () => {
		expect(
			childSitemapLastmod(
				"<urlset><url><loc>https://ta93abe.com/</loc></url></urlset>",
				"Wed, 01 Apr 2026 12:00:00 GMT",
				new Date("2026-09-16T00:00:00.000Z"),
			),
		).toBe("2026-04-01");
	});

	it("rebuilds index lastmod after a newer blog post", async () => {
		const bucket = createMemoryR2();
		const staticXml =
			"<urlset><url><lastmod>2026-01-01</lastmod></url></urlset>";
		await bucket.put("md/blog/hello-world.md", SAMPLE);
		await rebuildContentIndexes(bucket);

		const first = await loadSitemapIndexXml(
			bucket,
			"https://ta93abe.com",
			{ xml: staticXml },
			new Date("2026-09-16T00:00:00.000Z"),
		);
		expect(first).toMatch(
			/<loc>https:\/\/ta93abe.com\/sitemap-0.xml<\/loc>\s*<lastmod>2026-01-01<\/lastmod>/,
		);
		expect(first).toMatch(
			/<loc>https:\/\/ta93abe.com\/sitemap-blog.xml<\/loc>\s*<lastmod>2026-08-30<\/lastmod>/,
		);

		await bucket.put(
			"md/blog/newer.md",
			`---
title: Newer
excerpt: later note
date: 2026-09-16
---

Published later.
`,
		);
		await rebuildContentIndexes(bucket);

		const second = await loadSitemapIndexXml(
			bucket,
			"https://ta93abe.com",
			{ xml: staticXml },
			new Date("2026-09-16T00:00:00.000Z"),
		);
		expect(second).toMatch(
			/<loc>https:\/\/ta93abe.com\/sitemap-blog.xml<\/loc>\s*<lastmod>2026-09-16<\/lastmod>/,
		);
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
		expect(purged).toContain("https://ta93abe.com/og/blog/hello-world.png");
	});
});
