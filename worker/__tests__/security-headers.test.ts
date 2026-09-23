import { describe, expect, it } from "vitest";

import {
	SECURITY_HEADERS,
	STRICT_TRANSPORT_SECURITY,
	applyBaselineSecurityHeaders,
	withBaselineSecurityHeaders,
} from "../security-headers.ts";

describe("STRICT_TRANSPORT_SECURITY", () => {
	it("uses a one-year max-age without preload", () => {
		expect(STRICT_TRANSPORT_SECURITY).toMatch(/^max-age=31536000/);
		expect(STRICT_TRANSPORT_SECURITY).toContain("includeSubDomains");
		expect(STRICT_TRANSPORT_SECURITY.toLowerCase()).not.toContain("preload");
	});
});

describe("SECURITY_HEADERS", () => {
	it("includes HSTS alongside the worker baseline", () => {
		expect(SECURITY_HEADERS["Strict-Transport-Security"]).toBe(
			STRICT_TRANSPORT_SECURITY,
		);
		expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
	});
});

describe("applyBaselineSecurityHeaders", () => {
	it("adds HSTS without replacing an existing HTML CSP", () => {
		const headers = new Headers({
			"Content-Security-Policy": "default-src 'self'",
		});
		applyBaselineSecurityHeaders(headers);
		expect(headers.get("Strict-Transport-Security")).toBe(
			STRICT_TRANSPORT_SECURITY,
		);
		expect(headers.get("Content-Security-Policy")).toBe("default-src 'self'");
	});

	it("wraps SSR-style responses that only had CSP", async () => {
		const wrapped = withBaselineSecurityHeaders(
			new Response("<html></html>", {
				headers: {
					"Content-Type": "text/html; charset=utf-8",
					"Content-Security-Policy": "default-src 'self'",
				},
			}),
		);
		expect(wrapped.headers.get("Strict-Transport-Security")).toBe(
			STRICT_TRANSPORT_SECURITY,
		);
		expect(await wrapped.text()).toBe("<html></html>");
	});
});
