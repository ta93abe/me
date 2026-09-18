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

	it("puts an ISO datetime on the revised time when present", () => {
		expect(source).toMatch(/更新:[\s\S]*<time datetime=\{modifiedTime\}>/);
	});

	it("shows a visible author byline linking to the About canonical", () => {
		expect(source).toContain('rel="author"');
		expect(source).toContain("SITE.authorPath");
		expect(source).toContain("SITE.author");
	});
});
