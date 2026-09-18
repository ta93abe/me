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

async function fetchCatalog(
	path: string,
	init: RequestInit = {},
): Promise<Response> {
	const headers = new Headers(init.headers);
	if (!headers.has("Origin")) {
		headers.set("Origin", "https://example.com");
	}
	return (worker.fetch as WorkerFetch)(
		new Request(`https://ta93abe.com${path}`, { ...init, headers }),
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

describe("ARD ai-catalog route", () => {
	it("serves GET /.well-known/ai-catalog.json as 200 JSON with CORS", async () => {
		const response = await fetchCatalog("/.well-known/ai-catalog.json");
		const body = (await response.json()) as {
			specVersion: string;
			entries: unknown[];
		};

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toMatch(/application\/json/);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(body.specVersion).toBe("1.0");
		expect(body.entries.length).toBeGreaterThan(0);
	});

	it("serves HEAD /.well-known/ai-catalog.json as 200 JSON without a body", async () => {
		const response = await fetchCatalog("/.well-known/ai-catalog.json", {
			method: "HEAD",
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toMatch(/application\/json/);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(await response.text()).toBe("");
	});

	it("serves the same catalog at /.well-known/ard.json", async () => {
		const response = await fetchCatalog("/.well-known/ard.json");
		const body = (await response.json()) as { specVersion: string };

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toMatch(/application\/json/);
		expect(body.specVersion).toBe("1.0");
	});
});
