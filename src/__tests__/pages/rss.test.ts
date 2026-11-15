import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildBlogRssXml } from "../../../worker/content/derived.ts";
import { renderFeedHtml } from "../../../worker/content/feed-html.ts";

describe("/rss.xml", () => {
	it("builds RSS from blog posts with feed content", () => {
		const xml = buildBlogRssXml(
			[
				{
					slug: "hello-world",
					title: "Hello World",
					excerpt: "最初の投稿",
					publish_date: new Date("2026-08-30"),
					tags: [],
					contentHtml: renderFeedHtml("ブログを始めようじゃないか。"),
				},
			],
			"https://ta93abe.com",
		);

		expect(xml).toContain('<rss version="2.0"');
		expect(xml).toContain("<language>ja</language>");
		expect(xml).toMatch(/<lastBuildDate>.+GMT<\/lastBuildDate>/);
		expect(xml).toContain("https://ta93abe.com/blog/hello-world/");
		expect(xml).toContain("ブログを始めようじゃないか。");
	});

	it("stays on-demand and sends discovery headers", () => {
		const route = readFileSync(
			join(process.cwd(), "src/pages/rss.xml.ts"),
			"utf8",
		);
		expect(route).toContain("export const prerender = false;");
		expect(route).toContain('"application/rss+xml; charset=utf-8"');
		expect(route).toContain('"ai-train=no, search=yes, ai-input=yes"');
		expect(route).toContain('</llms.txt>; rel="describedby"');
	});
});
