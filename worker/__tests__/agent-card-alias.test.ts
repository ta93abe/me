import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@astrojs/cloudflare/handler", () => ({
	handle: vi.fn(
		async () =>
			new Response(
				"<!doctype html><title>404 - ページが見つかりません</title>",
				{
					status: 404,
					headers: { "content-type": "text/html; charset=utf-8" },
				},
			),
	),
}));

import worker from "../index.ts";
import { createContentEnv } from "./memory-r2.ts";

type WorkerFetch = (
	request: Request,
	env: Env,
	ctx: ExecutionContext,
) => Promise<Response>;

function testEnv(): Env {
	return {
		...createContentEnv(),
		DEPLOY_HOOK_URL: "https://example.com/deploy-hook",
	} as unknown as Env;
}

function testCtx(): ExecutionContext {
	return {
		waitUntil() {},
		passThroughOnException() {},
		props: {},
	} as unknown as ExecutionContext;
}

async function fetchWorker(
	path: string,
	init: RequestInit = {},
): Promise<Response> {
	return (worker.fetch as WorkerFetch)(
		new Request(`https://ta93abe.com${path}`, init),
		testEnv(),
		testCtx(),
	);
}

beforeEach(() => {
	vi.stubGlobal("caches", {
		default: {
			match: async () => undefined,
			put: async () => undefined,
			delete: async () => true,
		},
	});
});

describe("A2A agent.json alias", () => {
	it("serves /.well-known/agent.json as the same JSON as agent-card.json", async () => {
		const canonical = await fetchWorker("/.well-known/agent-card.json");
		const alias = await fetchWorker("/.well-known/agent.json");

		expect(canonical.status).toBe(200);
		expect(alias.status).toBe(200);
		expect(canonical.headers.get("content-type")).toMatch(/application\/json/);
		expect(alias.headers.get("content-type")).toMatch(/application\/json/);
		expect(await alias.json()).toEqual(await canonical.json());
	});

	it("answers POST /a2a message/send and keeps GET /mcp as 405", async () => {
		const a2a = await fetchWorker("/a2a", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: 1,
				method: "message/send",
			}),
		});
		const mcpGet = await fetchWorker("/mcp", { method: "GET" });

		expect(a2a.status).toBe(200);
		const a2aBody = (await a2a.json()) as {
			result?: { kind?: string; parts?: { text?: string }[] };
		};
		expect(a2aBody.result?.kind).toBe("message");
		expect(a2aBody.result?.parts?.[0]?.text).toMatch(/Takumi Abe/);

		expect(mcpGet.status).toBe(405);
		expect(mcpGet.headers.get("Allow")).toBe("POST");
		expect(mcpGet.headers.get("Content-Type")).toMatch(/text\/plain/);
	});

	it("keeps POST /mcp initialize working", async () => {
		const response = await fetchWorker("/mcp", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
			}),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toMatch(/application\/json/);
		const body = (await response.json()) as {
			result?: { protocolVersion?: string };
		};
		expect(body.result?.protocolVersion).toBe("2025-06-18");
	});
});
