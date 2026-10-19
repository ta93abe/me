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
const HTML_SUFFIX = ".html";
const INDEX_HTML_SUFFIX = "/index.html";

function isPassthroughPath(pathname: string): boolean {
	if (PASSTHROUGH_PATHS.has(pathname)) {
		return true;
	}
	return PASSTHROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** 404.html は Worker / assets の not_found_handling が使う実ファイル。 */
export function isHtmlFilenamePassthrough(pathname: string): boolean {
	return pathname === "/404.html" || pathname.endsWith("/404.html");
}

/**
 * `/about.html` → `/about`、`/about/index.html` → `/about/`、`/index.html` → `/`。
 * 404.html と非 HTML はそのまま。
 */
export function stripHtmlFilename(pathname: string): string {
	if (isHtmlFilenamePassthrough(pathname) || !pathname.endsWith(HTML_SUFFIX)) {
		return pathname;
	}
	if (pathname === "/index.html") {
		return "/";
	}
	if (pathname.endsWith(INDEX_HTML_SUFFIX)) {
		return pathname.slice(0, -"index.html".length);
	}
	return pathname.slice(0, -HTML_SUFFIX.length);
}

/**
 * `.html` / `index.html` を末尾スラッシュの正規パスへ。対象外は null。
 */
export function htmlFilenameCanonicalPath(pathname: string): string | null {
	if (isHtmlFilenamePassthrough(pathname) || !pathname.endsWith(HTML_SUFFIX)) {
		return null;
	}
	return withTrailingSlash(stripHtmlFilename(pathname));
}

/**
 * HTML ページで末尾スラッシュがないとき、301 先の絶対 URL を返す。
 * `/path.html` と `/path/index.html` も同じ正規 URL へまとめる。
 * ルート、404.html、その他ファイル、エージェント/API エンドポイントは対象外。
 *
 * TA-1439 の www→apex は `trailingSlashRedirectUrl` の結果を同じ Location に
 * 載せる想定なので、`.html` 正規化もここで行い二重リダイレクトにしない。
 */
export function trailingSlashRedirectUrl(url: URL): URL | null {
	const { pathname } = url;
	if (isPassthroughPath(pathname)) {
		return null;
	}

	const htmlPath = htmlFilenameCanonicalPath(pathname);
	if (htmlPath !== null) {
		const redirected = new URL(url);
		redirected.pathname = htmlPath;
		return redirected;
	}

	if (
		pathname === "/" ||
		pathname.endsWith("/") ||
		hasFileExtension(pathname)
	) {
		return null;
	}

	const redirected = new URL(url);
	redirected.pathname = `${pathname}/`;
	return redirected;
}

const APEX_HOSTNAME = "ta93abe.com";
const WWW_HOSTNAME = "www.ta93abe.com";

/**
 * www を apex へまとめる Location。末尾スラッシュ正規化も同じ URL に載せる（1 ホップ）。
 * apex やその他ホストでは null。
 */
export function wwwApexRedirectUrl(url: URL): URL | null {
	if (url.hostname !== WWW_HOSTNAME) {
		return null;
	}

	const dest = new URL(url);
	dest.protocol = "https:";
	dest.hostname = APEX_HOSTNAME;
	dest.port = "";
	return trailingSlashRedirectUrl(dest) ?? dest;
}

/** GET/HEAD は 301。それ以外はメソッドを保つ 308。 */
export function permanentRedirectStatus(method: string): 301 | 308 {
	const upper = method.toUpperCase();
	return upper === "GET" || upper === "HEAD" ? 301 : 308;
}

export function canonicalPageUrl(
	pathnameOrUrl: string,
	site: string | URL,
): URL {
	const url = new URL(pathnameOrUrl, site);
	url.hash = "";
	url.search = "";
	const htmlPath = htmlFilenameCanonicalPath(url.pathname);
	if (htmlPath !== null) {
		url.pathname = htmlPath;
		return url;
	}
	if (
		url.pathname !== "/" &&
		!url.pathname.endsWith("/") &&
		!hasFileExtension(url.pathname)
	) {
		url.pathname = `${url.pathname}/`;
	}
	return url;
}
