import { describe, expect, it } from "vitest";

import { buildSiteOverviewMarkdown } from "../content/site-overview.ts";

const ORIGIN = "https://ta93abe.com";
const MARKDOWN_HREF = /\[([^\]]+)\]\((https:[^)\s]+)\)/g;

function markdownHrefs(markdown: string): string[] {
	return [...markdown.matchAll(MARKDOWN_HREF)].map((match) => match[2]);
}

describe("llms site overview", () => {
	it("exposes RSS and sitemap-index as markdown links in Machine-readable resources", () => {
		const markdown = buildSiteOverviewMarkdown(ORIGIN, "");
		const machine = markdown.split("## Machine-readable resources")[1] ?? "";
		const hrefs = markdownHrefs(machine);

		expect(machine).toContain("[RSS](https://ta93abe.com/rss.xml)");
		expect(machine).toContain(
			"[Sitemap](https://ta93abe.com/sitemap-index.xml)",
		);
		expect(hrefs).toContain("https://ta93abe.com/rss.xml");
		expect(hrefs).toContain("https://ta93abe.com/sitemap-index.xml");
	});

	it("keeps the existing machine-readable discovery documents", () => {
		const markdown = buildSiteOverviewMarkdown(ORIGIN, "## Blog\n");

		expect(markdown).toContain("# Takumi Abe / ta93abe");
		expect(markdown).toContain("https://ta93abe.com/llms.txt");
		expect(markdown).toContain("https://ta93abe.com/.well-known/api-catalog");
		expect(markdown).toContain("## Blog");
	});
});
