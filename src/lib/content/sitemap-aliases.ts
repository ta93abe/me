export const SITEMAP_INDEX_PATH = "/sitemap-index.xml";

export const SITEMAP_INDEX_ALIASES = [
	"/sitemap.xml",
	"/sitemap_index.xml",
] as const;

function normalizeSitemapPath(pathname: string): string {
	return pathname.replace(/\/+$/, "") || "/";
}

export function isSitemapIndexAlias(pathname: string): boolean {
	return (SITEMAP_INDEX_ALIASES as readonly string[]).includes(
		normalizeSitemapPath(pathname),
	);
}

/** Search Console は送信 URL を 301 せず 200 の XML として読む。 */
export function isSitemapIndexDocument(pathname: string): boolean {
	const normalized = normalizeSitemapPath(pathname);
	return normalized === SITEMAP_INDEX_PATH || isSitemapIndexAlias(normalized);
}
