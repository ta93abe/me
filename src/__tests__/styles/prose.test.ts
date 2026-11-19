import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const css = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "../../styles/global.css"),
	"utf8",
);

const tweetCss = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "../../styles/tweet-embed.css"),
	"utf8",
);

function declarationsIn(source: string, selector: string): string {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return (
		source.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? ""
	);
}

function declarations(selector: string): string {
	return declarationsIn(css, selector);
}

function tweetDeclarations(selector: string): string {
	return declarationsIn(tweetCss, selector);
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

	it("styles X post embeds as bordered sans-serif cards (shared with slides)", () => {
		const card = ":is(.prose, .slide-body) .tweet-embed";
		expect(css).toContain('@import "./tweet-embed.css";');
		expect(tweetDeclarations(card)).toContain(
			'font-family: "Inter", system-ui, sans-serif',
		);
		expect(tweetDeclarations(card)).toContain(
			"border: 1px solid var(--tweet-border)",
		);
		expect(tweetDeclarations(`${card} a`)).toContain("text-decoration: none");
		expect(tweetDeclarations(".prose")).toContain(
			"--tweet-border: var(--border-color)",
		);
		expect(tweetDeclarations(".slide-body")).toContain(
			"--tweet-border: var(--color-line)",
		);
		expect(tweetCss).not.toContain("tweet-embed-follow");
		expect(tweetCss).not.toContain("#1d9bf0");
		expect(
			tweetDeclarations(":is(.prose, .slide-body) .tweet-embed-text a"),
		).toContain("min-height: 24px");
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
		expect(declarations(".prose .embed-card")).toContain("min-height: 6.75rem");
		expect(declarations(".prose .embed-card-thumb")).toContain(
			"flex-shrink: 0",
		);
	});
});
