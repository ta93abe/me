const SITE_URL = "https://ta93abe.com";
const SITE_HOST = "ta93abe.com";

export const AGENT_SKILL_NAME = "site-overview";
export const AGENT_SKILL_PATH = `/.well-known/agent-skills/${AGENT_SKILL_NAME}/SKILL.md`;
export const AGENT_SKILL_DESCRIPTION =
	"Understand and summarize the public content, discovery files, and crawl preferences for ta93abe.com. Use when navigating or explaining this site.";

export const AGENT_SKILL_MARKDOWN = `---
name: ${AGENT_SKILL_NAME}
description: ${AGENT_SKILL_DESCRIPTION}
---

# Site Overview

Use this skill when an agent needs to understand or summarize ${SITE_HOST}.

## What this site contains

- Technical blog posts.
- Public slide links.
- Tool, gadget, and social-link directories.

## How to use

1. Start with ${SITE_URL}/llms.txt for a concise overview.
2. Use ${SITE_URL}/sitemap-index.xml for URL discovery.
3. Respect robots.txt and Content-Signal preferences.
`;

async function sha256Digest(value: string): Promise<string> {
	const bytes = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return `sha256:${[...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("")}`;
}

export async function agentSkillsIndex() {
	return {
		$schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
		skills: [
			{
				name: AGENT_SKILL_NAME,
				type: "skill-md",
				description: AGENT_SKILL_DESCRIPTION,
				url: AGENT_SKILL_PATH,
				digest: await sha256Digest(AGENT_SKILL_MARKDOWN),
			},
		],
	};
}
