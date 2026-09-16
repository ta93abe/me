import { describe, expect, it } from "vitest";

import {
	agentAuthMetadata,
	agentAuthRegisterResponse,
	buildAuthMd,
} from "../agent-discovery.ts";

const siteUrl = "https://ta93abe.com";
const siteHost = "ta93abe.com";

describe("agent discovery auth contract", () => {
	it("advertises anonymous access with no credential type", () => {
		const metadata = agentAuthMetadata(siteUrl);

		expect(metadata.identity_types_supported).toEqual(["anonymous"]);
		expect(metadata.anonymous.credential_types_supported).toEqual(["none"]);
		expect(metadata.register_uri).toBe(`${siteUrl}/agent/auth`);
		expect(JSON.stringify(metadata)).not.toMatch(/api_key/);
	});

	it("acknowledges public access without a fake api_key", () => {
		const body = agentAuthRegisterResponse(siteUrl);

		expect(body.identity_type).toBe("anonymous");
		expect(body.credential_type).toBe("none");
		expect(body).not.toHaveProperty("api_key");
		expect(JSON.stringify(body)).not.toMatch(/api_key/);
		expect(body.note).toMatch(/no authentication/i);
	});

	it("keeps auth.md aligned with no-bearer public read", () => {
		const md = buildAuthMd(siteUrl, siteHost);

		expect(md).toMatch(/^# Auth\.md/m);
		expect(md).toContain("credential_types_supported");
		expect(md).toContain("credential_type: none");
		expect(md).toContain("No bearer token is required");
		expect(md).toContain("Do not send an `Authorization` header.");
		expect(md).not.toMatch(/api_key/);
		expect(md).not.toMatch(/Bearer public/i);
	});
});
