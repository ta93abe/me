import { describe, expect, it } from "vitest";

import {
	advertisesMarkdownRepresentation,
	composeLinkHeader,
	homepageLinkValue,
	markdownAlternateLinkHeader,
} from "@/utils/markdown-alternate";

describe("advertisesMarkdownRepresentation", () => {
	it("is true only for the homepage until sitewide negotiation exists", () => {
		expect(advertisesMarkdownRepresentation("/")).toBe(true);
		expect(advertisesMarkdownRepresentation("")).toBe(true);
		expect(advertisesMarkdownRepresentation("/index.html")).toBe(true);
	});

	it("does not advertise pages that still return HTML for Accept: text/markdown", () => {
		expect(advertisesMarkdownRepresentation("/about")).toBe(false);
		expect(advertisesMarkdownRepresentation("/about/")).toBe(false);
		expect(advertisesMarkdownRepresentation("/blog/")).toBe(false);
		expect(advertisesMarkdownRepresentation("/blog/hello-world/")).toBe(false);
		expect(advertisesMarkdownRepresentation("/works/")).toBe(false);
	});
});

describe("markdownAlternateLinkHeader", () => {
	it("uses the same URL as the HTML page, not a .md twin", () => {
		expect(markdownAlternateLinkHeader("https://ta93abe.com/")).toBe(
			'<https://ta93abe.com/>; rel="alternate"; type="text/markdown"',
		);
	});
});

describe("homepageLinkValue", () => {
	const discovery = [
		'</llms.txt>; rel="describedby"; type="text/plain"',
		'</.well-known/agent-card.json>; rel="service-desc"; type="application/json"',
	].join(", ");

	it("prepends rel=alternate type=text/markdown for the homepage", () => {
		expect(homepageLinkValue(null, "https://ta93abe.com", discovery)).toBe(
			'<https://ta93abe.com/>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"; type="text/plain", </.well-known/agent-card.json>; rel="service-desc"; type="application/json"',
		);
	});

	it("keeps an existing Link value in front of discovery links", () => {
		const value = homepageLinkValue(
			'</rss.xml>; rel="alternate"',
			"https://ta93abe.com/",
			discovery,
		);
		expect(value.startsWith('</rss.xml>; rel="alternate", ')).toBe(true);
		expect(value).toContain(
			'<https://ta93abe.com/>; rel="alternate"; type="text/markdown"',
		);
	});
});

describe("composeLinkHeader", () => {
	it("drops empty parts", () => {
		expect(composeLinkHeader(null, "", "a", undefined, "b")).toBe("a, b");
	});
});
