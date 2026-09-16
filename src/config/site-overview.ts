import { SITE } from "./site";

const origin = SITE.url;

export const SITE_OVERVIEW = {
	site: `${origin}/`,
	sections: [
		`${origin}/about/`,
		`${origin}/works/`,
		`${origin}/blog/`,
		`${origin}/contact/`,
		`${origin}/slides/`,
		`${origin}/tools/`,
		`${origin}/gadgets/`,
		`${origin}/links/`,
	],
	discovery: {
		llms: `${origin}/llms.txt`,
		apiCatalog: `${origin}/.well-known/api-catalog`,
		mcpServerCard: `${origin}/.well-known/mcp/server-card.json`,
		agentSkills: `${origin}/.well-known/agent-skills/index.json`,
		agentCard: `${origin}/.well-known/agent-card.json`,
		auth: `${origin}/auth.md`,
	},
} as const;

export function mcpGetSiteOverviewResult(markdown: string) {
	return {
		content: [
			{
				type: "text" as const,
				text: markdown,
			},
		],
		structuredContent: { ...SITE_OVERVIEW },
	};
}
