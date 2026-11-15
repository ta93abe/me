import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Divider", () => {
	it("is an accessible separator drawn with CSS-only styling", () => {
		const component = read("src/components/embeds/Divider.astro");
		expect(component).toContain('role="separator"');
		expect(component).toContain('aria-hidden="true"');
		expect(component).toContain("vector-effect: non-scaling-stroke");
		expect(component).not.toMatch(/<path[^>]*\sstyle=/);
	});

	it("renders Markdown --- in blog posts and is available in slides", () => {
		expect(read("src/pages/blog/[id].astro")).toContain("hr: Divider");
		expect(read("src/layouts/SlideDeck.astro")).toContain("Divider");
	});
});
