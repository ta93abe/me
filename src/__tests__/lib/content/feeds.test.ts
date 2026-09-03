import { describe, expect, it } from "vitest";

import {
	mergeBlogLists,
	toFeedPost,
	type BlogListItem,
} from "@/lib/content/blog";

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
	it("merges leftover Git posts into RSS and the blog sitemap", () => {
		const posts = mergeBlogLists(
			[
				item({
					slug: "hello-world",
					title: "Hello",
					excerpt: "from r2",
					date: new Date("2026-08-30"),
				}),
			],
			[
				item({
					slug: "dbt-jobs-composite-action",
					title: "dbt leftover",
					excerpt: "from git",
					date: new Date("2026-08-27"),
				}),
			],
		).map(toFeedPost);

		const rss = buildBlogRssXml(posts, "https://ta93abe.com");
		const sitemap = buildBlogSitemapXml(posts, "https://ta93abe.com");

		expect(rss).toContain("/blog/hello-world/");
		expect(rss).toContain("/blog/dbt-jobs-composite-action/");
		expect(sitemap).toContain("/blog/hello-world/");
		expect(sitemap).toContain("/blog/dbt-jobs-composite-action/");
		expect(sitemap).toContain("/blog/");
		expect(sitemap).not.toContain("/links/");
	});
});
