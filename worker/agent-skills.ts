export const AGENT_SKILL_PATH =
	"/.well-known/agent-skills/site-overview/SKILL.md";
export const AGENT_SKILLS_SCHEMA =
	"https://schemas.agentskills.io/discovery/0.2.0/schema.json";

const SITE_OVERVIEW_DESCRIPTION =
	"Understand the public content, discovery files, and crawl preferences for ta93abe.com.";

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
				name: "site-overview",
				type: "skill-md",
				description: SITE_OVERVIEW_DESCRIPTION,
				url: skillArtifactUrl(siteUrl, AGENT_SKILL_PATH),
				digest: await sha256Digest(markdown),
			},
		],
	};
}
