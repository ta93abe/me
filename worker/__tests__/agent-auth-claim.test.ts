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

type AgentAuthMetadata = {
	skill: string;
	register_uri: string;
	identity_types_supported: string[];
	anonymous: {
		credential_types_supported: string[];
		claim_uri: string;
	};
};

type AuthorizationServerMetadata = {
	issuer: string;
	grant_types_supported: string[];
	agent_auth: AgentAuthMetadata;
};

describe("agent_auth anonymous claim_uri", () => {
	it("advertises claim_uri on AS and OIDC metadata", async () => {
		const asResponse = await fetchPath(
			"/.well-known/oauth-authorization-server",
		);
		const oidcResponse = await fetchPath("/.well-known/openid-configuration");

		expect(asResponse.status).toBe(200);
		expect(oidcResponse.status).toBe(200);

		const asJson = (await asResponse.json()) as AuthorizationServerMetadata;
		const oidcJson = (await oidcResponse.json()) as AuthorizationServerMetadata;

		expect(asJson.agent_auth).toEqual(oidcJson.agent_auth);
		expect(asJson.agent_auth.identity_types_supported).toEqual(["anonymous"]);
		expect(asJson.agent_auth.anonymous.credential_types_supported).toEqual([
			"api_key",
		]);
		expect(asJson.agent_auth.anonymous.claim_uri).toBe(
			"https://ta93abe.com/agent/claim",
		);
		expect(asJson.grant_types_supported).toContain(
			"urn:workos:agent-auth:grant-type:claim",
		);
	});

	it("completes GET and POST claim_uri immediately without a secret", async () => {
		const get = await fetchPath("/agent/claim", {
			headers: { Accept: "application/json" },
		});
		const post = await fetchPath("/agent/claim", {
			method: "POST",
			headers: { Accept: "application/json" },
		});

		expect(get.status).toBe(200);
		expect(post.status).toBe(200);
		expect(get.headers.get("Content-Type")).toMatch(/application\/json/);
		expect(post.headers.get("Content-Type")).toMatch(/application\/json/);

		const getBody = (await get.json()) as Record<string, unknown>;
		const postBody = (await post.json()) as Record<string, unknown>;

		expect(postBody).toEqual(getBody);
		expect(getBody.identity_type).toBe("anonymous");
		expect(getBody.claimed).toBe(true);
		expect(getBody.status).toBe("complete");
		expect(getBody.credential_required).toBe(false);
		expect(getBody).not.toHaveProperty("api_key");
		expect(JSON.stringify(getBody)).not.toMatch(/Bearer /i);
	});

	it("keeps POST /agent/auth on the Worker instead of falling through to HTML 404", async () => {
		const response = await fetchPath("/agent/auth", {
			method: "POST",
			headers: { Accept: "application/json" },
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toMatch(/application\/json/);
		expect(response.headers.get("Content-Type")).not.toMatch(/text\/html/);
	});

	it("documents claim_uri in auth.md as an immediate no-op", async () => {
		const response = await fetchPath("/auth.md");
		const markdown = await response.text();

		expect(response.status).toBe(200);
		expect(markdown).toContain("https://ta93abe.com/agent/claim");
		expect(markdown).toMatch(/claim_uri/);
		expect(markdown).toMatch(/## Step 4 — Claim/);
		expect(markdown).toMatch(/no secret|no credential|no bearer/i);
	});
});
