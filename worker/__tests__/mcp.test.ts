import { describe, expect, it } from "vitest";

import {
	handleMcp,
	mcpResources,
	mcpServerCard,
	mcpToolList,
	type McpSiteContent,
} from "../mcp.ts";

const OVERVIEW = "# Takumi Abe / ta93abe\n\nConcise overview.";
const FULL =
	"# Takumi Abe / ta93abe\n\nConcise overview.\n\n## Agent guidance\n";

const content: McpSiteContent = {
	siteOverviewMarkdown: async () => OVERVIEW,
	llmsFullText: async () => FULL,
};

function jsonResponse(value: unknown, init?: ResponseInit): Response {
	return new Response(JSON.stringify(value), {
		status: init?.status ?? 200,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			...init?.headers,
		},
	});
}

async function postMcp(
	method: string,
	params?: Record<string, unknown>,
	id: string | number | null = 1,
): Promise<Response> {
	const body: Record<string, unknown> = {
		jsonrpc: "2.0",
		id,
		method,
	};
	if (params !== undefined) {
		body.params = params;
	}

	const request = new Request("https://ta93abe.com/mcp", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	return handleMcp(request, content, (value, init) =>
		jsonResponse(value, init),
	);
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
	return (await response.json()) as Record<string, unknown>;
}

describe("MCP resources", () => {
	it("advertises the same resources on the server card and resources/list", async () => {
		const listed = await postMcp("resources/list");
		expect(listed.status).toBe(200);

		const body = await readJson(listed);
		expect(body.error).toBeUndefined();
		expect(body.result).toEqual({
			resources: mcpResources(),
		});
		expect(mcpServerCard().resources).toEqual(mcpResources());
		expect(mcpServerCard().tools).toEqual(mcpToolList());
		expect(mcpResources().map((resource) => resource.name)).toEqual([
			"site_overview",
			"site_overview_full",
		]);
		expect(mcpResources()[0]?.uri).toBe("https://ta93abe.com/llms.txt");
	});

	it("declares resources capability without subscribe or listChanged", async () => {
		const response = await postMcp("initialize");
		const body = await readJson(response);
		expect(body.error).toBeUndefined();
		expect(body.result).toMatchObject({
			protocolVersion: "2025-06-18",
			capabilities: {
				tools: {},
				resources: {
					subscribe: false,
					listChanged: false,
				},
			},
		});
	});

	it("reads llms.txt through resources/read", async () => {
		const response = await postMcp("resources/read", {
			uri: "https://ta93abe.com/llms.txt",
		});
		const body = await readJson(response);
		expect(body.error).toBeUndefined();
		expect(body.result).toEqual({
			contents: [
				{
					uri: "https://ta93abe.com/llms.txt",
					name: "site_overview",
					mimeType: "text/plain",
					text: OVERVIEW,
				},
			],
		});
	});

	it("reads llms-full.txt through resources/read", async () => {
		const response = await postMcp("resources/read", {
			uri: "https://ta93abe.com/llms-full.txt/",
		});
		const body = await readJson(response);
		expect(body.error).toBeUndefined();
		expect(body.result).toEqual({
			contents: [
				{
					uri: "https://ta93abe.com/llms-full.txt",
					name: "site_overview_full",
					mimeType: "text/plain",
					text: FULL,
				},
			],
		});
	});

	it("returns resource not found for unknown URIs", async () => {
		const response = await postMcp("resources/read", {
			uri: "https://ta93abe.com/secret.txt",
		});
		const body = await readJson(response);
		expect(body.result).toBeUndefined();
		expect(body.error).toEqual({
			code: -32002,
			message: "Resource not found",
			data: { uri: "https://ta93abe.com/secret.txt" },
		});
	});

	it("rejects resources/read without a uri", async () => {
		const response = await postMcp("resources/read", {});
		const body = await readJson(response);
		expect(body.error).toMatchObject({
			code: -32602,
			message: "Invalid params",
		});
	});

	it("advertises the same tools on the server card and tools/list", async () => {
		const listed = await readJson(await postMcp("tools/list"));
		const tools = mcpToolList();

		expect(listed.result).toEqual({ tools });
		expect(mcpServerCard().tools).toEqual(tools);
		expect(mcpServerCard().capabilities.tools).toBe(true);
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

	it("still lists tools and rejects unknown methods", async () => {
		const listed = await readJson(await postMcp("tools/list"));
		expect(listed.result).toMatchObject({
			tools: [{ name: "get_site_overview" }],
		});

		const missing = await readJson(await postMcp("prompts/list"));
		expect(missing.error).toEqual({
			code: -32601,
			message: "Method not found",
		});
	});

	it("rejects a JSON null body as Invalid Request instead of crashing", async () => {
		const request = new Request("https://ta93abe.com/mcp", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "null",
		});
		const response = await handleMcp(request, content, (value, init) =>
			jsonResponse(value, init),
		);
		expect(response.status).toBe(400);
		expect(await readJson(response)).toEqual({
			jsonrpc: "2.0",
			id: null,
			error: {
				code: -32600,
				message: "Invalid Request",
			},
		});
	});

	it("accepts notifications without a JSON-RPC id as 202", async () => {
		const request = new Request("https://ta93abe.com/mcp", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				jsonrpc: "2.0",
				method: "notifications/initialized",
			}),
		});
		const response = await handleMcp(request, content, (value, init) =>
			jsonResponse(value, init),
		);
		expect(response.status).toBe(202);
		expect(await response.text()).toBe("");
	});

	it("treats an explicit null id as a request, not a notification", async () => {
		const response = await postMcp("prompts/list", undefined, null);
		expect(response.status).toBe(200);
		expect(await readJson(response)).toEqual({
			jsonrpc: "2.0",
			id: null,
			error: {
				code: -32601,
				message: "Method not found",
			},
		});
	});
});
