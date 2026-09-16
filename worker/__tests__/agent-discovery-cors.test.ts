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

const HTML_404_TITLE = "404 - ページが見つかりません";

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

function discoveryRequest(path: string, init: RequestInit = {}): Request {
	const headers = new Headers(init.headers);
	if (!headers.has("Origin")) {
		headers.set("Origin", "https://example.com");
	}
	return new Request(`https://ta93abe.com${path}`, {
		...init,
		headers,
	});
}

async function fetchWorker(
	path: string,
	init: RequestInit = {},
): Promise<Response> {
	return (worker.fetch as WorkerFetch)(
		discoveryRequest(path, init),
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

describe("agent discovery CORS", () => {
	it("adds Access-Control-Allow-Origin on GET server-card.json from another origin", async () => {
		const response = await fetchWorker("/.well-known/mcp/server-card.json");

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toMatch(/application\/json/);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		const body = (await response.json()) as { url: string };
		expect(body.url).toBe("https://ta93abe.com/mcp");
	});

	it("answers OPTIONS preflight on server-card.json with 204 instead of HTML 404", async () => {
		const response = await fetchWorker("/.well-known/mcp/server-card.json", {
			method: "OPTIONS",
			headers: {
				Origin: "https://example.com",
				"Access-Control-Request-Method": "GET",
			},
		});

		expect(response.status).toBe(204);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
			"GET, HEAD, OPTIONS",
		);
		expect(response.headers.get("content-type") ?? "").not.toMatch(
			/text\/html/,
		);
		expect(await response.text()).not.toContain(HTML_404_TITLE);
	});

	it("adds CORS on other discovery JSON and markdown documents", async () => {
		const paths = [
			"/.well-known/mcp.json",
			"/.well-known/api-catalog",
			"/.well-known/oauth-authorization-server",
			"/.well-known/oauth-protected-resource",
			"/.well-known/openid-configuration",
			"/.well-known/agent-skills/index.json",
			"/.well-known/agent-card.json",
			"/llms.txt",
			"/llms-full.txt",
			"/auth.md",
		];

		for (const path of paths) {
			const response = await fetchWorker(path);
			expect(response.status, path).toBe(200);
			expect(response.headers.get("Access-Control-Allow-Origin"), path).toBe(
				"*",
			);
		}
	});

	it("answers OPTIONS on future well-known JSON without the HTML 404 playground", async () => {
		const response = await fetchWorker("/.well-known/ai-catalog.json", {
			method: "OPTIONS",
			headers: {
				Origin: "https://example.com",
				"Access-Control-Request-Method": "GET",
			},
		});

		expect(response.status).toBe(204);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(await response.text()).not.toContain(HTML_404_TITLE);
	});

	it("does not treat HTML pages as discovery CORS preflight", async () => {
		const response = await fetchWorker("/about", {
			method: "OPTIONS",
			headers: {
				Origin: "https://example.com",
				"Access-Control-Request-Method": "GET",
			},
		});

		expect(response.status).toBe(404);
		expect(response.headers.get("content-type")).toMatch(/text\/html/);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
	});
});
