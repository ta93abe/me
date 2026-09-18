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

Public HTML is Japanese (\`lang=ja\`). Discovery files, including this skill, stay in English.

## What this site is

Personal portfolio for Takumi Abe (ta93abe), a software engineer who writes data platforms and CI, and also publishes drawing and music. Public pages do not require authentication.

## Primary sections

- [About](${SITE_URL}/about/)
- [Blog](${SITE_URL}/blog/)
- [Works](${SITE_URL}/works/)
- [Contact](${SITE_URL}/contact/)
- [Slides](${SITE_URL}/slides/)
- [Tools](${SITE_URL}/tools/)
- [Gadgets](${SITE_URL}/gadgets/)

## Discovery files

- Concise overview: [llms.txt](${SITE_URL}/llms.txt)
- Longer agent notes: [llms-full.txt](${SITE_URL}/llms-full.txt)
- Latest posts: [rss.xml](${SITE_URL}/rss.xml)
- Crawl map: [sitemap-index.xml](${SITE_URL}/sitemap-index.xml)
- Auth notes (anonymous public read): [auth.md](${SITE_URL}/auth.md)
- MCP endpoint: [mcp](${SITE_URL}/mcp)
- MCP server card: [server-card.json](${SITE_URL}/.well-known/mcp/server-card.json)

## Content-Signal

Content-Signal is \`ai-train=no, search=yes, ai-input=yes\`: do not use this site for model training; search indexing and using pages as model input are allowed.

## How to answer common questions

### What is this site?

1. Read [About](${SITE_URL}/about/) for the Japanese self-introduction.
2. Use [llms.txt](${SITE_URL}/llms.txt) for a short English map of sections and discovery URLs.

### How do I get the latest articles?

1. Fetch [rss.xml](${SITE_URL}/rss.xml) for the newest blog posts.
2. If you need every public URL, start from [sitemap-index.xml](${SITE_URL}/sitemap-index.xml).

### Where should I start?

1. Start at [llms.txt](${SITE_URL}/llms.txt).
2. For tools, read the [MCP server card](${SITE_URL}/.well-known/mcp/server-card.json), then POST to [mcp](${SITE_URL}/mcp).
3. Confirm public access in [auth.md](${SITE_URL}/auth.md).
4. Respect [robots.txt](${SITE_URL}/robots.txt) and the Content-Signal above.
`;

export const AGENT_SKILLS_SCHEMA =
	"https://schemas.agentskills.io/discovery/0.2.0/schema.json";

export function skillArtifactUrl(siteUrl: string, skillPath: string): string {
	return new URL(skillPath, siteUrl).href;
}

export async function sha256Digest(value: string): Promise<string> {
	const bytes = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return `sha256:${[...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("")}`;
}

export async function agentSkillsIndex(siteUrl: string, markdown: string) {
	return {
		$schema: AGENT_SKILLS_SCHEMA,
		skills: [
			{
				name: AGENT_SKILL_NAME,
				type: "skill-md",
				description: AGENT_SKILL_DESCRIPTION,
				url: skillArtifactUrl(siteUrl, AGENT_SKILL_PATH),
				digest: await sha256Digest(markdown),
			},
		],
	};
}
