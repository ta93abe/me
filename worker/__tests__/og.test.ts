import { describe, expect, it } from "vitest";

import {
	buildBlogOgSvg,
	ogTitleFromEntries,
	parseOgBlogPath,
} from "../content/og.ts";

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

	it("embeds the title in an SVG card", () => {
		const svg = buildBlogOgSvg("Hello & Friends");
		expect(svg).toContain("Hello &amp; Friends");
		expect(svg).toContain("Takumi Abe");
		expect(svg).toContain("ta93abe.com");
		expect(svg).not.toContain("Hello & Friends");
	});
});
