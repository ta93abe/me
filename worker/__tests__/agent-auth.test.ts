import { describe, expect, it, vi } from "vitest";

vi.mock("@astrojs/cloudflare/handler", () => ({
	handle: vi.fn(
		async () =>
			new Response("<html>404</html>", {
				status: 404,
				headers: { "content-type": "text/html; charset=utf-8" },
			}),
	),
}));

import worker from "../index.ts";
import { createContentEnv } from "./memory-r2.ts";

const env = {
	...createContentEnv(),
	ASSETS: { fetch: async () => new Response("missing", { status: 404 }) },
	DEPLOY_HOOK_URL: "https://example.invalid/hook",
} as unknown as Env;

const ctx = {
	waitUntil() {},
	passThroughOnException() {},
	props: {},
} as ExecutionContext;

function agentAuthRequest(method: string, headers?: HeadersInit): Request {
	return new Request("https://ta93abe.com/agent/auth", { method, headers });
}

async function agentAuth(
	method: string,
	headers?: HeadersInit,
): Promise<Response> {
	return worker.fetch(agentAuthRequest(method, headers), env, ctx);
}

describe("POST /agent/auth", () => {
	it("returns the same anonymous JSON as GET instead of the site 404 page", async () => {
		const get = await agentAuth("GET", { Accept: "application/json" });
		const post = await agentAuth("POST", { Accept: "application/json" });

		expect(post.status).toBe(200);
		expect(post.headers.get("Content-Type")).toMatch(/application\/json/);
		expect(await post.json()).toEqual(await get.json());
		expect(post.headers.get("Allow")).toBe("GET, HEAD, POST, OPTIONS");
	});

	it("answers OPTIONS with Allow and does not fall through to HTML 404", async () => {
		const response = await agentAuth("OPTIONS");

		expect(response.status).toBe(204);
		expect(response.headers.get("Allow")).toBe("GET, HEAD, POST, OPTIONS");
		expect(response.headers.get("Content-Type") ?? "").not.toMatch(
			/text\/html/,
		);
	});

	it("returns 405 with Allow for unsupported methods", async () => {
		const response = await agentAuth("PUT");

		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe("GET, HEAD, POST, OPTIONS");
		expect(await response.text()).toBe("Method Not Allowed");
	});
});
