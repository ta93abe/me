import { describe, expect, it } from "vitest";

import { toFeedPost, type BlogListItem } from "@/lib/content/blog";

import {
	buildBlogRssXml,
	buildBlogSitemapXml,
} from "../../../../worker/content/derived.ts";

function item(
	partial: Partial<BlogListItem> &
		Pick<BlogListItem, "slug" | "title" | "date">,
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
				date: new Date("2026-08-30"),
			}),
		].map(toFeedPost);

		const rss = buildBlogRssXml(posts, "https://ta93abe.com");
		const sitemap = buildBlogSitemapXml(posts, "https://ta93abe.com");

		expect(rss).toContain("/blog/hello-world/");
		expect(rss).toContain("<language>ja</language>");
		expect(rss).not.toContain("dbt-jobs");
		expect(sitemap).toContain("/blog/hello-world/");
		expect(sitemap).toContain("/blog/");
		expect(sitemap).not.toContain("dbt-jobs");
		expect(sitemap).not.toContain("/links/");
	});

	it("keeps empty feeds valid when R2 has no posts", () => {
		const rss = buildBlogRssXml([], "https://ta93abe.com");
		const sitemap = buildBlogSitemapXml([], "https://ta93abe.com");

		expect(rss).toContain("<language>ja</language>");
		expect(rss).not.toContain("<item>");
		expect(sitemap).toContain("/blog/");
		expect(sitemap).not.toContain("/blog/hello-world/");
	});
});
