import { describe, expect, it } from "vitest";

import {
	CONTENT_SIGNAL,
	DISCOVERY_LINKS,
	addPublicHtmlDiscoveryHeaders,
	appendHeaderToken,
	shouldAttachHtmlDiscoveryHeaders,
} from "../discovery-headers.ts";

function htmlRequest(path: string, method = "GET"): Request {
	return new Request(`https://ta93abe.com${path}`, { method });
}

function htmlResponse(init: ResponseInit & { body?: string } = {}): Response {
	const { body = "<html></html>", ...rest } = init;
	const headers = new Headers(rest.headers);
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "text/html; charset=utf-8");
	}
	return new Response(body, { ...rest, headers });
}

function discoveryHeaders(response: Response) {
	return {
		link: response.headers.get("Link"),
		contentSignal: response.headers.get("Content-Signal"),
		vary: response.headers.get("Vary"),
	};
}

describe("appendHeaderToken", () => {
	it("adds Accept without duplicating an existing token", () => {
		expect(appendHeaderToken(null, "Accept")).toBe("Accept");
		expect(appendHeaderToken("Accept-Encoding", "Accept")).toBe(
			"Accept-Encoding, Accept",
		);
		expect(appendHeaderToken("Accept", "Accept")).toBe("Accept");
		expect(appendHeaderToken("accept, Accept-Encoding", "Accept")).toBe(
			"accept, Accept-Encoding",
		);
	});
});

describe("shouldAttachHtmlDiscoveryHeaders", () => {
	it("accepts successful public HTML including blog index and posts", () => {
		const html = htmlResponse();
		expect(shouldAttachHtmlDiscoveryHeaders(htmlRequest("/"), html)).toBe(true);
		expect(shouldAttachHtmlDiscoveryHeaders(htmlRequest("/blog/"), html)).toBe(
			true,
		);
		expect(
			shouldAttachHtmlDiscoveryHeaders(htmlRequest("/blog/hello-world/"), html),
		).toBe(true);
		expect(shouldAttachHtmlDiscoveryHeaders(htmlRequest("/about/"), html)).toBe(
			true,
		);
	});

	it("skips 404, non-HTML, and noindex print/404 surfaces", () => {
		expect(
			shouldAttachHtmlDiscoveryHeaders(
				htmlRequest("/blog/hello-world/"),
				htmlResponse({ status: 404 }),
			),
		).toBe(false);
		expect(
			shouldAttachHtmlDiscoveryHeaders(
				htmlRequest("/blog/hello-world/"),
				new Response("{}", {
					headers: { "Content-Type": "application/json" },
				}),
			),
		).toBe(false);
		expect(
			shouldAttachHtmlDiscoveryHeaders(
				htmlRequest("/slides/deck/print/"),
				htmlResponse(),
			),
		).toBe(false);
		expect(
			shouldAttachHtmlDiscoveryHeaders(htmlRequest("/404"), htmlResponse()),
		).toBe(false);
	});
});

describe("addPublicHtmlDiscoveryHeaders", () => {
	it("matches homepage discovery headers on blog HTML", () => {
		const home = addPublicHtmlDiscoveryHeaders(
			htmlRequest("/"),
			htmlResponse(),
		);
		const post = addPublicHtmlDiscoveryHeaders(
			htmlRequest("/blog/hello-world/"),
			htmlResponse(),
		);
		const index = addPublicHtmlDiscoveryHeaders(
			htmlRequest("/blog/"),
			htmlResponse(),
		);

		expect(discoveryHeaders(home)).toEqual({
			link: DISCOVERY_LINKS,
			contentSignal: CONTENT_SIGNAL,
			vary: "Accept",
		});
		expect(discoveryHeaders(post)).toEqual(discoveryHeaders(home));
		expect(discoveryHeaders(index)).toEqual(discoveryHeaders(home));
		expect(home.headers.get("Link")).toContain('rel="describedby"');
		expect(home.headers.get("Link")).toContain(
			"/.well-known/mcp/server-card.json",
		);
		expect(home.headers.get("Link")).toContain("/.well-known/agent-card.json");
	});

	it("keeps existing Vary tokens and does not duplicate discovery Link", () => {
		const withVary = addPublicHtmlDiscoveryHeaders(
			htmlRequest("/blog/hello-world/"),
			htmlResponse({
				headers: { Vary: "Accept-Encoding" },
			}),
		);
		expect(withVary.headers.get("Vary")).toBe("Accept-Encoding, Accept");

		const alreadyNegotiated = addPublicHtmlDiscoveryHeaders(
			htmlRequest("/blog/hello-world/"),
			htmlResponse({
				headers: { Vary: "Accept" },
			}),
		);
		expect(alreadyNegotiated.headers.get("Vary")).toBe("Accept");

		const preloadOnly = addPublicHtmlDiscoveryHeaders(
			htmlRequest("/works/"),
			htmlResponse({
				headers: { Link: '</style.css>; rel="preload"; as="style"' },
			}),
		);
		expect(preloadOnly.headers.get("Link")).toBe(
			`</style.css>; rel="preload"; as="style", ${DISCOVERY_LINKS}`,
		);

		const existingLink = addPublicHtmlDiscoveryHeaders(
			htmlRequest("/about/"),
			htmlResponse({
				headers: {
					Link: `</style.css>; rel="preload"; as="style", ${DISCOVERY_LINKS}`,
				},
			}),
		);
		expect(existingLink.headers.get("Link")).toBe(
			`</style.css>; rel="preload"; as="style", ${DISCOVERY_LINKS}`,
		);
	});

	it("does not attach discovery headers to 404 HTML", () => {
		const missing = addPublicHtmlDiscoveryHeaders(
			htmlRequest("/blog/does-not-exist/"),
			htmlResponse({ status: 404 }),
		);
		expect(missing.status).toBe(404);
		expect(missing.headers.get("Link")).toBeNull();
		expect(missing.headers.get("Content-Signal")).toBeNull();
		expect(missing.headers.get("Vary")).toBeNull();
	});

	it("attaches discovery headers on HEAD for public HTML", () => {
		const head = addPublicHtmlDiscoveryHeaders(
			htmlRequest("/blog/hello-world/", "HEAD"),
			htmlResponse({ body: "" }),
		);
		expect(head.headers.get("Link")).toBe(DISCOVERY_LINKS);
		expect(head.headers.get("Content-Signal")).toBe(CONTENT_SIGNAL);
		expect(head.headers.get("Vary")).toBe("Accept");
	});
});
