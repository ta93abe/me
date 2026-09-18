import { describe, expect, it } from "vitest";

import {
	composeLinkHeader,
	hasMarkdownAlternateLink,
	markdownAlternateLinkHeader,
} from "@/utils/markdown-alternate";

describe("markdownAlternateLinkHeader", () => {
	it("uses the same URL as the HTML page, not a .md twin", () => {
		expect(markdownAlternateLinkHeader("https://ta93abe.com/")).toBe(
			'<https://ta93abe.com/>; rel="alternate"; type="text/markdown"',
		);
		expect(markdownAlternateLinkHeader("https://ta93abe.com/about/")).toBe(
			'<https://ta93abe.com/about/>; rel="alternate"; type="text/markdown"',
		);
	});
});

describe("hasMarkdownAlternateLink", () => {
	it("detects rel=alternate type=text/markdown without matching auth.md", () => {
		expect(
			hasMarkdownAlternateLink(
				'<https://ta93abe.com/>; rel="alternate"; type="text/markdown", </auth.md>; rel="describedby"; type="text/markdown"',
			),
		).toBe(true);
		expect(
			hasMarkdownAlternateLink(
				'</auth.md>; rel="describedby"; type="text/markdown"',
			),
		).toBe(false);
		expect(hasMarkdownAlternateLink(null)).toBe(false);
	});
});

describe("composeLinkHeader", () => {
	it("drops empty parts", () => {
		expect(composeLinkHeader(null, "", "a", undefined, "b")).toBe("a, b");
	});
});
