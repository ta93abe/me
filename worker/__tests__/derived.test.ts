import { describe, expect, it } from "vitest";

import { SITE } from "@/config/site";

import {
	readLinks,
	readWorks,
} from "../../src/__tests__/helpers/site-content.ts";
import {
	buildBlogRssXml,
	buildBlogSitemapXml,
	buildLlmsBlogSection,
	buildLlmsFullDocument,
	buildSitemapIndexXml,
	childSitemapLastmod,
	lastmodFromFeedPosts,
	lastmodFromSitemapXml,
	type FeedPost,
} from "../content/derived.ts";

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

describe("derived discovery feeds", () => {
	it("builds RSS with newest first and escaped XML", () => {
		const xml = buildBlogRssXml([HELLO, OLDER], "https://ta93abe.com");

		expect(xml).toContain("<title>ta93abe | Blog</title>");
		expect(xml).toContain(
			"<description>技術ブログ。Hello &amp; Friends、Older。</description>",
		);
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
});

const FEATURED_WORKS = readWorks();
const SITE_DATA = { works: FEATURED_WORKS, links: readLinks() };

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
			SITE_DATA,
		);

		expect(full).toContain("## https://ta93abe.com/about/");
		expect(full).toContain("## https://ta93abe.com/works/");
		expect(full).toContain("## https://ta93abe.com/blog/hello-world/");
		expect(full).toContain(SITE.name);
		expect(full).toContain(SITE.tagline);
		expect(full).toContain(SITE.handle);
		expect(full).toContain("- [GitHub](https://github.com/ta93abe)");
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
		const full = buildLlmsFullDocument(posts, "https://ta93abe.com", SITE_DATA);

		expect(index).toContain(
			"[Hello & Friends](https://ta93abe.com/blog/hello-world/)",
		);
		expect(index).not.toContain(SNOWFLAKE_BODY);
		expect(full).toContain(SNOWFLAKE_BODY);
		expect(full.length).toBeGreaterThan(index.length);
	});
});
