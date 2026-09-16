import { describe, expect, it } from "vitest";

import {
	agentAuthMetadata,
	oauthAuthorizationServer,
	oauthProtectedResource,
} from "../oauth-metadata.ts";

const SITE_URL = "https://ta93abe.com";

/** RFC 8414 well-known insertion: issuer → AS metadata URL. */
function authorizationServerMetadataUrl(issuer: string): string {
	const url = new URL(issuer);
	const suffix = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
	return `${url.origin}/.well-known/oauth-authorization-server${suffix}`;
}

describe("OAuth / agent_auth metadata", () => {
	it("lists the AS issuer in PRM authorization_servers (RFC 9728)", () => {
		const as = oauthAuthorizationServer(SITE_URL);
		const prm = oauthProtectedResource(SITE_URL);

		expect(as.issuer).toBe(SITE_URL);
		expect(prm.resource).toBe(SITE_URL);
		expect(prm.authorization_servers).toEqual([as.issuer]);
		expect(prm.authorization_servers[0]).not.toContain("/.well-known/");
	});

	it("lets a scanner resolve agent_auth via the PRM → AS two-hop", () => {
		const as = oauthAuthorizationServer(SITE_URL);
		const prm = oauthProtectedResource(SITE_URL);
		const issuer = prm.authorization_servers[0];

		expect(issuer).toBeDefined();
		expect(authorizationServerMetadataUrl(issuer ?? "")).toBe(
			`${SITE_URL}/.well-known/oauth-authorization-server`,
		);
		expect(as.issuer).toBe(issuer);
		expect(as.agent_auth.skill).toBe(`${SITE_URL}/auth.md`);
		expect(as.agent_auth.register_uri).toBe(`${SITE_URL}/agent/auth`);
		expect(as.agent_auth.identity_types_supported).toContain("anonymous");
	});

	it("points agent_auth.skill and register_uri at the public site", () => {
		const auth = agentAuthMetadata(SITE_URL);
		expect(auth.skill).toBe(`${SITE_URL}/auth.md`);
		expect(auth.register_uri).toBe(`${SITE_URL}/agent/auth`);
	});
});
