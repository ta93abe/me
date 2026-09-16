import { describe, expect, it } from "vitest";

import {
	handleMcp,
	MCP_CORS_ALLOW_HEADERS,
	MCP_CORS_ALLOW_METHODS,
	MCP_CORS_ALLOW_ORIGIN,
	type McpHandlerOptions,
} from "../mcp.ts";

function jsonResponse(
	request: Request,
	value: unknown,
	init: ResponseInit = {},
): Response {
	const headers = new Headers(init.headers);
	headers.set("Content-Type", "application/json; charset=utf-8");
	const body =
		request.method.toUpperCase() === "HEAD"
			? null
			: JSON.stringify(value, null, 2);
	return new Response(body, {
		...init,
		headers,
	});
}

const handlerOptions: McpHandlerOptions = {
	jsonResponse,
	getSiteOverview: async () => "# ta93abe.com\n\nPublic overview.",
	serverInfo: {
		name: "ta93abe.com site discovery",
		version: "1.0.0",
	},
	endpointName: "ta93abe.com MCP endpoint",
};

function mcpRequest(method: string, init: RequestInit = {}): Request {
	return new Request("https://ta93abe.com/mcp", {
		...init,
		method,
	});
}

function jsonRpc(
	method: string,
	id: number | string | null = 1,
	params?: Record<string, unknown>,
): Request {
	return mcpRequest("POST", {
		headers: {
			Origin: "https://example.com",
			"Content-Type": "application/json",
			"MCP-Protocol-Version": "2025-06-18",
		},
		body: JSON.stringify({
			jsonrpc: "2.0",
			id,
			method,
			params,
		}),
	});
}

function expectMcpCors(response: Response): void {
	expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
		MCP_CORS_ALLOW_ORIGIN,
	);
	expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
		MCP_CORS_ALLOW_METHODS,
	);
	expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
		MCP_CORS_ALLOW_HEADERS,
	);
	expect(response.headers.get("Access-Control-Allow-Headers")).toMatch(
		/Content-Type/i,
	);
	expect(response.headers.get("Access-Control-Allow-Headers")).toMatch(
		/MCP-Protocol-Version/i,
	);
	expect(response.headers.get("Access-Control-Allow-Headers")).toMatch(
		/MCP-Session-Id/i,
	);
	expect(response.headers.get("Access-Control-Allow-Headers")).toMatch(
		/Last-Event-ID/i,
	);
}

describe("mcp cors and json-rpc", () => {
	it("answers a browser preflight with 204 and CORS headers", async () => {
		const response = await handleMcp(
			mcpRequest("OPTIONS", {
				headers: {
					Origin: "https://example.com",
					"Access-Control-Request-Method": "POST",
					"Access-Control-Request-Headers": "content-type,mcp-protocol-version",
				},
			}),
			handlerOptions,
		);

		expect(response.status).toBe(204);
		expect(response.headers.get("Content-Type")).toBeNull();
		expectMcpCors(response);
		expect(await response.text()).toBe("");
	});

	it("includes ACAO on GET discovery responses", async () => {
		const response = await handleMcp(
			mcpRequest("GET", {
				headers: { Origin: "https://example.com" },
			}),
			handlerOptions,
		);

		expect(response.status).toBe(200);
		expectMcpCors(response);
		const json = (await response.json()) as { name: string };
		expect(json.name).toBe("ta93abe.com MCP endpoint");
	});

	it("reaches initialize from a cross-origin JSON-RPC POST", async () => {
		const response = await handleMcp(jsonRpc("initialize"), handlerOptions);

		expect(response.status).toBe(200);
		expectMcpCors(response);
		const json = (await response.json()) as {
			jsonrpc: string;
			id: number;
			result: {
				protocolVersion: string;
				capabilities: { tools: object };
				serverInfo: { name: string; version: string };
			};
		};
		expect(json.jsonrpc).toBe("2.0");
		expect(json.id).toBe(1);
		expect(json.result.protocolVersion).toBe("2025-06-18");
		expect(json.result.capabilities.tools).toEqual({});
		expect(json.result.serverInfo).toEqual(handlerOptions.serverInfo);
	});

	it("reaches tools/list from a cross-origin JSON-RPC POST", async () => {
		const response = await handleMcp(jsonRpc("tools/list"), handlerOptions);

		expect(response.status).toBe(200);
		expectMcpCors(response);
		const json = (await response.json()) as {
			result: { tools: Array<{ name: string }> };
		};
		expect(json.result.tools.map((tool) => tool.name)).toEqual([
			"get_site_overview",
		]);
	});

	it("keeps CORS on JSON-RPC parse errors", async () => {
		const response = await handleMcp(
			mcpRequest("POST", {
				headers: {
					Origin: "https://example.com",
					"Content-Type": "application/json",
				},
				body: "{",
			}),
			handlerOptions,
		);

		expect(response.status).toBe(400);
		expectMcpCors(response);
		const json = (await response.json()) as {
			error: { code: number };
		};
		expect(json.error.code).toBe(-32700);
	});
});
