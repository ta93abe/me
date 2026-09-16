const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=yes";

export const ALLOWED_USER_AGENTS = [
	"*",
	"GPTBot",
	"ChatGPT-User",
	"OAI-SearchBot",
	"ClaudeBot",
	"Claude-Web",
	"Google-Extended",
	"PerplexityBot",
	"CCBot",
	"Applebot",
	"Applebot-Extended",
	"Amazonbot",
	"meta-externalagent",
] as const;

export function buildRobotsTxt(siteOrigin: string): string {
	const origin = siteOrigin.replace(/\/+$/, "");
	const groups = ALLOWED_USER_AGENTS.map(
		(agent) => `User-agent: ${agent}\nAllow: /`,
	).join("\n\n");

	return `# robots.txt
${groups}

Content-Signal: ${CONTENT_SIGNAL}
Sitemap: ${origin}/sitemap-index.xml
`;
}
