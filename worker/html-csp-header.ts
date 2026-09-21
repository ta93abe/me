import { isHtmlContentType } from "./markdown-response.ts";

const HEAD_SCAN_LIMIT = 100_000;

const CSP_META_TAG =
	/<meta\s+[^>]*http-equiv\s*=\s*["']content-security-policy["'][^>]*>/i;

function unescapeHtmlAttr(value: string): string {
	return value
		.replaceAll("&quot;", '"')
		.replaceAll("&#34;", '"')
		.replaceAll("&apos;", "'")
		.replaceAll("&#39;", "'")
		.replaceAll("&amp;", "&");
}

function attrValue(tag: string, name: string): string | null {
	const doubleQuoted = tag.match(
		new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i"),
	);
	if (doubleQuoted?.[1] !== undefined) {
		return unescapeHtmlAttr(doubleQuoted[1]);
	}
	const singleQuoted = tag.match(
		new RegExp(`\\s${name}\\s*=\\s*'([^']*)'`, "i"),
	);
	if (singleQuoted?.[1] !== undefined) {
		return unescapeHtmlAttr(singleQuoted[1]);
	}
	return null;
}

function headPrefix(html: string): string {
	const end = html.indexOf("</head>");
	if (end === -1) {
		return html.slice(0, HEAD_SCAN_LIMIT);
	}
	return html.slice(0, Math.min(end + "</head>".length, HEAD_SCAN_LIMIT));
}

/**
 * Astro が prerender HTML に埋め込む CSP meta からポリシー文字列を取る。
 * ハッシュはページごとに違うので、固定値ではなく HTML 側を正本にする。
 */
export function extractCspFromHtml(html: string): string | null {
	const tag = headPrefix(html).match(CSP_META_TAG)?.[0];
	if (!tag) {
		return null;
	}
	const content = attrValue(tag, "content");
	return content?.trim() ? content.trim() : null;
}

/**
 * prerender 面は Astro が CSP を meta にしか出さない。
 * HTTP ヘッダの方が強く、`/` など静的 HTML を SSR 面と揃える。
 * 既にヘッダがある応答（blog など）はそのまま返す。
 */
export async function promoteHtmlCspHeader(
	response: Response,
): Promise<Response> {
	if (!response.ok) {
		return response;
	}
	if (response.headers.has("Content-Security-Policy")) {
		return response;
	}
	if (!isHtmlContentType(response.headers.get("Content-Type"))) {
		return response;
	}

	const html = await response.text();
	const csp = extractCspFromHtml(html);
	if (!csp) {
		return new Response(html, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	}

	const headers = new Headers(response.headers);
	headers.set("Content-Security-Policy", csp);
	return new Response(html, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
