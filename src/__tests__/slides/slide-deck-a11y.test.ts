import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = readFileSync(
	join(
		dirname(fileURLToPath(import.meta.url)),
		"../../layouts/SlideDeck.astro",
	),
	"utf8",
);

describe("SlideDeck accessibility landmarks (TA-1482)", () => {
	it("wraps the deck in main and names the progressbar", () => {
		expect(source).toContain('<main class="stage-wrap">');
		expect(source).toContain("</main>");
		expect(source).toContain('aria-label="スライドの進捗"');
		expect(source).toContain("aria-valuetext");
	});
});

describe("SlideDeck JSON-LD (TA-1540)", () => {
	it("emits Home › Slides › title breadcrumbs on the player only", () => {
		expect(source).toContain("generateBreadcrumbSchema");
		expect(source).toContain('{ name: "Slides", path: "/slides/" }');
		expect(source).toContain("stringifySchema(breadcrumbSchema)");
		expect(source).toMatch(
			/!print && \([\s\S]*stringifySchema\(breadcrumbSchema\)/,
		);
	});
});
