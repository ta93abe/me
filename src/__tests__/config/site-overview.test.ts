import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
	mcpGetSiteOverviewResult,
	SITE_OVERVIEW,
} from "@/config/site-overview";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("WebMCP site overview", () => {
	it("includes the A2A agent card in get_site_overview discovery", () => {
		expect(SITE_OVERVIEW.discovery.agentCard).toBe(
			"https://ta93abe.com/.well-known/agent-card.json",
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

	it("exposes agent-card on the HTTP MCP tool result used after WebMCP dedupe", () => {
		const result = mcpGetSiteOverviewResult("# overview");

		expect(result.structuredContent).toEqual(SITE_OVERVIEW);
		expect(result.structuredContent.discovery.agentCard).toBe(
			"https://ta93abe.com/.well-known/agent-card.json",
		);
		expect(JSON.stringify(result)).toContain(
			"https://ta93abe.com/.well-known/agent-card.json",
		);
	});
});

describe("site overview wiring", () => {
	it("registers the shared overview from the page-side WebMCP tool", () => {
		const source = readFileSync(
			join(repoRoot, "src/scripts/model-context.ts"),
			"utf8",
		);

		expect(source).toContain("SITE_OVERVIEW");
		expect(source).toContain("execute: async () => ({ ...SITE_OVERVIEW })");
	});

	it("returns the shared overview from HTTP MCP get_site_overview", () => {
		const source = readFileSync(join(repoRoot, "worker/index.ts"), "utf8");

		expect(source).toContain("mcpGetSiteOverviewResult");
	});
});
