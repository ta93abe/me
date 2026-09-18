export const SITEMAP_INDEX_PATH = "/sitemap-index.xml";

export const SITEMAP_INDEX_ALIASES = [
	"/sitemap.xml",
	"/sitemap_index.xml",
] as const;

export function isSitemapIndexAlias(pathname: string): boolean {
	const normalized = pathname.replace(/\/+$/, "") || "/";
	return (SITEMAP_INDEX_ALIASES as readonly string[]).includes(normalized);
}
