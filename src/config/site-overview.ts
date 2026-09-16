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
		auth: `${origin}/auth.md`,
		rss: `${origin}/rss.xml`,
		sitemap: `${origin}/sitemap-index.xml`,
	},
} as const;
