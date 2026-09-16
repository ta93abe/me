import { describe, expect, it } from "vitest";

import { SITE_OVERVIEW } from "@/config/site-overview";

describe("WebMCP site overview", () => {
	it("includes RSS and sitemap in get_site_overview discovery", () => {
		expect(SITE_OVERVIEW.discovery.rss).toBe("https://ta93abe.com/rss.xml");
		expect(SITE_OVERVIEW.discovery.sitemap).toBe(
			"https://ta93abe.com/sitemap-index.xml",
		);
	});

	it("keeps the existing discovery documents", () => {
		expect(SITE_OVERVIEW.discovery.llms).toBe("https://ta93abe.com/llms.txt");
		expect(SITE_OVERVIEW.discovery.apiCatalog).toBe(
			"https://ta93abe.com/.well-known/api-catalog",
		);
		expect(SITE_OVERVIEW.discovery.mcpServerCard).toBe(
			"https://ta93abe.com/.well-known/mcp/server-card.json",
		);
		expect(SITE_OVERVIEW.discovery.agentSkills).toBe(
			"https://ta93abe.com/.well-known/agent-skills/index.json",
		);
		expect(SITE_OVERVIEW.discovery.auth).toBe("https://ta93abe.com/auth.md");
	});
});
