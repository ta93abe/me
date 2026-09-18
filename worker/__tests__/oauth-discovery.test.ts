import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
	AUTH_MD_OIDC_PARAGRAPH,
	OPENID_CONFIGURATION_PATH,
	oauthAuthorizationServerMetadata,
} from "../oauth-discovery.ts";

const issuer = "https://ta93abe.com";
const documentationUrl = `${issuer}/auth.md`;
const agentAuth = {
	skill: documentationUrl,
	register_uri: `${issuer}/agent/auth`,
	identity_types_supported: ["anonymous"],
};

describe("RFC 8414 authorization server metadata", () => {
	const metadata = oauthAuthorizationServerMetadata({
		issuer,
		documentationUrl,
		agentAuth,
	});

	it("keeps issuer for AS discovery without claiming OAuth token grants", () => {
		expect(metadata.issuer).toBe(issuer);
		expect(metadata.response_types_supported).toEqual([]);
		expect(metadata.grant_types_supported).toEqual([]);
		expect(metadata.token_endpoint_auth_methods_supported).toEqual([]);
		expect(metadata.response_types_supported).not.toContain("none");
		expect(metadata.token_endpoint_auth_methods_supported).not.toContain(
			"none",
		);
		expect(metadata.service_documentation).toBe(documentationUrl);
		expect(metadata.agent_auth).toEqual(agentAuth);
	});

	it("omits RFC 8414 endpoint fields that would imply a token or login flow", () => {
		expect(metadata).not.toHaveProperty("authorization_endpoint");
		expect(metadata).not.toHaveProperty("token_endpoint");
		expect(metadata).not.toHaveProperty("jwks_uri");
		expect(metadata).not.toHaveProperty("registration_endpoint");
	});

	it("does not look like OpenID Connect OP metadata", () => {
		expect(metadata).not.toHaveProperty(
			"id_token_signing_alg_values_supported",
		);
		expect(metadata).not.toHaveProperty("userinfo_endpoint");
		expect(metadata).not.toHaveProperty("subject_types_supported");
		expect(metadata.note).toMatch(/not an OpenID Connect Provider/i);
	});

	it("does not advertise the WorkOS claim grant that requires a token endpoint", () => {
		expect(metadata.grant_types_supported).not.toContain(
			"urn:workos:agent-auth:grant-type:claim",
		);
	});
});

describe("OIDC discovery", () => {
	it("treats openid-configuration as unimplemented rather than an AS clone", () => {
		const source = readFileSync("worker/index.ts", "utf8");
		expect(OPENID_CONFIGURATION_PATH).toBe("/.well-known/openid-configuration");
		expect(source).toContain("OPENID_CONFIGURATION_PATH");
		expect(source).toContain("AUTH_MD_OIDC_PARAGRAPH");
		expect(source).not.toMatch(
			/oauth-authorization-server" \|\|[\s\S]*openid-configuration/,
		);
	});

	it("documents that this is not OIDC and registration is optional", () => {
		expect(AUTH_MD_OIDC_PARAGRAPH).toContain("OpenID Connect Provider");
		expect(AUTH_MD_OIDC_PARAGRAPH).toContain(
			"/.well-known/openid-configuration",
		);
		expect(AUTH_MD_OIDC_PARAGRAPH).toContain(
			"Registration via `/agent/auth` is optional",
		);
	});
});
