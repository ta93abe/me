import { describe, expect, it } from "vitest";

import { toFeedPost, type BlogListItem } from "@/lib/content/blog";

import {
	buildBlogRssXml,
	buildBlogSitemapXml,
} from "../../../../worker/content/derived.ts";

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

describe("request-time feeds", () => {
	it("builds RSS and the blog sitemap from R2 posts only", () => {
		const posts = [
			item({
				slug: "hello-world",
				title: "Hello",
				excerpt: "from r2",
				publish_date: new Date("2026-08-30"),
			}),
		].map(toFeedPost);

		const rss = buildBlogRssXml(posts, "https://ta93abe.com");
		const sitemap = buildBlogSitemapXml(posts, "https://ta93abe.com");

		expect(rss).toContain("/blog/hello-world/");
		expect(rss).toContain("<language>ja</language>");
		expect(rss).not.toContain("dbt-jobs");
		expect(sitemap).toContain("/blog/hello-world/");
		expect(sitemap).toContain("/blog/");
		expect(sitemap).toMatch(
			/<loc>https:\/\/ta93abe\.com\/blog\/<\/loc>\s*<lastmod>2026-08-30<\/lastmod>/,
		);
		expect(sitemap).not.toContain("dbt-jobs");
		expect(sitemap).not.toContain("/links/");
	});

	it("sets /blog/ lastmod to the newest post lastmod", () => {
		const posts = [
			item({
				slug: "older-note",
				title: "Older",
				excerpt: "before",
				publish_date: new Date("2026-01-01T00:00:00.000Z"),
				revise_date: new Date("2026-09-16T00:00:00.000Z"),
			}),
			item({
				slug: "hello-world",
				title: "Hello",
				excerpt: "from r2",
				publish_date: new Date("2026-08-30T00:00:00.000Z"),
			}),
		].map(toFeedPost);

		const sitemap = buildBlogSitemapXml(posts, "https://ta93abe.com");

		expect(sitemap).toMatch(
			/<loc>https:\/\/ta93abe\.com\/blog\/<\/loc>\s*<lastmod>2026-09-16<\/lastmod>/,
		);
		expect(sitemap).toMatch(
			/<loc>https:\/\/ta93abe\.com\/blog\/hello-world\/<\/loc>\s*<lastmod>2026-08-30<\/lastmod>/,
		);
		expect(sitemap).toMatch(
			/<loc>https:\/\/ta93abe\.com\/blog\/older-note\/<\/loc>\s*<lastmod>2026-09-16<\/lastmod>/,
		);
	});

	it("keeps empty feeds valid when R2 has no posts", () => {
		const rss = buildBlogRssXml([], "https://ta93abe.com");
		const sitemap = buildBlogSitemapXml([], "https://ta93abe.com");

		expect(rss).toContain("<language>ja</language>");
		expect(rss).not.toContain("<item>");
		expect(sitemap).toContain("<urlset");
		expect(sitemap).not.toMatch(/<loc>https:\/\/ta93abe\.com\/blog\/<\/loc>/);
		expect(sitemap).not.toContain("/blog/hello-world/");
	});

	it("carries tags onto feed posts for RSS categories", () => {
		const posts = [
			item({
				slug: "snowflake",
				title: "Snowflake",
				excerpt: "warehouse",
				publish_date: new Date("2026-08-20"),
				tags: ["snowflake", "data"],
			}),
		].map(toFeedPost);

		expect(posts[0]?.tags).toEqual(["snowflake", "data"]);
		const rss = buildBlogRssXml(posts, "https://ta93abe.com");
		expect(rss).toContain("<category>snowflake</category>");
		expect(rss).toContain("<dc:creator>Takumi Abe</dc:creator>");
	});
});
