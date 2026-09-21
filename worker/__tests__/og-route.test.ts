import { beforeEach, describe, expect, it, vi } from "vitest";

const { renderBlogOgPng } = vi.hoisted(() => ({
	renderBlogOgPng: vi.fn(),
}));

vi.mock("@astrojs/cloudflare/handler", () => ({
	handle: vi.fn(
		async () =>
			new Response("<html>404</html>", {
				status: 404,
				headers: { "content-type": "text/html; charset=utf-8" },
			}),
	),
}));

vi.mock("../content/og-png.ts", () => ({
	renderBlogOgPng,
}));

import { collectionIndexKey } from "../content/keys.ts";
import worker from "../index.ts";
import { createContentEnv, createMemoryR2 } from "./memory-r2.ts";

const GENERATED_PNG = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1,
]);
const FALLBACK_PNG = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 2,
]);

type WorkerFetch = (
	request: Request,
	env: Env,
	ctx: ExecutionContext,
) => Promise<Response>;

async function seedHelloWorld(bucket: ReturnType<typeof createMemoryR2>) {
	await bucket.put(
		collectionIndexKey("blog"),
		JSON.stringify({
			collection: "blog",
			generatedAt: "2026-09-21T00:00:00.000Z",
			entries: [
				{
					collection: "blog",
					slug: "hello-world",
					title: "Hello",
					excerpt: "note",
					updatedAt: "2026-09-21T00:00:00.000Z",
					frontmatter: {
						title: "Hello",
						excerpt: "note",
						date: "2026-09-21",
					},
				},
			],
		}),
	);
}

function testEnv(bucket = createMemoryR2()): Env {
	return {
		...createContentEnv({ CONTENT: bucket }),
		ASSETS: {
			fetch: async () =>
				new Response(FALLBACK_PNG, {
					status: 200,
					headers: { "content-type": "image/png" },
				}),
		},
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

async function fetchOg(
	path: string,
	env: Env,
	init: RequestInit = {},
): Promise<Response> {
	return (worker.fetch as WorkerFetch)(
		new Request(`https://ta93abe.com${path}`, init),
		env,
		testCtx(),
	);
}

beforeEach(() => {
	renderBlogOgPng.mockReset();
	renderBlogOgPng.mockResolvedValue(GENERATED_PNG);
	vi.stubGlobal("caches", {
		default: {
			match: async () => undefined,
			put: async () => undefined,
			delete: async () => true,
		},
	});
});

describe("GET /og/blog/:slug.png", () => {
	it("returns 200 image/png for a known slug", async () => {
		const bucket = createMemoryR2();
		await seedHelloWorld(bucket);
		const response = await fetchOg("/og/blog/hello-world.png", testEnv(bucket));

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("image/png");
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(GENERATED_PNG);
		expect(renderBlogOgPng).toHaveBeenCalledWith("Hello");
	});

	it("still returns 200 image/png when WASM generation throws", async () => {
		renderBlogOgPng.mockRejectedValue(
			new Error("Wasm code generation disallowed by embedder"),
		);
		const bucket = createMemoryR2();
		await seedHelloWorld(bucket);
		const response = await fetchOg("/og/blog/hello-world.png", testEnv(bucket));

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("image/png");
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(FALLBACK_PNG);
	});

	it("falls back to the static blog OG when the slug is missing from the index", async () => {
		const response = await fetchOg("/og/blog/hello-world.png", testEnv());

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("image/png");
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(FALLBACK_PNG);
		expect(renderBlogOgPng).not.toHaveBeenCalled();
	});
});
