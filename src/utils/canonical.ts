/**
 * HTML ページの canonical。sitemap と同じく、拡張子のないパスは末尾スラッシュ。
 */
export function withTrailingSlash(pathname: string): string {
	const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
	if (path === "/") {
		return path;
	}
	return path.endsWith("/") ? path : `${path}/`;
}

function hasFileExtension(pathname: string): boolean {
	const last = pathname.split("/").pop() ?? "";
	return last.includes(".");
}

export function canonicalPageUrl(
	pathnameOrUrl: string,
	site: string | URL,
): URL {
	const url = new URL(pathnameOrUrl, site);
	url.hash = "";
	url.search = "";
	if (
		url.pathname !== "/" &&
		!url.pathname.endsWith("/") &&
		!hasFileExtension(url.pathname)
	) {
		url.pathname = `${url.pathname}/`;
	}
	return url;
}
