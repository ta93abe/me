import { describe, expect, it } from "vitest";

import { agentAuthRegisterResponse, authMarkdown } from "../auth-md.ts";

const SITE_URL = "https://ta93abe.com";
const SITE_HOST = "ta93abe.com";

function registrationEndpoints(markdown: string): string[] {
	const matches = markdown.matchAll(/\bPOST\s+(\/[^\s]+)/gi);
	return [...new Set([...matches].map((match) => match[1]))];
}

function credentialMarkers(markdown: string): string[] {
	const markers = [
		["api_key", /\bapi_key\b/],
		["apiKey", /\bapiKey\b/],
		["access_token", /\baccess_token\b/],
		["Authorization: Bearer", /Authorization:\s*Bearer/i],
	] as const;

	return markers
		.filter(([, pattern]) => pattern.test(markdown))
		.map(([name]) => name);
}

describe("auth.md", () => {
	const md = authMarkdown(SITE_URL, SITE_HOST);
	const firstLine = md.split("\n")[0] ?? "";

	it("uses an H1 that contains auth.md", () => {
		expect(firstLine.startsWith("# ")).toBe(true);
		expect(firstLine).toContain("auth.md");
	});

	it("documents a self-contained registration flow", () => {
		expect(md).toMatch(/self-contained registration flow/i);
		expect(md).toMatch(/agent audience/i);
		expect(md).toContain("register_uri");
		expect(md).toContain(`${SITE_URL}/agent/auth`);
		expect(md).toContain(`POST ${SITE_URL}/agent/auth`);
		expect(md).toMatch(/supported method/i);
		expect(md).toContain("anonymous");
		expect(md).toMatch(/credential use/i);
		expect(md).toContain("identity_type");
		expect(md).toContain("credential_type: none");
		expect(md).not.toMatch(/api_key/);
		expect(md).not.toMatch(/apiKey/);
	});

	it("keeps claim_uri and anonymous public read from current auth.md", () => {
		expect(md).toMatch(/claim_uri/);
		expect(md).toContain(`${SITE_URL}/agent/claim`);
		expect(md).toMatch(/## Step 4 — Claim/);
		expect(md.toLowerCase()).toMatch(/no secret|no credential|no bearer/);
		expect(md).toContain("issuer");
		expect(md).toContain(SITE_URL);
		expect(md).toContain(SITE_HOST);
		expect(md).toContain("/.well-known/oauth-authorization-server");
		expect(md).toContain("/.well-known/oauth-protected-resource");
		expect(md).toContain(`${SITE_URL}/sitemap.xml`);
		expect(md).not.toMatch(/sitemap-index\.xml/);
	});

	it("declares register_uri and the origin-form POST registration path", () => {
		expect(md).toContain(`register_uri: ${SITE_URL}/agent/auth`);
		expect(md).toContain("POST /agent/auth HTTP/1.1");
		expect(md).toContain(`Host: ${SITE_HOST}`);
		expect(registrationEndpoints(md)).toContain("/agent/auth");
	});

	it("keeps the documented JSON contract aligned with POST /agent/auth", () => {
		const response = agentAuthRegisterResponse(SITE_URL);
		expect(response.credential_type).toBe("none");
		expect(response).not.toHaveProperty("api_key");
		expect(md).toContain(JSON.stringify(response, null, 2));
	});

	it("looks like a complete standalone flow to scanner path heuristics", () => {
		expect(registrationEndpoints(md).length).toBeGreaterThanOrEqual(1);
		expect(credentialMarkers(md)).toEqual([
			"access_token",
			"Authorization: Bearer",
		]);
		expect(credentialMarkers(md)).not.toContain("api_key");
		expect(credentialMarkers(md)).not.toContain("apiKey");
	});
});
