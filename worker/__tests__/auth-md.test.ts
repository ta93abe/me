import { describe, expect, it } from "vitest";

import { agentAuthRegisterResponse, buildAuthMd } from "../auth-md.ts";

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

describe("auth.md self-contained registration flow", () => {
	const markdown = buildAuthMd(SITE_URL, SITE_HOST);

	it("uses an H1 that contains auth.md", () => {
		expect(markdown).toMatch(/^# .*auth\.md/i);
	});

	it("identifies the agent audience", () => {
		expect(markdown).toMatch(/You are an agent/i);
	});

	it("declares register_uri and the POST registration path", () => {
		expect(markdown).toContain(`register_uri: ${SITE_URL}/agent/auth`);
		expect(registrationEndpoints(markdown)).toContain("/agent/auth");
	});

	it("documents anonymous registration and the no-op public api_key", () => {
		expect(markdown).toMatch(
			/identity_types_supported:\s*\[?"?anonymous"?\]?/i,
		);
		expect(markdown).toContain('"credential_type": "api_key"');
		expect(markdown).toContain('"api_key": "public"');
	});

	it("explains credential use with a bearer example that is not required", () => {
		expect(markdown).toMatch(/Authorization:\s*Bearer public/);
		expect(markdown).toMatch(/does not require/i);
	});

	it("keeps the documented JSON contract aligned with POST /agent/auth", () => {
		const response = agentAuthRegisterResponse(SITE_URL);
		expect(markdown).toContain(JSON.stringify(response, null, 2));
	});

	it("looks like a complete standalone flow to the scanner heuristics", () => {
		expect(registrationEndpoints(markdown).length).toBeGreaterThanOrEqual(1);
		expect(credentialMarkers(markdown).length).toBeGreaterThanOrEqual(3);
	});
});
