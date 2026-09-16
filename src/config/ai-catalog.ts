import { SITE } from "./site";

/** ARD capability catalog（isitagentready `discovery.ard` の HTML / HTTP Link 経路）。 */
export const AI_CATALOG_PATH = "/.well-known/ai-catalog.json";
export const AI_CATALOG_REL = "ai-catalog";
export const AI_CATALOG_TYPE = "application/json";

export function aiCatalogUrl(siteUrl: string = SITE.url): string {
	const base = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
	return new URL(AI_CATALOG_PATH, base).href;
}

/** ホーム HTML の HTTP `Link` に載せる RFC 8288 値。既存 DISCOVERY_LINKS と同じ相対 path 形式。 */
export function aiCatalogHttpLink(): string {
	return `<${AI_CATALOG_PATH}>; rel="${AI_CATALOG_REL}"; type="${AI_CATALOG_TYPE}"`;
}
