import { describe, expect, it } from "vitest";

import {
	AI_CATALOG_CORS_HEADERS,
	aiCatalog,
	isAiCatalogPath,
} from "../discovery/ai-catalog.ts";

const URN_PATTERN = /^urn:air:[a-zA-Z0-9.-]+(:[a-zA-Z0-9._-]+)+$/;
const HAS_JAPANESE = /[\u3040-\u30ff\u4e00-\u9fff]/;
const HAS_LATIN = /[A-Za-z]/;
const SITE_URL = "https://ta93abe.com";

describe("ARD capability manifest", () => {
	it("uses ai-catalog specVersion 1.0 with a named, identifiable host", () => {
		const catalog = aiCatalog();

		expect(catalog.specVersion).toBe("1.0");
		expect(catalog.specVersion.length).toBeGreaterThan(0);
		expect(catalog.host.displayName).toBe("Takumi Abe / ta93abe");
		expect(catalog.host.identifier).toBe("did:web:ta93abe.com");
		expect(catalog.entries.length).toBeGreaterThan(0);
	});

	it("lists MCP, A2A, Agent Skills, api-catalog, and llms.txt as url-backed entries", () => {
		const urls = aiCatalog().entries.map((entry) => entry.url);

		expect(urls).toContain(`${SITE_URL}/.well-known/mcp/server-card.json`);
		expect(urls).toContain(`${SITE_URL}/.well-known/agent-card.json`);
		expect(urls).toContain(`${SITE_URL}/.well-known/agent-skills/index.json`);
		expect(urls).toContain(
			`${SITE_URL}/.well-known/agent-skills/site-overview/SKILL.md`,
		);
		expect(urls).toContain(`${SITE_URL}/.well-known/api-catalog`);
		expect(urls).toContain(`${SITE_URL}/llms.txt`);
	});

	it("gives every entry a domain-anchored URN, type, exclusive url, and 2-5 queries", () => {
		const catalogQueries: string[] = [];

		for (const entry of aiCatalog().entries) {
			expect(entry.identifier).toMatch(URN_PATTERN);
			expect(entry.identifier.startsWith("urn:air:ta93abe.com:")).toBe(true);
			expect(entry.displayName.length).toBeGreaterThan(0);
			expect(entry.type.length).toBeGreaterThan(0);
			expect(entry.url.startsWith(SITE_URL)).toBe(true);
			expect("data" in entry).toBe(false);
			expect(entry.representativeQueries.length).toBeGreaterThanOrEqual(2);
			expect(entry.representativeQueries.length).toBeLessThanOrEqual(5);
			catalogQueries.push(...entry.representativeQueries);
		}

		expect(catalogQueries.some((query) => HAS_JAPANESE.test(query))).toBe(true);
		expect(catalogQueries.some((query) => HAS_LATIN.test(query))).toBe(true);

		const identifiers = aiCatalog().entries.map((entry) => entry.identifier);
		expect(new Set(identifiers).size).toBe(identifiers.length);
	});

	it("advertises CORS * for the well-known catalog paths", () => {
		expect(AI_CATALOG_CORS_HEADERS["Access-Control-Allow-Origin"]).toBe("*");
		expect(isAiCatalogPath("/.well-known/ai-catalog.json")).toBe(true);
		expect(isAiCatalogPath("/.well-known/ard.json")).toBe(true);
		expect(isAiCatalogPath("/.well-known/api-catalog")).toBe(false);
	});
});
