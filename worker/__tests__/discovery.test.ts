import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@astrojs/cloudflare/handler", () => ({
	handle: vi.fn(async () => new Response("astro", { status: 200 })),
}));

import {
	DISCOVERY_CACHE_CONTROL,
	sha256Digest,
	sha256Hex,
} from "../discovery-cache.ts";
import worker from "../index.ts";
import { createContentEnv } from "./memory-r2.ts";

const DISCOVERY_PATHS = [
	"/.well-known/api-catalog",
	"/.well-known/ai-catalog.json",
	"/.well-known/did.json",
	"/.well-known/mcp/server-card.json",
	"/.well-known/agent-card.json",
	"/.well-known/agent-skills/index.json",
	"/.well-known/agent-skills/site-overview/SKILL.md",
	"/.well-known/oauth-authorization-server",
	"/.well-known/oauth-protected-resource",
	"/auth.md",
] as const;

const env = {
	...createContentEnv(),
	DEPLOY_HOOK_URL: "https://example.com/deploy-hook",
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
		new Request(`https://ta93abe.com${path}`, init) as never,
		env,
		ctx,
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

describe("stable agent discovery documents", () => {
	it.each(DISCOVERY_PATHS)(
		"sends Cache-Control and ETag for %s",
		async (path) => {
			const response = await fetchPath(path, { method: "HEAD" });

			expect(response.status).toBe(200);
			expect(response.headers.get("Cache-Control")).toBe(
				DISCOVERY_CACHE_CONTROL,
			);
			expect(response.headers.get("ETag")).toMatch(/^"[0-9a-f]{64}"$/);
			expect(await response.text()).toBe("");
		},
	);

	it.each(DISCOVERY_PATHS)(
		"revalidates %s with If-None-Match",
		async (path) => {
			const fresh = await fetchPath(path);
			const etag = fresh.headers.get("ETag");
			expect(etag).toBeTruthy();

			const cached = await fetchPath(path, {
				headers: { "If-None-Match": etag! },
			});

			expect(cached.status).toBe(304);
			expect(cached.headers.get("ETag")).toBe(etag);
			expect(cached.headers.get("Cache-Control")).toBe(DISCOVERY_CACHE_CONTROL);
			expect(await cached.text()).toBe("");
		},
	);

	it("keeps the Agent Skills index digest equal to the SKILL.md SHA-256", async () => {
		const skill = await fetchPath(
			"/.well-known/agent-skills/site-overview/SKILL.md",
		);
		const index = await fetchPath("/.well-known/agent-skills/index.json");
		const markdown = await skill.text();
		const payload = (await index.json()) as {
			skills: { digest: string }[];
		};

		const hex = await sha256Hex(markdown);
		expect(payload.skills[0]?.digest).toBe(await sha256Digest(markdown));
		expect(payload.skills[0]?.digest).toBe(`sha256:${hex}`);
		expect(skill.headers.get("ETag")).toBe(`"${hex}"`);
	});

	it("does not apply discovery caching to GET /mcp", async () => {
		const response = await fetchPath("/mcp", { method: "GET" });

		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe("POST");
		expect(response.headers.get("Content-Type")).toMatch(/text\/plain/);
		expect(response.headers.get("Cache-Control")).not.toBe(
			DISCOVERY_CACHE_CONTROL,
		);
		expect(response.headers.get("ETag")).toBeNull();
		expect(await response.text()).not.toContain("MCP endpoint");
	});

	it("does not apply discovery caching to POST /mcp initialize", async () => {
		const response = await fetchPath("/mcp", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
			}),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).not.toBe(
			DISCOVERY_CACHE_CONTROL,
		);
		expect(response.headers.get("ETag")).toBeNull();
	});
});
