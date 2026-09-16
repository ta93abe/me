import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const css = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "../../styles/global.css"),
	"utf8",
);

function declarations(selector: string): string {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

describe("blog article prose", () => {
	it("paints the article body with primary ink, including the opening paragraph", () => {
		expect(declarations(".prose")).toContain("color: var(--text-primary)");
		expect(declarations(".prose > p:first-of-type")).not.toMatch(
			/color:\s*var\(--text-secondary\)/,
		);
		expect(declarations(".prose blockquote p")).toContain(
			"color: var(--text-primary)",
		);
	});

	it("styles X post embeds as bordered sans-serif cards", () => {
		expect(declarations(".prose .tweet-embed")).toContain(
			'font-family: "Inter", system-ui, sans-serif',
		);
		expect(declarations(".prose .tweet-embed")).toContain(
			"border: 1px solid var(--border-color)",
		);
		expect(declarations(".prose .tweet-embed a")).toContain(
			"text-decoration: none",
		);
	});

	it("styles YouTube embeds as bordered 16:9 cards", () => {
		expect(declarations(".prose .youtube-embed")).toContain(
			'font-family: "Inter", system-ui, sans-serif',
		);
		expect(declarations(".prose .youtube-embed")).toContain(
			"border: 1px solid var(--border-color)",
		);
		expect(declarations(".prose .youtube-embed-media")).toContain(
			"aspect-ratio: 16 / 9",
		);
		expect(declarations(".prose .youtube-embed-card")).toContain(
			"text-decoration: none",
		);
	});

	it("styles OGP link cards as bordered split thumbnails", () => {
		expect(declarations(".prose .embed-card")).toContain("display: flex");
		expect(declarations(".prose .embed-card")).toContain(
			"border: 1px solid var(--border-color)",
		);
		expect(declarations(".prose .embed-card")).toContain(
			"text-decoration: none",
		);
		expect(declarations(".prose .embed-card-thumb")).toContain(
			"flex-shrink: 0",
		);
	});
});
