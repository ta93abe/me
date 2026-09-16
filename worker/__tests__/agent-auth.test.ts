import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@astrojs/cloudflare/handler", () => ({
	handle: vi.fn(
		async () =>
			new Response("<!DOCTYPE html><title>404</title>", {
				status: 404,
				headers: { "content-type": "text/html; charset=utf-8" },
			}),
	),
}));

import { handle } from "@astrojs/cloudflare/handler";

import worker from "../index.ts";

const ctx = {
	waitUntil() {},
	passThroughOnException() {},
} as unknown as ExecutionContext;

const env = {
	DEPLOY_HOOK_URL: "",
	CONTENT_HMAC_SECRET: "",
} as Env;

function agentAuthRequest(method: string, init: RequestInit = {}): Request {
	return new Request("https://ta93abe.com/agent/auth", {
		method,
		...init,
		headers: {
			Accept: "application/json",
			...init.headers,
		},
	});
}

describe("/agent/auth", () => {
	beforeEach(() => {
		vi.mocked(handle).mockClear();
	});

	it("returns anonymous JSON for GET", async () => {
		const response = await worker.fetch(agentAuthRequest("GET"), env, ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toMatch(/application\/json/);
		await expect(response.json()).resolves.toMatchObject({
			identity_type: "anonymous",
			credential_type: "api_key",
			api_key: "public",
			scopes: ["public:read"],
		});
		expect(handle).not.toHaveBeenCalled();
	});

	it("returns the same anonymous JSON for POST as Auth.md Step 3", async () => {
		const response = await worker.fetch(
			agentAuthRequest("POST", {
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: "{}",
			}),
			env,
			ctx,
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toMatch(/application\/json/);
		expect(response.headers.get("content-type")).not.toMatch(/text\/html/);
		await expect(response.json()).resolves.toMatchObject({
			identity_type: "anonymous",
			credential_type: "api_key",
			api_key: "public",
			scopes: ["public:read"],
		});
		expect(handle).not.toHaveBeenCalled();
	});

	it("does not fall through to HTML 404 for unsupported methods", async () => {
		const response = await worker.fetch(
			agentAuthRequest("PUT", {
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: "{}",
			}),
			env,
			ctx,
		);

		expect(response.status).toBe(405);
		expect(response.headers.get("content-type")).not.toMatch(/text\/html/);
		expect(handle).not.toHaveBeenCalled();
	});
});
