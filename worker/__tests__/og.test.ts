import { describe, expect, it } from "vitest";

import { ogTitleFontSize, wrapOgTitle } from "../../src/utils/og/card.ts";
import { ogTitleFromEntries, parseOgBlogPath } from "../content/og.ts";

describe("blog OG from index", () => {
	it("parses /og/blog/:slug.png", () => {
		expect(parseOgBlogPath("/og/blog/hello-world.png")).toBe("hello-world");
		expect(parseOgBlogPath("/og/blog/Hello.png")).toBeNull();
		expect(parseOgBlogPath("/og/default.png")).toBeNull();
	});

	it("resolves a title from blog index entries", () => {
		expect(
			ogTitleFromEntries(
				[
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
				],
				"hello-world",
			),
		).toBe("Hello");
		expect(ogTitleFromEntries([], "hello-world")).toBeNull();
	});
});

describe("OG title wrapping", () => {
	it("keeps a short title on one line", () => {
		expect(wrapOgTitle("Hello")).toEqual(["Hello"]);
	});

	it("wraps a long Japanese title onto multiple lines", () => {
		const title =
			"Cloudflare Workers でブログ記事の OGP 画像にタイトルを載せる";
		const lines = wrapOgTitle(title, ogTitleFontSize(title));
		expect(lines.length).toBeGreaterThan(1);
		expect(lines.join("")).not.toContain("\n");
		expect(lines.join("")).toContain("OGP");
	});

	it("ellipsizes titles that exceed three lines", () => {
		const title = "あ".repeat(120);
		const lines = wrapOgTitle(title, 48);
		expect(lines).toHaveLength(3);
		expect(lines.at(-1)).toMatch(/…$/);
	});

	it("breaks Latin titles on word boundaries", () => {
		const title = "Generating beautiful Open Graph images for every blog post";
		const lines = wrapOgTitle(title, 48);
		expect(lines.length).toBeGreaterThan(1);
		for (const line of lines) {
			expect(line.startsWith(" ")).toBe(false);
			expect(line.endsWith(" ")).toBe(false);
		}
	});
});
