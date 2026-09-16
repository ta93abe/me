import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
	AGENT_SKILL_MARKDOWN,
	AGENT_SKILL_NAME,
	AGENT_SKILL_PATH,
	agentSkillsIndex,
} from "../agent-skills.ts";
import { parseMarkdownDocument } from "../content/frontmatter.ts";

const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parentDirectoryName(path: string): string {
	const parts = path.split("/").filter(Boolean);
	return parts[parts.length - 2] ?? "";
}

function sha256DigestFromRawBytes(value: string): string {
	return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
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

	it("keeps the discovery index digest aligned with SKILL.md raw bytes", async () => {
		const index = await agentSkillsIndex();
		const skill = index.skills[0];
		const parsed = parseMarkdownDocument(AGENT_SKILL_MARKDOWN);

		expect(skill).toMatchObject({
			name: parsed.frontmatter.name,
			type: "skill-md",
			url: AGENT_SKILL_PATH,
		});
		expect(skill.digest).toBe(sha256DigestFromRawBytes(AGENT_SKILL_MARKDOWN));
		expect(skill.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
	});
});
