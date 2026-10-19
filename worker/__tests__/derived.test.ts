import { describe, expect, it } from "vitest";

import { FEATURED_WORKS, SITE } from "@/config/site";

import {
	BLOG_RSS_KEY,
	LLMS_BLOG_KEY,
	SITEMAP_URLS_KEY,
	buildBlogRssXml,
	buildBlogSitemapXml,
	buildLlmsBlogSection,
	buildLlmsFullDocument,
	buildLlmsFullText,
	buildSitemapIndexXml,
	childSitemapLastmod,
	feedPostsFromEntries,
	lastmodFromFeedPosts,
	lastmodFromGeneratedAt,
	lastmodFromSitemapXml,
	loadSitemapIndexXml,
	sitemapUrlEntries,
	writeDerivedDiscovery,
	type FeedPost,
} from "../content/derived.ts";
import {
	readCollectionIndex,
	rebuildContentIndexes,
} from "../content/index-store.ts";
import { collectionIndexKey } from "../content/keys.ts";
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

async function putBlogIndex(
	bucket: ReturnType<typeof createMemoryR2>,
	generatedAt: string,
	posts: Array<{ slug: string; date: string; revise?: string }>,
): Promise<void> {
	await bucket.put(
		collectionIndexKey("blog"),
		JSON.stringify({
			collection: "blog",
			generatedAt,
			entries: posts.map((post) => ({
				collection: "blog",
				slug: post.slug,
				title: post.slug,
				excerpt: "note",
				updatedAt: generatedAt,
				frontmatter: {
					title: post.slug,
					excerpt: "note",
					date: post.date,
					...(post.revise ? { revise_date: post.revise } : {}),
				},
			})),
		}),
	);
}

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
		expect(xml).toContain(
			`<lastBuildDate>${HELLO.publish_date.toUTCString()}</lastBuildDate>`,
		);
	});

	it("uses the provided build time for lastBuildDate when an older post is added", () => {
		const rebuiltAt = new Date("2026-09-16T12:00:00.000Z");
		const xml = buildBlogRssXml(
			[HELLO, OLDER],
			"https://ta93abe.com",
			rebuiltAt,
		);

		expect(xml).toContain(
			"<lastBuildDate>Wed, 16 Sep 2026 12:00:00 GMT</lastBuildDate>",
		);
		expect(xml).toContain("older-note");
		expect(xml).not.toContain(
			`<lastBuildDate>${HELLO.publish_date.toUTCString()}</lastBuildDate>`,
		);
	});

	it("puts Dublin Core creator, content HTML, and categories on each item", () => {
		const xml = buildBlogRssXml(
			[
				{
					...HELLO,
					tags: ["workers", "r2"],
					contentHtml:
						"<h2>課金スタック</h2><ul><li>Cursor</li></ul><script>alert(1)</script>",
				},
			],
			"https://ta93abe.com",
		);

		expect(xml).toContain(
			'xmlns:content="http://purl.org/rss/1.0/modules/content/"',
		);
		expect(xml).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"');
		expect(xml).toContain(
			`<lastBuildDate>${HELLO.publish_date.toUTCString()}</lastBuildDate>`,
		);
		expect(xml).toContain("<dc:creator>Takumi Abe</dc:creator>");
		expect(xml).toContain("<category>workers</category>");
		expect(xml).toContain("<category>r2</category>");
		expect(xml).toContain("<content:encoded><![CDATA[");
		expect(xml).toContain("<h2>課金スタック</h2>");
		expect(xml).toContain("<li>Cursor</li>");
		expect(xml).not.toContain("<script>");
		expect(xml).not.toContain("posthog");
	});

	it("strips XML 1.0 illegal characters from RSS text", () => {
		const xml = buildBlogRssXml(
			[
				{
					...HELLO,
					title: `Hello\u000B & Friends`,
					excerpt: "first\u000Bsecond",
					contentHtml: "<p>first\u000Bsecond</p>",
				},
			],
			"https://ta93abe.com",
		);

		expect(xml).not.toContain("\u000B");
		expect(xml).toContain("Hello &amp; Friends");
		expect(xml).toContain("firstsecond");
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
			"https://ta93abe.com/talks/",
			"https://ta93abe.com/tools/",
			"https://ta93abe.com/gadgets/",
		]);
		expect(
			urls.find((entry) => entry.loc.endsWith("/hello-world/"))?.lastmod,
		).toBe("2026-08-30");
		expect(
			urls.find((entry) => entry.loc === "https://ta93abe.com/blog/")?.lastmod,
		).toBe("2026-08-30");
		expect(locs.join(" ")).not.toMatch(/gallery|atelier|bookshelf/);
	});

	it("uses the newest revise_date for the blog index lastmod", () => {
		const urls = sitemapUrlEntries(
			[
				HELLO,
				{
					...OLDER,
					revise_date: new Date("2026-09-16T00:00:00.000Z"),
				},
			],
			"https://ta93abe.com",
		);

		expect(
			urls.find((entry) => entry.loc === "https://ta93abe.com/blog/")?.lastmod,
		).toBe("2026-09-16");
		expect(
			urls.find((entry) => entry.loc.endsWith("/hello-world/"))?.lastmod,
		).toBe("2026-08-30");
		expect(
			urls.find((entry) => entry.loc.endsWith("/older-note/"))?.lastmod,
		).toBe("2026-09-16");
	});

	it("lists published posts in the llms blog section", () => {
		const section = buildLlmsBlogSection([HELLO], "https://ta93abe.com");
		expect(section).toContain("## Blog");
		expect(section).toContain(
			"[Hello & Friends](https://ta93abe.com/blog/hello-world/)",
		);
		expect(section).toContain("最初の <投稿>");
	});

	it("stamps the blog index with the newest post lastmod", () => {
		const xml = buildBlogSitemapXml([HELLO, OLDER], "https://ta93abe.com");
		expect(xml).toMatch(
			/<loc>https:\/\/ta93abe.com\/blog\/<\/loc>\n    <lastmod>2026-08-30<\/lastmod>/,
		);
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

	it("prefers Last-Modified over URL lastmods for the static sitemap", () => {
		expect(
			childSitemapLastmod(
				"<urlset><url><lastmod>2026-09-16</lastmod></url></urlset>",
				"Wed, 01 Apr 2026 12:00:00 GMT",
				new Date("2026-09-16T00:00:00.000Z"),
			),
		).toBe("2026-04-01");
	});

	it("falls back to URL lastmods when Last-Modified is missing", () => {
		expect(
			childSitemapLastmod(
				"<urlset><url><lastmod>2026-01-01</lastmod></url></urlset>",
				null,
				new Date("2026-09-16T00:00:00.000Z"),
			),
		).toBe("2026-01-01");
	});

	it("ignores the empty blog index epoch as a lastmod", () => {
		expect(lastmodFromGeneratedAt(new Date(0).toISOString())).toBeUndefined();
	});

	it("uses blog index generatedAt so a backdated post still refreshes lastmod", async () => {
		const bucket = createMemoryR2();
		const staticXml =
			"<urlset><url><lastmod>2026-01-01</lastmod></url></urlset>";
		await putBlogIndex(bucket, "2026-09-16T00:00:00.000Z", [
			{ slug: "hello-world", date: "2026-09-16" },
		]);

		const first = await loadSitemapIndexXml(
			bucket,
			"https://ta93abe.com",
			{ xml: staticXml, lastModified: "Wed, 02 Apr 2026 12:00:00 GMT" },
			new Date("2026-09-16T00:00:00.000Z"),
		);
		expect(first).toMatch(
			/<loc>https:\/\/ta93abe.com\/sitemap-0.xml<\/loc>\s*<lastmod>2026-04-02<\/lastmod>/,
		);
		expect(first).toMatch(
			/<loc>https:\/\/ta93abe.com\/sitemap-blog.xml<\/loc>\s*<lastmod>2026-09-16<\/lastmod>/,
		);

		await putBlogIndex(bucket, "2026-09-18T12:00:00.000Z", [
			{ slug: "hello-world", date: "2026-09-16" },
			{ slug: "older-note", date: "2026-08-01" },
		]);

		const second = await loadSitemapIndexXml(
			bucket,
			"https://ta93abe.com",
			{ xml: staticXml, lastModified: "Wed, 02 Apr 2026 12:00:00 GMT" },
			new Date("2026-09-16T00:00:00.000Z"),
		);
		expect(second).toMatch(
			/<loc>https:\/\/ta93abe.com\/sitemap-blog.xml<\/loc>\s*<lastmod>2026-09-18<\/lastmod>/,
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
		const index = await readCollectionIndex(bucket, "blog");
		expect(await rss!.text()).toContain(
			`<lastBuildDate>${new Date(index.generatedAt).toUTCString()}</lastBuildDate>`,
		);
		expect(await sitemap!.text()).toContain("/blog/hello-world/");
		expect(await llms!.text()).toContain("Hello Workers");
	});

	it("embeds markdown body HTML in derived RSS without scripts or tweet cards", async () => {
		const bucket = createMemoryR2();
		await bucket.put(
			"md/blog/hello-world.md",
			`---
title: Hello Workers
excerpt: Stage 5 note
date: 2026-08-30
---

Published from R2.
`,
		);
		await bucket.put(
			"md/blog/coding-agent.md",
			`---
title: 最近使っているコーディングエージェント
excerpt: 最近使っているAI関連のサービス
publish_date: 2026-09-01
tags:
  - ai
---

## 課金スタック

- Cursor
- Claude Code

https://x.com/jack/status/20

<script>window.posthog.capture("x")</script>
`,
		);
		await bucket.put(
			"md/blog/snowflake.md",
			`---
title: Snowflake メモ
excerpt: warehouse notes
publish_date: 2026-08-20
tags:
  - snowflake
  - data
---

## なぜ warehouse を分けるか

本文。
`,
		);
		await rebuildContentIndexes(bucket);
		await writeDerivedDiscovery(bucket);

		const xml = await (await bucket.get(BLOG_RSS_KEY))!.text();
		expect(xml).toContain("<dc:creator>Takumi Abe</dc:creator>");
		expect(xml.match(/<dc:creator>Takumi Abe<\/dc:creator>/g)?.length).toBe(3);
		expect(xml).toContain("<p>Published from R2.</p>");
		expect(xml).toContain("<h2>課金スタック</h2>");
		expect(xml).toContain("<li>Cursor</li>");
		expect(xml).toContain("<h2>なぜ warehouse を分けるか</h2>");
		expect(xml).toContain("<category>snowflake</category>");
		expect(xml).not.toContain("<script>");
		expect(xml).not.toContain("posthog");
		expect(xml).not.toContain("tweet-embed");
		const index = await readCollectionIndex(bucket, "blog");
		expect(xml).toContain(
			`<lastBuildDate>${new Date(index.generatedAt).toUTCString()}</lastBuildDate>`,
		);
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
		expect(purged).toContain("https://ta93abe.com/sitemap.xml");
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

	it("keeps llms.txt blog index separate from the inlined corpus", () => {
		const posts = [{ ...HELLO, body: SNOWFLAKE_BODY }];
		const index = buildLlmsBlogSection(posts, "https://ta93abe.com");
		const full = buildLlmsFullDocument(posts, "https://ta93abe.com");

		expect(index).toContain(
			"[Hello & Friends](https://ta93abe.com/blog/hello-world/)",
		);
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
