import { describe, expect, it, vi } from "vitest";

vi.mock("@astrojs/cloudflare/handler", () => ({
	handle: vi.fn(
		async () =>
			new Response("<html>home</html>", {
				status: 200,
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
} as unknown as ExecutionContext;

async function fetchUrl(
	url: string,
	init: RequestInit = {},
): Promise<Response> {
	return worker.fetch(
		new Request(url, init) as Parameters<NonNullable<typeof worker.fetch>>[0],
		env,
		ctx,
	);
}

describe("www apex host redirect", () => {
	it("301s GET www root to apex", async () => {
		const response = await fetchUrl("https://www.ta93abe.com/");

		expect(response.status).toBe(301);
		expect(response.headers.get("Location")).toBe("https://ta93abe.com/");
		expect(await response.text()).toBe("");
	});

	it("folds trailing-slash normalization into the same hop", async () => {
		const response = await fetchUrl("https://www.ta93abe.com/about?utm=1");

		expect(response.status).toBe(301);
		expect(response.headers.get("Location")).toBe(
			"https://ta93abe.com/about/?utm=1",
		);
	});

	it("does not add a slash to well-known discovery paths", async () => {
		const response = await fetchUrl(
			"https://www.ta93abe.com/.well-known/api-catalog",
		);

		expect(response.status).toBe(301);
		expect(response.headers.get("Location")).toBe(
			"https://ta93abe.com/.well-known/api-catalog",
		);
	});

	it("308s non-GET www requests to the same apex URL", async () => {
		const response = await fetchUrl("https://www.ta93abe.com/about", {
			method: "POST",
		});

		expect(response.status).toBe(308);
		expect(response.headers.get("Location")).toBe("https://ta93abe.com/about/");
	});

	it("leaves apex host behavior unchanged", async () => {
		const home = await fetchUrl("https://ta93abe.com/");
		const about = await fetchUrl("https://ta93abe.com/about");
		const wellKnown = await fetchUrl(
			"https://ta93abe.com/.well-known/api-catalog",
		);

		expect(home.status).toBe(200);
		expect(about.status).toBe(301);
		expect(about.headers.get("Location")).toBe("https://ta93abe.com/about/");
		expect(wellKnown.status).toBe(200);
	});
});
