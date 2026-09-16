export const API_CATALOG_MEDIA_TYPE = "application/linkset+json; charset=utf-8";

export type ApiCatalogLink = {
	href: string;
	type?: string;
	title?: string;
};

export type ApiCatalogEntry = {
	anchor: string;
	item?: ApiCatalogLink[];
	"service-desc"?: ApiCatalogLink[];
	"service-doc"?: ApiCatalogLink[];
	"auth-endpoint"?: ApiCatalogLink[];
	describedby?: ApiCatalogLink[];
	status?: ApiCatalogLink[];
};

export type ApiCatalogDocument = {
	linkset: ApiCatalogEntry[];
};

/**
 * RFC 9727 API catalog: catalog-index `item` links plus per-API metadata.
 * MCP keeps `service-desc`; A2A uses `describedby` so the two do not collide
 * on the same context (TA-941).
 */
export function buildApiCatalog(siteUrl: string): ApiCatalogDocument {
	const catalogUrl = `${siteUrl}/.well-known/api-catalog`;
	const mcpUrl = `${siteUrl}/mcp`;
	const mcpCardUrl = `${siteUrl}/.well-known/mcp/server-card.json`;
	const a2aCardUrl = `${siteUrl}/.well-known/agent-card.json`;
	const skillsUrl = `${siteUrl}/.well-known/agent-skills/index.json`;
	const llmsUrl = `${siteUrl}/llms.txt`;
	const llmsFullUrl = `${siteUrl}/llms-full.txt`;
	const authMdUrl = `${siteUrl}/auth.md`;
	const authEndpointUrl = `${siteUrl}/agent/auth`;

	const serviceDoc: ApiCatalogLink[] = [
		{
			href: llmsUrl,
			type: "text/plain",
			title: "llms.txt",
		},
		{
			href: llmsFullUrl,
			type: "text/plain",
			title: "llms-full.txt",
		},
		{
			href: authMdUrl,
			type: "text/markdown",
			title: "Authentication notes",
		},
	];

	return {
		linkset: [
			{
				anchor: catalogUrl,
				item: [
					{
						href: mcpUrl,
						title: "MCP Streamable HTTP",
					},
					{
						href: mcpCardUrl,
						type: "application/json",
						title: "MCP Server Card",
					},
					{
						href: a2aCardUrl,
						type: "application/json",
						title: "A2A Agent Card",
					},
					{
						href: skillsUrl,
						type: "application/json",
						title: "Agent Skills index",
					},
				],
				"service-doc": serviceDoc,
				describedby: [
					{
						href: skillsUrl,
						type: "application/json",
					},
				],
			},
			{
				anchor: mcpUrl,
				"service-desc": [
					{
						href: mcpCardUrl,
						type: "application/json",
					},
				],
				"service-doc": serviceDoc,
				"auth-endpoint": [
					{
						href: authEndpointUrl,
						type: "application/json",
					},
				],
				status: [
					{
						href: siteUrl,
					},
				],
			},
			{
				anchor: a2aCardUrl,
				describedby: [
					{
						href: a2aCardUrl,
						type: "application/json",
					},
				],
				"service-doc": serviceDoc,
			},
		],
	};
}
