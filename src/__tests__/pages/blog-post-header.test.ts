import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "../../pages/blog/[id].astro"),
	"utf8",
);

describe("blog post header markup", () => {
	it("puts an ISO datetime on the published time element", () => {
		expect(source).toMatch(/<time[^>]*datetime=\{publishedTime\}/);
	});

	it("formats a single user-facing date line via formatBlogSurfaceDate", () => {
		expect(source).toContain(
			"formatBlogSurfaceDate(publish_date, revise_date)",
		);
		expect(source).not.toMatch(/rel="author"/);
	});

	it("keeps article author in head meta for SEO", () => {
		expect(source).toContain('property="article:author"');
		expect(source).toContain("SITE.author");
	});
});
