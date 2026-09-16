import { describe, expect, it, vi } from "vitest";

vi.mock("@astrojs/cloudflare/handler", () => ({
	handle: vi.fn(async () => new Response("astro")),
}));

import { handleMcp, mcpServerCard } from "../index.ts";
import { createContentEnv } from "./memory-r2.ts";

function mcpRequest(method: string, init: RequestInit = {}): Request {
	return new Request("https://ta93abe.com/mcp", { method, ...init });
}

function jsonRpc(method: string, id: number | string = 1): Request {
	return mcpRequest("POST", {
		headers: {
			Accept: "application/json, text/event-stream",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ jsonrpc: "2.0", id, method, params: {} }),
	});
}

describe("mcp streamable http", () => {
	const env = createContentEnv() as unknown as Env;

	it("returns 405 for GET instead of a description JSON document", async () => {
		const response = await handleMcp(
			mcpRequest("GET", {
				headers: {
					Accept: "application/json, text/event-stream",
				},
			}),
			env,
		);

		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe("POST");
		expect(response.headers.get("Content-Type")).toMatch(/text\/plain/);
		const body = await response.text();
		expect(body).not.toContain("MCP endpoint");
		expect(() => JSON.parse(body)).toThrow();
	});

	it("returns 405 for HEAD and DELETE without offering SSE", async () => {
		for (const method of ["HEAD", "DELETE"]) {
			const response = await handleMcp(mcpRequest(method), env);
			expect(response.status).toBe(405);
			expect(response.headers.get("Allow")).toBe("POST");
		}
	});

	it("keeps the server card on streamable-http at /mcp", () => {
		const card = mcpServerCard();
		expect(card.url).toBe("https://ta93abe.com/mcp");
		expect(card.transport).toEqual({ type: "streamable-http" });
		expect(card.capabilities.tools).toBe(true);
	});

	it("answers initialize over POST JSON-RPC", async () => {
		const response = await handleMcp(jsonRpc("initialize"), env);
		expect(response.status).toBe(200);
		const payload = (await response.json()) as {
			jsonrpc: string;
			result: { protocolVersion: string };
		};
		expect(payload.jsonrpc).toBe("2.0");
		expect(payload.result.protocolVersion).toBe("2025-06-18");
	});

	it("answers tools/list over POST JSON-RPC", async () => {
		const response = await handleMcp(jsonRpc("tools/list"), env);
		expect(response.status).toBe(200);
		const payload = (await response.json()) as {
			result: { tools: Array<{ name: string }> };
		};
		expect(payload.result.tools.map((tool) => tool.name)).toContain(
			"get_site_overview",
		);
	});
});
