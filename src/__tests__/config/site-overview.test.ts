import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

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
	it("registers get_site_overview whose execute returns the agent card", async () => {
		vi.resetModules();
		const tools: Array<{
			name: string;
			execute: () => Promise<{ discovery: { agentCard?: string } }>;
		}> = [];

		Object.defineProperty(navigator, "modelContext", {
			configurable: true,
			value: {
				registerTool(tool: (typeof tools)[number]) {
					tools.push(tool);
				},
			},
		});

		await import("@/scripts/model-context");

		const tool = tools.find((item) => item.name === "get_site_overview");
		expect(tool).toBeDefined();
		await expect(tool?.execute()).resolves.toMatchObject({
			discovery: {
				agentCard: "https://ta93abe.com/.well-known/agent-card.json",
			},
		});
	});

	it("returns the shared overview from HTTP MCP get_site_overview", () => {
		const source = readFileSync(join(repoRoot, "worker/index.ts"), "utf8");

		expect(source).toContain("mcpGetSiteOverviewResult");
	});
});
