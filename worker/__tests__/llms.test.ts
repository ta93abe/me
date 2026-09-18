import { describe, expect, it } from "vitest";

import {
	LLMS_MACHINE_RESOURCES,
	LLMS_PRIMARY_SECTIONS,
	LLMS_SITE_DESCRIPTION,
	LLMS_SITE_TITLE,
	buildLlmsFullText,
	buildLlmsOverviewMarkdown,
	formatLlmsFileListItem,
} from "../content/llms.ts";

const ORIGIN = "https://ta93abe.com";
const BLOG_SECTION = `## Blog

- [Hello World](${ORIGIN}/blog/hello-world/) — 最初の Pubme 投稿
`;

const FILE_LIST_LINK = /^- \[[^\]]+\]\(https:\/\/[^)\s]+\)/;
const BARE_LABEL_URL = /^- [^[][^:]*: https:\/\//;

function fileListsByH2(markdown: string): {
	heading: string;
	items: string[];
}[] {
	return markdown
		.split(/^## /m)
		.slice(1)
		.map((block) => {
			const [headingLine, ...lines] = block.split("\n");
			return {
				heading: headingLine.trim(),
				items: lines
					.map((line) => line.trimEnd())
					.filter((line) => line.startsWith("- ")),
			};
		})
		.filter((section) => section.items.length > 0);
}

describe("llms.txt file lists", () => {
	it("keeps the H1, site overview, and blog canonical URLs", () => {
		const markdown = buildLlmsOverviewMarkdown(ORIGIN, BLOG_SECTION);

		expect(markdown.startsWith(`# ${LLMS_SITE_TITLE}\n`)).toBe(true);
		expect(markdown).toContain(LLMS_SITE_DESCRIPTION);
		expect(markdown).toContain(`[Hello World](${ORIGIN}/blog/hello-world/)`);
	});

	it("uses markdown hyperlinks in every H2 file-list item", () => {
		const markdown = buildLlmsOverviewMarkdown(ORIGIN, BLOG_SECTION);
		const sections = fileListsByH2(markdown);

		expect(sections.map((section) => section.heading)).toEqual([
			"Primary sections",
			"Machine-readable resources",
			"Blog",
		]);

		for (const section of sections) {
			expect(section.items.length).toBeGreaterThan(0);
			for (const item of section.items) {
				expect(item, `${section.heading}: ${item}`).toMatch(FILE_LIST_LINK);
				expect(item, `${section.heading}: ${item}`).not.toMatch(BARE_LABEL_URL);
			}
		}
	});

	it("formats Primary sections and machine-readable resources with notes", () => {
		const markdown = buildLlmsOverviewMarkdown(ORIGIN, BLOG_SECTION);

		expect(LLMS_PRIMARY_SECTIONS).toHaveLength(8);
		expect(LLMS_MACHINE_RESOURCES).toHaveLength(7);

		for (const item of [...LLMS_PRIMARY_SECTIONS, ...LLMS_MACHINE_RESOURCES]) {
			expect(markdown).toContain(formatLlmsFileListItem(item, ORIGIN));
			expect(item.path.startsWith("/")).toBe(true);
			expect(item.description.length).toBeGreaterThan(0);
		}

		expect(markdown).toContain(
			`- [About](${ORIGIN}/about/): Profile of Takumi Abe.`,
		);
		expect(markdown).toContain(
			`- [API catalog](${ORIGIN}/.well-known/api-catalog): Machine-readable API catalog.`,
		);
	});

	it("reuses the same overview for llms-full.txt and keeps agent guidance", () => {
		const overview = buildLlmsOverviewMarkdown(ORIGIN, BLOG_SECTION);
		const full = buildLlmsFullText(overview, {
			siteUrl: ORIGIN,
			siteHost: "ta93abe.com",
			contentSignal: "ai-train=no, search=yes, ai-input=yes",
		});

		expect(full.startsWith(overview)).toBe(true);
		expect(full).toContain("## Agent guidance");
		expect(full).toContain("## Content usage preference");
		expect(full).toContain(
			"Content-Signal: ai-train=no, search=yes, ai-input=yes",
		);
		expect(full).toContain(`${ORIGIN}/sitemap-index.xml`);

		const overviewLists = fileListsByH2(overview).filter((section) =>
			["Primary sections", "Machine-readable resources"].includes(
				section.heading,
			),
		);
		const fullLists = fileListsByH2(full).filter((section) =>
			["Primary sections", "Machine-readable resources"].includes(
				section.heading,
			),
		);
		expect(fullLists).toEqual(overviewLists);
	});
});
