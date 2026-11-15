import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("published content", () => {
	it("keeps only blog posts as MDX in src/content (ADR-0003)", () => {
		const contentDir = join(process.cwd(), "src/content");
		expect(readdirSync(contentDir)).toEqual(["blog"]);
		const posts = readdirSync(join(contentDir, "blog"));
		expect(posts.length).toBeGreaterThan(0);
		for (const file of posts) {
			expect(file).toMatch(/^[a-z0-9][a-z0-9-]*\.mdx$/);
		}
	});
});
