import { describe, expect, it } from "vitest";

import {
	oauthAuthorizationServer,
	oauthProtectedResource,
} from "../oauth-metadata.ts";

const SITE_URL = "https://ta93abe.com";
const AS_METADATA_URL =
	"https://ta93abe.com/.well-known/oauth-authorization-server";
const DOUBLED_AS_METADATA_URL =
	"https://ta93abe.com/.well-known/oauth-authorization-server/.well-known/oauth-authorization-server";

/**
 * RFC 8414 §3: insert `/.well-known/oauth-authorization-server` between the
 * issuer host and path. Clients do this once; they must not apply it to a
 * metadata document URL that already contains the well-known suffix.
 */
function authorizationServerMetadataUrl(issuer: string): string {
	const url = new URL(issuer);
	const path = url.pathname.replace(/\/+$/, "");
	return `${url.origin}/.well-known/oauth-authorization-server${path}`;
}

describe("OAuth Protected Resource Metadata", () => {
	it("lists authorization server issuer identifiers, not metadata URLs", () => {
		const resource = oauthProtectedResource(SITE_URL);
		const as = oauthAuthorizationServer(SITE_URL);

		expect(resource.authorization_servers).toEqual([SITE_URL]);
		expect(resource.authorization_servers).toEqual([as.issuer]);
		expect(as.issuer).toBe(SITE_URL);
	});

	it("lets a client derive the AS metadata URL from the issuer exactly once", () => {
		const resource = oauthProtectedResource(SITE_URL);
		const issuer = resource.authorization_servers[0];
		expect(issuer).toBeDefined();

		const derived = authorizationServerMetadataUrl(issuer!);
		expect(derived).toBe(AS_METADATA_URL);

		const doubled = authorizationServerMetadataUrl(derived);
		expect(doubled).toBe(DOUBLED_AS_METADATA_URL);
		expect(doubled).not.toBe(derived);
	});

	it("omits non-standard agent_auth so AS metadata is the single source", () => {
		const resource = oauthProtectedResource(SITE_URL);
		const as = oauthAuthorizationServer(SITE_URL);

		expect(resource).not.toHaveProperty("agent_auth");
		expect(as.agent_auth.skill).toBe(`${SITE_URL}/auth.md`);
		expect(as.agent_auth.register_uri).toBe(`${SITE_URL}/agent/auth`);
		expect(as.agent_auth.identity_types_supported).toEqual(["anonymous"]);
	});

	it("keeps public-read access without minting tokens or secrets", () => {
		const resource = oauthProtectedResource(SITE_URL);
		const as = oauthAuthorizationServer(SITE_URL);

		expect(resource.scopes_supported).toEqual(["public:read"]);
		expect(resource).not.toHaveProperty("jwks_uri");

		expect(as.token_endpoint_auth_methods_supported).toEqual([]);
		expect(as.response_types_supported).toEqual([]);
		expect(as).not.toHaveProperty("token_endpoint");
		expect(as).not.toHaveProperty("jwks_uri");
		expect(as.agent_auth.identity_types_supported).toEqual(["anonymous"]);
		expect(as.agent_auth.skill).toBe(`${SITE_URL}/auth.md`);
		expect(as.agent_auth.anonymous.credential_types_supported).toEqual([
			"none",
		]);
		expect(JSON.stringify(as.agent_auth)).not.toMatch(/api_key/);
	});
});
