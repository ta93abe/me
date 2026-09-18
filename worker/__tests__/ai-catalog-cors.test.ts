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

import { DID_WEB_PATH, didWebDocument } from "../discovery/ai-catalog.ts";
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

describe("ARD ai-catalog CORS", () => {
	it("serves ai-catalog.json and ard.json with JSON type and Access-Control-Allow-Origin *", async () => {
		for (const path of [
			"/.well-known/ai-catalog.json",
			"/.well-known/ard.json",
		]) {
			const response = await fetchCatalog(path);
			const body = (await response.json()) as {
				entries: { representativeQueries: string[] }[];
			};

			expect(response.status, path).toBe(200);
			expect(response.headers.get("content-type"), path).toMatch(
				/application\/json/,
			);
			expect(response.headers.get("Access-Control-Allow-Origin"), path).toBe(
				"*",
			);
			expect(body.entries.length).toBeGreaterThan(0);
			for (const entry of body.entries) {
				expect(entry.representativeQueries.length).toBeGreaterThanOrEqual(2);
				expect(entry.representativeQueries.length).toBeLessThanOrEqual(5);
			}
		}
	});

	it("answers OPTIONS preflight on ai-catalog.json with 204 instead of HTML 404", async () => {
		const response = await fetchCatalog("/.well-known/ai-catalog.json", {
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

	it("serves did:web document at /.well-known/did.json with CORS", async () => {
		const response = await fetchCatalog(DID_WEB_PATH);
		const body = (await response.json()) as {
			id: string;
			alsoKnownAs: string[];
		};

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toMatch(
			/application\/did\+json/,
		);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(body).toEqual(didWebDocument());
		expect(body.id).toBe("did:web:ta93abe.com");
	});
});
