import {
	advertisesMarkdownRepresentation,
	homepageLinkValue,
} from "../src/utils/markdown-alternate.ts";

export const DISCOVERY_LINKS = [
	`</llms.txt>; rel="describedby"; type="text/plain"`,
	`</llms-full.txt>; rel="describedby"; type="text/plain"`,
	`</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"`,
	`</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"`,
	`</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"`,
	`</.well-known/agent-card.json>; rel="service-desc"; type="application/json"`,
].join(", ");

function appendHeaderToken(value: string | null, token: string): string {
	if (!value) {
		return token;
	}

	const tokens = value
		.split(",")
		.map((part) => part.trim().toLowerCase())
		.filter(Boolean);

	return tokens.includes(token.toLowerCase()) ? value : `${value}, ${token}`;
}

export function homepageDiscoveryLinkHeader(
	existingLink: string | null | undefined,
	siteUrl: string,
): string {
	return homepageLinkValue(existingLink, siteUrl, DISCOVERY_LINKS);
}

export function addHomepageDiscoveryHeaders(
	request: Request,
	response: Response,
	options: { siteUrl: string; contentSignal: string },
): Response {
	const url = new URL(request.url);
	if (!advertisesMarkdownRepresentation(url.pathname)) {
		return response;
	}

	const headers = new Headers(response.headers);
	headers.set(
		"Link",
		homepageDiscoveryLinkHeader(headers.get("Link"), options.siteUrl),
	);
	headers.set("Vary", appendHeaderToken(headers.get("Vary"), "Accept"));
	headers.set("Content-Signal", options.contentSignal);

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
