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

const PASSTHROUGH_PATHS = new Set([
	"/mcp",
	"/a2a",
	"/agent/auth",
	"/agent/claim",
	"/api",
]);
const PASSTHROUGH_PREFIXES = ["/.well-known/", "/api/"] as const;

function isPassthroughPath(pathname: string): boolean {
	if (PASSTHROUGH_PATHS.has(pathname)) {
		return true;
	}
	return PASSTHROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * HTML ページで末尾スラッシュがないとき、301 先の絶対 URL を返す。
 * ルート、ファイル、エージェント/API エンドポイントは対象外。
 */
export function trailingSlashRedirectUrl(url: URL): URL | null {
	const { pathname } = url;
	if (
		pathname === "/" ||
		pathname.endsWith("/") ||
		hasFileExtension(pathname) ||
		isPassthroughPath(pathname)
	) {
		return null;
	}

	const redirected = new URL(url);
	redirected.pathname = `${pathname}/`;
	return redirected;
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
