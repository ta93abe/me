import { AGENT_DISCOVERY_HTTP_LINK_HEADER } from "../src/config/agent-discovery.ts";
import { SITE } from "../src/config/site.ts";
import { canonicalPageUrl } from "../src/utils/canonical.ts";
import {
	composeLinkHeader,
	hasMarkdownAlternateLink,
	markdownAlternateLinkHeader,
} from "../src/utils/markdown-alternate.ts";

export const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=yes";

export const DISCOVERY_LINKS = AGENT_DISCOVERY_HTTP_LINK_HEADER;

export function appendHeaderToken(value: string | null, token: string): string {
	if (!value) {
		return token;
	}

	const tokens = value
		.split(",")
		.map((part) => part.trim().toLowerCase())
		.filter(Boolean);

	return tokens.includes(token.toLowerCase()) ? value : `${value}, ${token}`;
}

function normalizePathname(pathname: string): string {
	return pathname.replace(/\/+$/, "") || "/";
}

function isHtmlContentType(contentType: string | null): boolean {
	return (contentType ?? "").toLowerCase().includes("text/html");
}

function isNoindexHtmlPath(pathname: string): boolean {
	const normalized = normalizePathname(pathname);
	// 404 テンプレート直打ち。欠落記事は status 404 側でも除外する。
	if (normalized === "/404") {
		return true;
	}
	// スライド印刷面は Layout で noindex。discovery を広告しない。
	return /^\/slides\/[^/]+\/print$/.test(normalized);
}

/**
 * 公開 HTML にホームと同種の agent discovery を付ける。
 * 対象外: 非 HTML、非 2xx（404 等）、noindex 面（印刷 HTML / /404）。
 * Vary は Accept を追記するだけなので Markdown negotiation を壊さない。
 */
export function shouldAttachHtmlDiscoveryHeaders(
	request: Request,
	response: Response,
): boolean {
	if (!response.ok) {
		return false;
	}
	if (!isHtmlContentType(response.headers.get("Content-Type"))) {
		return false;
	}
	return !isNoindexHtmlPath(new URL(request.url).pathname);
}

function markdownAlternateFor(request: Request): string {
	const href = canonicalPageUrl(new URL(request.url).pathname, SITE.url).href;
	return markdownAlternateLinkHeader(href);
}

function withDiscoveryLinkHeader(
	existing: string | null,
	request: Request,
): string {
	const base = hasMarkdownAlternateLink(existing)
		? existing
		: composeLinkHeader(markdownAlternateFor(request), existing);
	if (!base) {
		return DISCOVERY_LINKS;
	}
	if (base.includes("/llms.txt")) {
		return base;
	}
	return composeLinkHeader(base, DISCOVERY_LINKS);
}

export function addPublicHtmlDiscoveryHeaders(
	request: Request,
	response: Response,
): Response {
	if (!shouldAttachHtmlDiscoveryHeaders(request, response)) {
		return response;
	}

	const headers = new Headers(response.headers);
	headers.set("Link", withDiscoveryLinkHeader(headers.get("Link"), request));
	headers.set("Vary", appendHeaderToken(headers.get("Vary"), "Accept"));
	headers.set("Content-Signal", CONTENT_SIGNAL);

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
