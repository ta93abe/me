const SITE_URL = "https://ta93abe.com";
const SITE_HOST = "ta93abe.com";
const SITE_TITLE = "Takumi Abe / ta93abe";

export const HOST_DID = `did:web:${SITE_HOST}`;
export const DID_WEB_PATH = "/.well-known/did.json";
export const AI_CATALOG_PATH = "/.well-known/ai-catalog.json";
export const ARD_MANIFEST_PATH = "/.well-known/ard.json";

export const AI_CATALOG_PATHS = [AI_CATALOG_PATH, ARD_MANIFEST_PATH] as const;

export const AI_CATALOG_CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
} as const;

export const AGENT_CATALOG_LINKS = [
	`<${AI_CATALOG_PATH}>; rel="ai-catalog"; type="application/json"`,
	`<${ARD_MANIFEST_PATH}>; rel="ard"; type="application/json"`,
].join(", ");

export function isAiCatalogPath(pathname: string): boolean {
	return (AI_CATALOG_PATHS as readonly string[]).includes(pathname);
}

export function didWebDocument() {
	return {
		"@context": ["https://www.w3.org/ns/did/v1"],
		id: HOST_DID,
		alsoKnownAs: [`${SITE_URL}/`],
		controller: HOST_DID,
	};
}

export function aiCatalog() {
	return {
		specVersion: "1.0",
		host: {
			displayName: SITE_TITLE,
			identifier: HOST_DID,
			documentationUrl: `${SITE_URL}/llms.txt`,
		},
		entries: [
			{
				identifier: `urn:air:${SITE_HOST}:mcp:site`,
				displayName: `${SITE_HOST} MCP server`,
				type: "application/mcp-server-card+json",
				url: `${SITE_URL}/.well-known/mcp/server-card.json`,
				description:
					"Read-only MCP server that returns a concise overview of the public ta93abe.com portfolio.",
				tags: ["mcp", "portfolio", "discovery"],
				capabilities: ["get_site_overview"],
				representativeQueries: [
					"MCP でサイト概要を取る",
					"What can the ta93abe.com MCP server do?",
					"get_site_overview で公開ページを要約して",
				],
			},
			{
				identifier: `urn:air:${SITE_HOST}:agent:site`,
				displayName: SITE_TITLE,
				type: "application/a2a-agent-card+json",
				url: `${SITE_URL}/.well-known/agent-card.json`,
				description:
					"A2A Agent Card for the public ta93abe.com portfolio site.",
				tags: ["a2a", "portfolio"],
				capabilities: ["site-overview"],
				representativeQueries: [
					"ta93abe.com のエージェントは何ができる？",
					"What can the ta93abe.com agent do?",
					"List the public sections of this site.",
				],
			},
			{
				identifier: `urn:air:${SITE_HOST}:skills:index`,
				displayName: "Agent Skills index",
				type: "application/json",
				url: `${SITE_URL}/.well-known/agent-skills/index.json`,
				description:
					"Index of Agent Skills published by ta93abe.com for crawl and discovery.",
				tags: ["skills", "discovery"],
				capabilities: ["site-overview"],
				representativeQueries: [
					"ta93abe.com の Agent Skills 一覧を出して",
					"Which agent skills does this site publish?",
					"Where is the skills index for ta93abe.com?",
				],
			},
			{
				identifier: `urn:air:${SITE_HOST}:skill:site-overview`,
				displayName: "Site Overview skill",
				type: "application/ai-skill+md",
				url: `${SITE_URL}/.well-known/agent-skills/site-overview/SKILL.md`,
				description:
					"Skill for understanding public content, discovery files, and crawl preferences on ta93abe.com.",
				tags: ["skill", "portfolio", "discovery"],
				capabilities: ["site-overview"],
				representativeQueries: [
					"How should an agent crawl ta93abe.com?",
					"ta93abe.com の公開セクションと発見 URL はどこ？",
					"Where are the public sections and discovery URLs?",
				],
			},
			{
				identifier: `urn:air:${SITE_HOST}:catalog:api`,
				displayName: "API Catalog",
				type: "application/linkset+json",
				url: `${SITE_URL}/.well-known/api-catalog`,
				description:
					"RFC 9727 linkset of machine-readable discovery documents on ta93abe.com.",
				tags: ["api-catalog", "linkset", "discovery"],
				capabilities: ["api-catalog"],
				representativeQueries: [
					"ta93abe.com の API catalog はどこ？",
					"Where is the RFC 9727 api-catalog for this site?",
					"List the discovery APIs on ta93abe.com",
				],
			},
			{
				identifier: `urn:air:${SITE_HOST}:doc:llms`,
				displayName: "llms.txt",
				type: "text/plain",
				url: `${SITE_URL}/llms.txt`,
				description:
					"Plain-text overview of public pages and machine-readable discovery URLs.",
				tags: ["llms.txt", "portfolio"],
				capabilities: ["site-overview"],
				representativeQueries: [
					"ta93abe.com のブログ一覧",
					"Summarize ta93abe.com for an LLM.",
					"List the public pages on this site.",
				],
			},
		],
	};
}
