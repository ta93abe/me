import { describe, expect, it } from "vitest";

import {
	addHomepageDiscoveryHeaders,
	DISCOVERY_LINKS,
	homepageDiscoveryLinkHeader,
} from "../discovery-headers.ts";

const siteUrl = "https://ta93abe.com";
const contentSignal = "ai-train=no, search=yes, ai-input=yes";

describe("homepageDiscoveryLinkHeader", () => {
	it("advertises the homepage itself as text/markdown", () => {
		const link = homepageDiscoveryLinkHeader(null, siteUrl);
		expect(
			link.startsWith(
				'<https://ta93abe.com/>; rel="alternate"; type="text/markdown", ',
			),
		).toBe(true);
		expect(link).toContain(DISCOVERY_LINKS);
		expect(link).not.toContain(".md>");
	});
});

describe("addHomepageDiscoveryHeaders", () => {
	it("adds markdown alternate and discovery links on the homepage", async () => {
		const next = addHomepageDiscoveryHeaders(
			new Request("https://ta93abe.com/"),
			new Response("<html></html>", {
				headers: { "Content-Type": "text/html; charset=utf-8" },
			}),
			{ siteUrl, contentSignal },
		);

		expect(next.headers.get("Link")).toContain(
			'<https://ta93abe.com/>; rel="alternate"; type="text/markdown"',
		);
		expect(next.headers.get("Link")).toContain(
			'</llms.txt>; rel="describedby"; type="text/plain"',
		);
		expect(next.headers.get("Vary")).toBe("Accept");
		expect(next.headers.get("Content-Signal")).toBe(contentSignal);
		expect(await next.text()).toBe("<html></html>");
	});

	it("does not advertise a markdown alternate on pages without negotiation", () => {
		const next = addHomepageDiscoveryHeaders(
			new Request("https://ta93abe.com/about/"),
			new Response("<html></html>"),
			{ siteUrl, contentSignal },
		);

		expect(next.headers.get("Link")).toBeNull();
		expect(next.headers.get("Vary")).toBeNull();
	});
});
