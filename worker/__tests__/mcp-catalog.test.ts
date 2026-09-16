import { describe, expect, it } from "vitest";

import { findMcpTool, mcpServerCard, mcpToolList } from "../mcp-catalog.ts";

describe("MCP server card catalog", () => {
	it("advertises the same tools as tools/list, including inputSchema", () => {
		const card = mcpServerCard();
		const tools = mcpToolList();

		expect(card.capabilities.tools).toBe(true);
		expect(Array.isArray(card.tools)).toBe(true);
		expect(card.tools).toEqual(tools);
		expect(tools).toEqual([
			{
				name: "get_site_overview",
				description:
					"Return a concise, read-only overview of ta93abe.com and its machine-readable discovery URLs.",
				inputSchema: {
					type: "object",
					properties: {},
					additionalProperties: false,
				},
			},
		]);
	});

	it("keeps resources on the same card document as tools", () => {
		const card = mcpServerCard();

		expect(card.capabilities.resources).toBe(true);
		expect(card.resources).toEqual([
			{
				name: "site_overview",
				uri: "https://ta93abe.com/llms.txt",
				mimeType: "text/plain",
				description: "Concise overview of the public site.",
			},
		]);
		expect(card.url).toBe("https://ta93abe.com/mcp");
		expect(card.transport).toEqual({ type: "streamable-http" });
	});

	it("resolves catalog tools by name for tools/call", () => {
		expect(findMcpTool("get_site_overview")).toEqual(mcpToolList()[0]);
		expect(findMcpTool("unknown_tool")).toBeUndefined();
		expect(findMcpTool(undefined)).toBeUndefined();
	});
});
