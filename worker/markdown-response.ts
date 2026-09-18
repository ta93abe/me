import { htmlToAgentMarkdown } from "./html-to-markdown.ts";

export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";
export const MAX_HTML_BYTES_FOR_MARKDOWN = 2_097_152;

const BODY_HEADERS_TO_DROP = [
	"Content-Encoding",
	"Content-Range",
	"Transfer-Encoding",
	"ETag",
	"Last-Modified",
] as const;

export function acceptsMarkdown(request: Request): boolean {
	return (
		request.headers.get("Accept")?.toLowerCase().includes("text/markdown") ??
		false
	);
}

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

export function isHtmlContentType(value: string | null): boolean {
	return (value ?? "").toLowerCase().includes("text/html");
}

export function htmlOriginRequest(request: Request): Request {
	if (!acceptsMarkdown(request)) {
		return request;
	}
	const headers = new Headers(request.headers);
	headers.set("Accept", "text/html");
	headers.delete("If-None-Match");
	headers.delete("If-Modified-Since");
	return new Request(request, {
		method: "GET",
		headers,
	});
}

export function withAcceptVary(response: Response): Response {
	const contentType = response.headers.get("Content-Type") ?? "";
	if (
		!isHtmlContentType(contentType) &&
		!contentType.toLowerCase().includes("text/markdown")
	) {
		return response;
	}
	const headers = new Headers(response.headers);
	headers.set("Vary", appendHeaderToken(headers.get("Vary"), "Accept"));
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export async function markdownResponseFromHtml(
	request: Request,
	htmlResponse: Response,
	options: { contentSignal?: string } = {},
): Promise<Response | null> {
	if (!acceptsMarkdown(request) || !htmlResponse.ok) {
		return null;
	}
	if (!isHtmlContentType(htmlResponse.headers.get("Content-Type"))) {
		return null;
	}

	const html = await htmlResponse.clone().text();
	if (new TextEncoder().encode(html).byteLength > MAX_HTML_BYTES_FOR_MARKDOWN) {
		return null;
	}

	const converted = htmlToAgentMarkdown(html);
	const headers = new Headers(htmlResponse.headers);
	for (const name of BODY_HEADERS_TO_DROP) {
		headers.delete(name);
	}
	headers.set("Content-Type", MARKDOWN_CONTENT_TYPE);
	headers.set("Vary", appendHeaderToken(headers.get("Vary"), "Accept"));
	headers.set("X-Markdown-Tokens", String(converted.markdownTokens));
	headers.set("X-Original-Tokens", String(converted.originalTokens));
	if (options.contentSignal && !headers.has("Content-Signal")) {
		headers.set("Content-Signal", options.contentSignal);
	}
	const body = converted.markdown;
	headers.set(
		"Content-Length",
		String(new TextEncoder().encode(body).byteLength),
	);

	return new Response(request.method.toUpperCase() === "HEAD" ? null : body, {
		status: htmlResponse.status,
		statusText: htmlResponse.statusText,
		headers,
	});
}

export async function negotiateHtmlMarkdown(
	request: Request,
	htmlResponse: Response,
	options: { contentSignal?: string } = {},
): Promise<Response> {
	return (
		(await markdownResponseFromHtml(request, htmlResponse, options)) ??
		withAcceptVary(htmlResponse)
	);
}
