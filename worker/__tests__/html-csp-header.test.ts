import { describe, expect, it } from "vitest";

import {
	extractCspFromHtml,
	promoteHtmlCspHeader,
} from "../html-csp-header.ts";

const HOME_CSP =
	"default-src 'self';img-src 'self' data: blob: https:;font-src 'self' data:;media-src 'self' blob:;connect-src 'self' https://*.i.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://cloudflareinsights.com;base-uri 'self';form-action 'self';worker-src 'self' blob:; script-src 'self' ; script-src-elem 'self' https://*.i.posthog.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com https://static.cloudflareinsights.com 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='; style-src 'self' ; style-src-elem 'self' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='; style-src-attr 'unsafe-inline';";

const HOME_HTML = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><script type="module" src="https://ta93abe.com/.webmcp/bridge.js"></script><title>Takumi Abe</title><meta http-equiv="content-security-policy" content="${HOME_CSP}"></head><body><main>home</main></body></html>`;

function htmlResponse(body: string, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "text/html; charset=utf-8");
	}
	return new Response(body, { ...init, headers });
}

describe("extractCspFromHtml", () => {
	it("reads the homepage-style compressed meta tag", () => {
		expect(extractCspFromHtml(HOME_HTML)).toBe(HOME_CSP);
	});

	it("accepts content before http-equiv and HTML entity quotes", () => {
		const html = `<html><head><meta content="default-src &#39;self&#39;" http-equiv="content-security-policy"></head></html>`;
		expect(extractCspFromHtml(html)).toBe("default-src 'self'");
	});

	it("returns null when the document has no CSP meta", () => {
		expect(extractCspFromHtml("<html><head></head></html>")).toBeNull();
	});
});

describe("promoteHtmlCspHeader", () => {
	it("copies the homepage meta CSP onto the response header", async () => {
		const promoted = await promoteHtmlCspHeader(htmlResponse(HOME_HTML));
		expect(promoted.headers.get("Content-Security-Policy")).toBe(HOME_CSP);
		expect(await promoted.text()).toBe(HOME_HTML);
	});

	it("leaves SSR HTML that already has a CSP header unchanged", async () => {
		const existing = "default-src 'self'; script-src 'self' 'sha256-bloghash='";
		const html =
			'<html><head><meta http-equiv="content-security-policy" content="default-src \'none\'"></head></html>';
		const promoted = await promoteHtmlCspHeader(
			htmlResponse(html, {
				headers: { "Content-Security-Policy": existing },
			}),
		);
		expect(promoted.headers.get("Content-Security-Policy")).toBe(existing);
		expect(await promoted.text()).toBe(html);
	});

	it("skips non-HTML and error responses", async () => {
		const json = new Response("{}", {
			headers: { "Content-Type": "application/json" },
		});
		expect(await promoteHtmlCspHeader(json)).toBe(json);

		const missing = htmlResponse(HOME_HTML, { status: 404 });
		expect(await promoteHtmlCspHeader(missing)).toBe(missing);
	});

	it("rebuilds HTML without adding a header when meta is absent", async () => {
		const html = "<html><head></head><body>ok</body></html>";
		const promoted = await promoteHtmlCspHeader(htmlResponse(html));
		expect(promoted.headers.get("Content-Security-Policy")).toBeNull();
		expect(await promoted.text()).toBe(html);
	});

	it("cannot recover CSP from an empty HEAD body", async () => {
		const promoted = await promoteHtmlCspHeader(htmlResponse(""));
		expect(promoted.headers.get("Content-Security-Policy")).toBeNull();
	});
});
