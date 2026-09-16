import { describe, expect, it } from "vitest";

import { authMarkdown } from "../auth-md.ts";

const SITE_URL = "https://ta93abe.com";
const SITE_HOST = "ta93abe.com";

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
		expect(md).toContain('"api_key": "public"');
	});

	it("stays consistent with anonymous public read", () => {
		expect(md).not.toMatch(/claim_uri/);
		expect(md.toLowerCase()).toContain("no secret");
		expect(md).toContain(`issuer`);
		expect(md).toContain(SITE_URL);
		expect(md).toContain(SITE_HOST);
		expect(md).toContain("/.well-known/oauth-authorization-server");
		expect(md).toContain("/.well-known/oauth-protected-resource");
	});
});
