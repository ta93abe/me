import { describe, expect, it } from "vitest";

import { POPPY_PATH, poppyManifest } from "../discovery/poppy.ts";
import { oauthAuthorizationServer } from "../oauth-metadata.ts";

const SITE_URL = "https://ta93abe.com";

describe("Personal Agent Protocol manifest", () => {
	it("is served at the well-known path", () => {
		expect(POPPY_PATH).toBe("/.well-known/poppy.json");
	});

	it("declares draft 0.3, the serving host, and a signed-out web channel", () => {
		const manifest = poppyManifest();
		expect(manifest.protocol_version).toBe("0.3");
		expect(manifest.organization.domain).toBe(new URL(SITE_URL).host);
		expect(manifest.organization.name.length).toBeGreaterThan(0);
		expect(manifest.web).toEqual({});
		expect(manifest).not.toHaveProperty("auth");
	});

	it("lets agents verify the issuer covers this resource", () => {
		const as = oauthAuthorizationServer(SITE_URL);
		expect(as.issuer).toBe(SITE_URL);
		expect(as.protected_resources).toContain(
			`https://${poppyManifest().organization.domain}`,
		);
	});
});
