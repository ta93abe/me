export const SITEMAP_INDEX_PATH = "/sitemap-index.xml";
export const SITEMAP_XML_ALIAS_PATH = "/sitemap.xml";

export function sitemapIndexLocation(pathname: string): string | null {
	const normalized = pathname.replace(/\/+$/, "") || "/";
	return normalized === SITEMAP_XML_ALIAS_PATH ? SITEMAP_INDEX_PATH : null;
}
