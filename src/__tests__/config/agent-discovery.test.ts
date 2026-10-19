import { describe, expect, it } from "vitest";

import {
	AGENT_DISCOVERY_HTTP_LINK_HEADER,
	AGENT_DISCOVERY_HTML_RESOURCES,
	absoluteDiscoveryHref,
	htmlDiscoveryLinks,
} from "@/config/agent-discovery";
import { SITE } from "@/config/site";

describe("agent discovery links", () => {
	it("keeps the HTTP Link header identical to the current homepage discovery set", () => {
		expect(AGENT_DISCOVERY_HTTP_LINK_HEADER).toBe(
			[
				`</llms.txt>; rel="describedby"; type="text/plain"`,
				`</llms-full.txt>; rel="describedby"; type="text/plain"`,
				`</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"`,
				`</.well-known/ai-catalog.json>; rel="ai-catalog"; type="application/json"`,
				`</.well-known/ard.json>; rel="ard"; type="application/json"`,
				`</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"`,
				`</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"`,
				`</.well-known/agent-card.json>; rel="describedby"; type="application/json"`,
				`</auth.md>; rel="describedby"; type="text/markdown"`,
			].join(", "),
		);
	});

	it("exposes absolute HTML links that match HTTP rel / path / type, plus RSS", () => {
		const links = htmlDiscoveryLinks();
		const byPath = Object.fromEntries(
			links.map((link) => [new URL(link.href).pathname, link]),
		);

		expect(byPath["/llms.txt"]).toMatchObject({
			rel: "describedby",
			type: "text/plain",
			href: "https://ta93abe.com/llms.txt",
		});
		expect(byPath["/llms-full.txt"]).toMatchObject({
			rel: "describedby",
			type: "text/plain",
			href: "https://ta93abe.com/llms-full.txt",
		});
		expect(byPath["/.well-known/api-catalog"]).toMatchObject({
			rel: "api-catalog",
			type: "application/linkset+json",
			href: "https://ta93abe.com/.well-known/api-catalog",
		});
		expect(byPath["/.well-known/mcp/server-card.json"]).toMatchObject({
			rel: "service-desc",
			type: "application/json",
			href: "https://ta93abe.com/.well-known/mcp/server-card.json",
		});
		expect(byPath["/.well-known/agent-skills/index.json"]).toMatchObject({
			rel: "describedby",
			type: "application/json",
			href: "https://ta93abe.com/.well-known/agent-skills/index.json",
		});
		expect(byPath["/.well-known/agent-card.json"]).toMatchObject({
			rel: "describedby",
			type: "application/json",
			href: "https://ta93abe.com/.well-known/agent-card.json",
		});
		expect(byPath["/auth.md"]).toMatchObject({
			rel: "describedby",
			type: "text/markdown",
			href: "https://ta93abe.com/auth.md",
		});
		expect(byPath["/rss.xml"]).toMatchObject({
			rel: "alternate",
			type: "application/rss+xml",
			href: "https://ta93abe.com/rss.xml",
		});

		expect(AGENT_DISCOVERY_HTML_RESOURCES.map((item) => item.path)).toContain(
			"/rss.xml",
		);
		expect(absoluteDiscoveryHref("/rss.xml", SITE.url)).toBe(
			"https://ta93abe.com/rss.xml",
		);
	});
});
