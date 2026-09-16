import { describe, expect, it } from "vitest";

import { handleMcp, type McpContext } from "../mcp.ts";

const ctx: McpContext = {
	serverInfo: { name: "ta93abe.com site discovery", version: "1.0.0" },
	siteOverview: async () => "# overview",
};

function mcpRequest(
	method: string,
	body?: unknown,
	headers: Record<string, string> = {},
): Request {
	const init: RequestInit = { method, headers: new Headers(headers) };
	if (body !== undefined) {
		init.body = typeof body === "string" ? body : JSON.stringify(body);
		if (!headers["Content-Type"] && !headers["content-type"]) {
			(init.headers as Headers).set("Content-Type", "application/json");
		}
	}
	return new Request("https://ta93abe.com/mcp", init);
}

function jsonRpc(
	method: string,
	id: string | number | null = 1,
	params?: unknown,
) {
	return {
		jsonrpc: "2.0",
		id,
		method,
		...(params === undefined ? {} : { params }),
	};
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

describe("MCP Streamable HTTP", () => {
	it("returns 405 and Allow: POST for GET instead of a description JSON", async () => {
		const response = await handleMcp(mcpRequest("GET"), ctx);
		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe("POST");
		const json = (await response.json()) as {
			error: { message: string };
			name?: string;
		};
		expect(json.name).toBeUndefined();
		expect(json.error.message).toBe("Method not allowed");
	});

	it("returns 405 for GET with Accept: text/event-stream", async () => {
		const response = await handleMcp(
			mcpRequest("GET", undefined, { Accept: "text/event-stream" }),
			ctx,
		);
		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe("POST");
	});

	it("returns 405 for DELETE and HEAD", async () => {
		for (const method of ["DELETE", "HEAD", "PUT"]) {
			const response = await handleMcp(mcpRequest(method), ctx);
			expect(response.status).toBe(405);
			expect(response.headers.get("Allow")).toBe("POST");
		}
	});

	it("returns JSON initialize with Mcp-Session-Id when SSE is not requested", async () => {
		const response = await handleMcp(
			mcpRequest(
				"POST",
				jsonRpc("initialize", 1, { protocolVersion: "2025-06-18" }),
				{
					Accept: "application/json",
				},
			),
			ctx,
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toContain("application/json");
		expect(response.headers.get("Mcp-Session-Id")).toMatch(/^[0-9a-f-]{36}$/i);
		const json = (await response.json()) as {
			result: { protocolVersion: string; capabilities: { tools: object } };
		};
		expect(json.result.protocolVersion).toBe("2025-06-18");
		expect(json.result.capabilities.tools).toEqual({});
	});

	it("returns SSE initialize when Accept includes text/event-stream", async () => {
		const response = await handleMcp(
			mcpRequest(
				"POST",
				jsonRpc("initialize", 1, { protocolVersion: "2025-06-18" }),
				{
					Accept: "text/event-stream, application/json",
				},
			),
			ctx,
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toContain("text/event-stream");
		expect(response.headers.get("Mcp-Session-Id")).toBeTruthy();
		const message = await parseSseData(response);
		expect(message.jsonrpc).toBe("2.0");
		expect(message.id).toBe(1);
		const result = message.result as {
			protocolVersion: string;
			serverInfo: { name: string };
		};
		expect(result.protocolVersion).toBe("2025-06-18");
		expect(result.serverInfo.name).toBe("ta93abe.com site discovery");
	});

	it("accepts notifications with 202 and no body", async () => {
		const response = await handleMcp(
			mcpRequest(
				"POST",
				{ jsonrpc: "2.0", method: "notifications/initialized" },
				{
					Accept: "application/json, text/event-stream",
					"Mcp-Session-Id": "session-1",
				},
			),
			ctx,
		);
		expect(response.status).toBe(202);
		expect(await response.text()).toBe("");
		expect(response.headers.get("Mcp-Session-Id")).toBe("session-1");
	});

	it("still lists only get_site_overview", async () => {
		const response = await handleMcp(
			mcpRequest("POST", jsonRpc("tools/list")),
			ctx,
		);
		const json = (await response.json()) as {
			result: { tools: Array<{ name: string }> };
		};
		expect(json.result.tools.map((tool) => tool.name)).toEqual([
			"get_site_overview",
		]);
	});

	it("does not implement resources/list", async () => {
		const response = await handleMcp(
			mcpRequest("POST", jsonRpc("resources/list")),
			ctx,
		);
		const json = (await response.json()) as {
			error: { code: number; message: string };
		};
		expect(json.error.code).toBe(-32601);
		expect(json.error.message).toBe("Method not found");
	});

	it("returns resources/list errors as SSE when requested", async () => {
		const response = await handleMcp(
			mcpRequest("POST", jsonRpc("resources/list"), {
				Accept: "text/event-stream, application/json",
			}),
			ctx,
		);
		expect(response.headers.get("Content-Type")).toContain("text/event-stream");
		const message = await parseSseData(response);
		expect(message.error).toEqual({
			code: -32601,
			message: "Method not found",
		});
	});

	it("calls get_site_overview", async () => {
		const response = await handleMcp(
			mcpRequest(
				"POST",
				jsonRpc("tools/call", 7, { name: "get_site_overview" }),
			),
			ctx,
		);
		const json = (await response.json()) as {
			result: { content: Array<{ type: string; text: string }> };
		};
		expect(json.result.content[0]).toEqual({
			type: "text",
			text: "# overview",
		});
	});

	it("rejects unknown tools", async () => {
		const response = await handleMcp(
			mcpRequest("POST", jsonRpc("tools/call", 7, { name: "nope" })),
			ctx,
		);
		const json = (await response.json()) as { error: { code: number } };
		expect(json.error.code).toBe(-32602);
	});

	it("rejects invalid JSON with -32700", async () => {
		const response = await handleMcp(
			mcpRequest("POST", "{", { "Content-Type": "application/json" }),
			ctx,
		);
		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: { code: number } };
		expect(json.error.code).toBe(-32700);
	});

	it("echoes a client session id on subsequent JSON requests", async () => {
		const response = await handleMcp(
			mcpRequest("POST", jsonRpc("tools/list"), {
				"Mcp-Session-Id": "keep-me",
			}),
			ctx,
		);
		expect(response.headers.get("Mcp-Session-Id")).toBe("keep-me");
	});
});
