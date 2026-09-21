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
import {
	NESTED_OAUTH_AUTHORIZATION_SERVER_PATH,
	OAUTH_AUTHORIZATION_SERVER_PATH,
} from "../oauth-discovery.ts";
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
} as unknown as ExecutionContext;

async function fetchPath(
	path: string,
	init: RequestInit = {},
): Promise<Response> {
	return worker.fetch(
		new Request(`https://ta93abe.com${path}`, init) as Parameters<
			NonNullable<typeof worker.fetch>
		>[0],
		env,
		ctx,
	);
}

describe("nested OAuth authorization server well-known path", () => {
	it("308-redirects a doubled well-known suffix to the canonical metadata URL", async () => {
		const response = await fetchPath(NESTED_OAUTH_AUTHORIZATION_SERVER_PATH);

		expect(response.status).toBe(308);
		expect(response.headers.get("Location")).toBe(
			`https://ta93abe.com${OAUTH_AUTHORIZATION_SERVER_PATH}`,
		);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(await response.text()).toBe("");
	});

	it("308-redirects HEAD and a trailing-slash nested path the same way", async () => {
		const head = await fetchPath(NESTED_OAUTH_AUTHORIZATION_SERVER_PATH, {
			method: "HEAD",
		});
		const trailing = await fetchPath(
			`${NESTED_OAUTH_AUTHORIZATION_SERVER_PATH}/`,
		);

		expect(head.status).toBe(308);
		expect(trailing.status).toBe(308);
		expect(head.headers.get("Location")).toBe(
			`https://ta93abe.com${OAUTH_AUTHORIZATION_SERVER_PATH}`,
		);
		expect(trailing.headers.get("Location")).toBe(
			`https://ta93abe.com${OAUTH_AUTHORIZATION_SERVER_PATH}`,
		);
	});
});
