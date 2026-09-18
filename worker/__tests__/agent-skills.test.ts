import { describe, expect, it } from "vitest";

import {
	AGENT_SKILL_PATH,
	AGENT_SKILLS_SCHEMA,
	agentSkillsIndex,
	sha256Digest,
	skillArtifactUrl,
} from "../agent-skills.ts";

const siteUrl = "https://ta93abe.com";
const markdown = `# Site Overview

Use this skill when an agent needs to understand or summarize ta93abe.com.
`;

describe("skillArtifactUrl", () => {
	it("resolves the skill path to an https origin URL", () => {
		expect(skillArtifactUrl(siteUrl, AGENT_SKILL_PATH)).toBe(
			"https://ta93abe.com/.well-known/agent-skills/site-overview/SKILL.md",
		);
	});

	it("keeps an already-absolute skill URL unchanged", () => {
		const absolute = "https://cdn.example.com/v2/skills/site-overview/SKILL.md";
		expect(skillArtifactUrl(siteUrl, absolute)).toBe(absolute);
	});
});

describe("agentSkillsIndex", () => {
	it("emits an https absolute skill URL instead of a site-relative path", async () => {
		const index = await agentSkillsIndex(siteUrl, markdown);
		const skill = index.skills[0];

		expect(skill).toBeDefined();
		expect(skill.url.startsWith("/")).toBe(false);
		expect(skill.url).toBe(
			"https://ta93abe.com/.well-known/agent-skills/site-overview/SKILL.md",
		);
		expect(new URL(skill.url).protocol).toBe("https:");
		expect(new URL(skill.url).pathname).toBe(AGENT_SKILL_PATH);
	});

	it("keeps the v0.2.0 discovery schema and a matching sha256 digest", async () => {
		const index = await agentSkillsIndex(siteUrl, markdown);
		const skill = index.skills[0];

		expect(index.$schema).toBe(AGENT_SKILLS_SCHEMA);
		expect(skill.name).toBe("site-overview");
		expect(skill.type).toBe("skill-md");
		expect(skill.digest).toBe(await sha256Digest(markdown));
		expect(skill.digest.startsWith("sha256:")).toBe(true);
	});
});
