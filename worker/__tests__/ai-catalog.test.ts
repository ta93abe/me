import { describe, expect, it } from "vitest";

import { aiCatalog } from "../discovery/ai-catalog.ts";

const URN_PATTERN = /^urn:air:[a-zA-Z0-9.-]+(:[a-zA-Z0-9._-]+)+$/;
const SITE_URL = "https://ta93abe.com";
const HAS_JAPANESE = /[\u3040-\u30ff\u3400-\u9fff]/;
const HAS_LATIN = /[A-Za-z]/;

describe("ARD capability manifest", () => {
	it("uses ai-catalog specVersion 1.0 with a named host", () => {
		const catalog = aiCatalog();

		expect(catalog.specVersion).toBe("1.0");
		expect(catalog.host.displayName).toBe("Takumi Abe / ta93abe");
		expect(catalog.host.identifier).toBe("did:web:ta93abe.com");
		expect(catalog.entries.length).toBeGreaterThan(0);
	});

	it("lists MCP, Agent Skills, A2A, and llms.txt as url-backed entries", () => {
		const urls = aiCatalog().entries.map((entry) => entry.url);

		expect(urls).toContain(`${SITE_URL}/.well-known/mcp/server-card.json`);
		expect(urls).toContain(
			`${SITE_URL}/.well-known/agent-skills/site-overview/SKILL.md`,
		);
		expect(urls).toContain(`${SITE_URL}/.well-known/agent-card.json`);
		expect(urls).toContain(`${SITE_URL}/llms.txt`);
		expect(urls).toContain(`${SITE_URL}/auth.md`);
	});

	it("gives every entry a domain-anchored URN, type, and representative queries", () => {
		for (const entry of aiCatalog().entries) {
			expect(entry.identifier).toMatch(URN_PATTERN);
			expect(entry.identifier).toContain("ta93abe.com");
			expect(entry.displayName.length).toBeGreaterThan(0);
			expect(entry.type.length).toBeGreaterThan(0);
			expect(entry.url.startsWith(SITE_URL)).toBe(true);
			expect("data" in entry).toBe(false);
			expect(entry.representativeQueries.length).toBeGreaterThanOrEqual(2);
			expect(entry.representativeQueries.length).toBeLessThanOrEqual(5);
			expect(
				entry.representativeQueries.some((query) => HAS_JAPANESE.test(query)),
				`${entry.identifier} should include a Japanese representativeQuery`,
			).toBe(true);
			expect(
				entry.representativeQueries.some((query) => HAS_LATIN.test(query)),
				`${entry.identifier} should include an English representativeQuery`,
			).toBe(true);
		}
	});
});
