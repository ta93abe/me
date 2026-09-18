import { SITE } from "./site";

export type AgentDiscoveryRel =
	| "describedby"
	| "api-catalog"
	| "ai-catalog"
	| "ard"
	| "service-desc"
	| "alternate";

export type AgentDiscoveryResource = {
	rel: AgentDiscoveryRel;
	path: string;
	type: string;
	title?: string;
};

/**
 * HTTP `Link` と HTML `<link>` で揃える agent discovery 面。
 * rel / path / type は Worker の Link ヘッダと同じ。
 */
export const AGENT_DISCOVERY_RESOURCES = [
	{ rel: "describedby", path: "/llms.txt", type: "text/plain" },
	{ rel: "describedby", path: "/llms-full.txt", type: "text/plain" },
	{
		rel: "api-catalog",
		path: "/.well-known/api-catalog",
		type: "application/linkset+json",
	},
	{
		rel: "ai-catalog",
		path: "/.well-known/ai-catalog.json",
		type: "application/json",
	},
	{
		rel: "ard",
		path: "/.well-known/ard.json",
		type: "application/json",
	},
	{
		rel: "service-desc",
		path: "/.well-known/mcp/server-card.json",
		type: "application/json",
	},
	{
		rel: "describedby",
		path: "/.well-known/agent-skills/index.json",
		type: "application/json",
	},
	{
		rel: "service-desc",
		path: "/.well-known/agent-card.json",
		type: "application/json",
	},
	{
		rel: "describedby",
		path: "/auth.md",
		type: "text/markdown",
	},
] as const satisfies readonly AgentDiscoveryResource[];

/** HTML `<head>` 専用。RSS は少なくともホームで見えること（TA-902 / TA-915）。 */
export const AGENT_DISCOVERY_HTML_EXTRAS = [
	{
		rel: "alternate",
		path: "/rss.xml",
		type: "application/rss+xml",
		title: "ta93abe | Blog RSS Feed",
	},
] as const satisfies readonly AgentDiscoveryResource[];

export const AGENT_DISCOVERY_HTML_RESOURCES = [
	...AGENT_DISCOVERY_RESOURCES,
	...AGENT_DISCOVERY_HTML_EXTRAS,
] as const;

export function absoluteDiscoveryHref(
	path: string,
	siteUrl: string = SITE.url,
): string {
	const base = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
	return new URL(path, base).href;
}

export function toHttpLinkValue(resource: AgentDiscoveryResource): string {
	return `<${resource.path}>; rel="${resource.rel}"; type="${resource.type}"`;
}

/** isitagentready の `discoverability.linkHeaders` と揃えた HTTP Link 値。 */
export const AGENT_DISCOVERY_HTTP_LINK_HEADER =
	AGENT_DISCOVERY_RESOURCES.map(toHttpLinkValue).join(", ");

export function htmlDiscoveryLinks(
	siteUrl: string = SITE.url,
): readonly (AgentDiscoveryResource & { href: string })[] {
	return AGENT_DISCOVERY_HTML_RESOURCES.map((resource) => ({
		...resource,
		href: absoluteDiscoveryHref(resource.path, siteUrl),
	}));
}
