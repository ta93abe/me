import { describe, expect, it } from "vitest";

import {
	handleMcp,
	mcpGetSiteOverviewResult,
	mcpResources,
	mcpServerCard,
	mcpToolList,
	SITE_OVERVIEW,
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
	const headers = new Headers(init?.headers);
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json; charset=utf-8");
	}
	return new Response(JSON.stringify(value), {
		status: init?.status ?? 200,
		headers,
	});
}

async function postMcp(
	method: string,
	params?: Record<string, unknown>,
	id: string | number | null = 1,
	headers: Record<string, string> = {},
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
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	});

	return handleMcp(request, content, (value, init) =>
		jsonResponse(value, init),
	);
}

async function parseSseData(
	response: Response,
): Promise<Record<string, unknown>> {
	const body = await response.text();
	expect(body).toContain("event: message");
	const dataLine = body.split("\n").find((line) => line.startsWith("data: "));
	expect(dataLine).toBeDefined();
	return JSON.parse(dataLine!.slice("data: ".length)) as Record<
		string,
		unknown
	>;
}

function mcpHttp(method: string, headers?: HeadersInit): Promise<Response> {
	const request = new Request("https://ta93abe.com/mcp", { method, headers });
	return handleMcp(request, content, (value, init) =>
		jsonResponse(value, init),
	);
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
	return (await response.json()) as Record<string, unknown>;
}

describe("MCP Streamable HTTP methods", () => {
	it("returns 405 for GET instead of a description JSON document", async () => {
		const response = await mcpHttp("GET", {
			Accept: "application/json, text/event-stream",
		});

		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe("POST");
		expect(response.headers.get("Content-Type")).toMatch(/text\/plain/);
		const body = await response.text();
		expect(body).not.toContain("MCP endpoint");
		expect(() => JSON.parse(body)).toThrow();
	});

	it("returns 405 for HEAD and DELETE without offering SSE", async () => {
		for (const method of ["HEAD", "DELETE"]) {
			const response = await mcpHttp(method);
			expect(response.status).toBe(405);
			expect(response.headers.get("Allow")).toBe("POST");
		}
	});
});

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

	it("includes the A2A agent card in get_site_overview structured discovery", async () => {
		const response = await postMcp("tools/call", {
			name: "get_site_overview",
		});
		const body = await readJson(response);
		const result = body.result as {
			content: Array<{ type: string; text: string }>;
			structuredContent: {
				discovery: { agentCard?: string };
			};
		};

		expect(body.error).toBeUndefined();
		expect(result.content[0]).toEqual({ type: "text", text: OVERVIEW });
		expect(result.structuredContent.discovery.agentCard).toBe(
			"https://ta93abe.com/.well-known/agent-card.json",
		);
		expect(result.structuredContent).toEqual(SITE_OVERVIEW);
		expect(SITE_OVERVIEW.discovery.auth).toBe("https://ta93abe.com/auth.md");
		expect(JSON.stringify(result)).toContain(
			"https://ta93abe.com/.well-known/agent-card.json",
		);
	});

	it("does not let a caller mutate later get_site_overview results", () => {
		const first = mcpGetSiteOverviewResult("# first");
		const discovery = first.structuredContent.discovery as {
			agentCard?: string;
		};
		delete discovery.agentCard;
		first.structuredContent.sections.pop();

		const second = mcpGetSiteOverviewResult("# second");

		expect(second.structuredContent.discovery.agentCard).toBe(
			"https://ta93abe.com/.well-known/agent-card.json",
		);
		expect(second.structuredContent.sections).toEqual([
			...SITE_OVERVIEW.sections,
		]);
		expect(SITE_OVERVIEW.discovery.agentCard).toBe(
			"https://ta93abe.com/.well-known/agent-card.json",
		);
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

describe("MCP Streamable HTTP SSE and session", () => {
	it("returns JSON initialize with Mcp-Session-Id when SSE is not requested", async () => {
		const response = await postMcp(
			"initialize",
			{ protocolVersion: "2025-06-18" },
			1,
			{ Accept: "application/json" },
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toMatch(/application\/json/);
		expect(response.headers.get("Mcp-Session-Id")).toMatch(/^[0-9a-f-]{36}$/i);
		expect(response.headers.get("Vary")).toMatch(/Accept/i);

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

	it("returns SSE initialize when Accept includes text/event-stream", async () => {
		const response = await postMcp(
			"initialize",
			{ protocolVersion: "2025-06-18" },
			1,
			{ Accept: "text/event-stream, application/json" },
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toContain("text/event-stream");
		expect(response.headers.get("Mcp-Session-Id")).toBeTruthy();

		const message = await parseSseData(response);
		expect(message.jsonrpc).toBe("2.0");
		expect(message.id).toBe(1);
		expect(message.result).toMatchObject({
			protocolVersion: "2025-06-18",
			serverInfo: { name: "ta93abe.com site discovery" },
			capabilities: {
				resources: {
					subscribe: false,
					listChanged: false,
				},
			},
		});
	});

	it("returns resources/list as SSE when requested instead of dropping the method", async () => {
		const response = await postMcp("resources/list", undefined, 1, {
			Accept: "text/event-stream, application/json",
		});

		expect(response.headers.get("Content-Type")).toContain("text/event-stream");
		const message = await parseSseData(response);
		expect(message.error).toBeUndefined();
		expect(message.result).toEqual({
			resources: mcpResources(),
		});
	});

	it("echoes a client session id on subsequent JSON requests", async () => {
		const response = await postMcp("tools/list", undefined, 1, {
			"Mcp-Session-Id": "keep-me",
		});
		expect(response.headers.get("Mcp-Session-Id")).toBe("keep-me");
		expect(await readJson(response)).toMatchObject({
			result: { tools: [{ name: "get_site_overview" }] },
		});
	});

	it("echoes the session id on notifications without generating a new one", async () => {
		const request = new Request("https://ta93abe.com/mcp", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json, text/event-stream",
				"Mcp-Session-Id": "session-1",
			},
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
		expect(response.headers.get("Mcp-Session-Id")).toBe("session-1");
	});

	it("keeps parse errors as JSON even when SSE is requested", async () => {
		const request = new Request("https://ta93abe.com/mcp", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "text/event-stream, application/json",
			},
			body: "{",
		});
		const response = await handleMcp(request, content, (value, init) =>
			jsonResponse(value, init),
		);
		expect(response.status).toBe(400);
		expect(response.headers.get("Content-Type")).toMatch(/application\/json/);
		expect(await readJson(response)).toEqual({
			jsonrpc: "2.0",
			id: null,
			error: {
				code: -32700,
				message: "Parse error",
			},
		});
	});
});
