import { describe, expect, it } from "vitest";

import {
	authorizationServerMetadataUrl,
	oauthAuthorizationServer,
	oauthProtectedResource,
} from "../oauth-metadata.ts";

const SITE_URL = "https://ta93abe.com";
const WELL_KNOWN = "https://ta93abe.com/.well-known/oauth-authorization-server";

describe("oauth protected resource metadata", () => {
	it("lists the authorization server issuer, not the well-known URL", () => {
		const as = oauthAuthorizationServer(SITE_URL);
		const prm = oauthProtectedResource(SITE_URL);

		expect(as.issuer).toBe(SITE_URL);
		expect(prm.authorization_servers).toEqual([SITE_URL]);
		expect(prm.authorization_servers).toContain(as.issuer);
		expect(prm.authorization_servers).not.toContain(WELL_KNOWN);
	});

	it("lets RFC 8414 clients resolve the real well-known metadata URL", () => {
		const prm = oauthProtectedResource(SITE_URL);
		const issuer = prm.authorization_servers[0] ?? "";
		expect(issuer).toBe(SITE_URL);

		const metadataUrl = authorizationServerMetadataUrl(issuer);
		expect(metadataUrl).toBe(WELL_KNOWN);
		expect(metadataUrl).not.toContain(
			"/.well-known/oauth-authorization-server/.well-known/",
		);
	});

	it("reproduces the double-path 404 when the well-known URL is treated as issuer", () => {
		expect(authorizationServerMetadataUrl(WELL_KNOWN)).toBe(
			`${WELL_KNOWN}/.well-known/oauth-authorization-server`,
		);
	});
});
