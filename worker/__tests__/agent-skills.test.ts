import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
	AGENT_SKILL_MARKDOWN,
	AGENT_SKILL_NAME,
	AGENT_SKILL_PATH,
	agentSkillsIndex,
} from "../agent-skills.ts";
import { parseMarkdownDocument } from "../content/frontmatter.ts";

const SITE_URL = "https://ta93abe.com";
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OVERVIEW_ONLY_BYTES = 413;

function parentDirectoryName(path: string): string {
	const parts = path.split("/").filter(Boolean);
	return parts[parts.length - 2] ?? "";
}

function sha256DigestFromRawBytes(value: string): string {
	return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function markdownLink(label: string, href: string): string {
	return `[${label}](${href})`;
}

describe("site-overview SKILL.md", () => {
	it("starts with required Agent Skills YAML frontmatter", () => {
		const parsed = parseMarkdownDocument(AGENT_SKILL_MARKDOWN);

		expect(AGENT_SKILL_MARKDOWN.startsWith("---\n")).toBe(true);
		expect(parsed.frontmatter.name).toBe("site-overview");
		expect(parsed.frontmatter.name).toBe(AGENT_SKILL_NAME);
		expect(parsed.frontmatter.name).toBe(parentDirectoryName(AGENT_SKILL_PATH));

		const name = String(parsed.frontmatter.name);
		expect(name).toMatch(SKILL_NAME_PATTERN);
		expect(name.length).toBeGreaterThanOrEqual(1);
		expect(name.length).toBeLessThanOrEqual(64);

		const description = String(parsed.frontmatter.description);
		expect(description.length).toBeGreaterThanOrEqual(1);
		expect(description.length).toBeLessThanOrEqual(1024);
		expect(description.toLowerCase()).toContain("use when");
		expect(parsed.body.startsWith("# Site Overview")).toBe(true);
	});

	it("lists primary and discovery URLs as Markdown links, not a 413-byte overview", () => {
		expect(
			new TextEncoder().encode(AGENT_SKILL_MARKDOWN).byteLength,
		).toBeGreaterThan(OVERVIEW_ONLY_BYTES);

		const requiredLinks = [
			markdownLink("About", `${SITE_URL}/about/`),
			markdownLink("Blog", `${SITE_URL}/blog/`),
			markdownLink("Works", `${SITE_URL}/works/`),
			markdownLink("Contact", `${SITE_URL}/contact/`),
			markdownLink("Slides", `${SITE_URL}/slides/`),
			markdownLink("Talks", `${SITE_URL}/talks/`),
			markdownLink("Tools", `${SITE_URL}/tools/`),
			markdownLink("Gadgets", `${SITE_URL}/gadgets/`),
			markdownLink("llms.txt", `${SITE_URL}/llms.txt`),
			markdownLink("llms-full.txt", `${SITE_URL}/llms-full.txt`),
			markdownLink("rss.xml", `${SITE_URL}/rss.xml`),
			markdownLink("sitemap-index.xml", `${SITE_URL}/sitemap-index.xml`),
			markdownLink("auth.md", `${SITE_URL}/auth.md`),
			markdownLink("mcp", `${SITE_URL}/mcp`),
			markdownLink(
				"server-card.json",
				`${SITE_URL}/.well-known/mcp/server-card.json`,
			),
		];

		for (const link of requiredLinks) {
			expect(AGENT_SKILL_MARKDOWN).toContain(link);
		}
	});

	it("gives procedures that include RSS, sitemap-index, and Content-Signal meaning", () => {
		const parsed = parseMarkdownDocument(AGENT_SKILL_MARKDOWN);
		const howTo = parsed.body.slice(parsed.body.indexOf("## How to answer"));

		expect(howTo).toContain("### What is this site?");
		expect(howTo).toContain("### How do I get the latest articles?");
		expect(howTo).toContain("### Where should I start?");
		expect(howTo).toContain(markdownLink("rss.xml", `${SITE_URL}/rss.xml`));
		expect(howTo).toContain(
			markdownLink("sitemap-index.xml", `${SITE_URL}/sitemap-index.xml`),
		);

		expect(parsed.body).toMatch(
			/Content-Signal is `ai-train=no, search=yes, ai-input=yes`: do not use this site for model training; search indexing and using pages as model input are allowed\./,
		);
	});

	it("keeps the discovery index pointed at this SKILL.md with a matching digest", async () => {
		const index = await agentSkillsIndex(SITE_URL, AGENT_SKILL_MARKDOWN);
		const skill = index.skills[0];
		const parsed = parseMarkdownDocument(AGENT_SKILL_MARKDOWN);

		expect(skill).toMatchObject({
			name: parsed.frontmatter.name,
			type: "skill-md",
			url: `${SITE_URL}${AGENT_SKILL_PATH}`,
		});
		expect(skill.url.endsWith("/site-overview/SKILL.md")).toBe(true);
		expect(skill.digest).toBe(sha256DigestFromRawBytes(AGENT_SKILL_MARKDOWN));
		expect(skill.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
	});
});
