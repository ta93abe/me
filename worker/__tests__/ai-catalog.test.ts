import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
	AGENT_CATALOG_LINKS,
	AI_CATALOG_CORS_HEADERS,
	AI_CATALOG_PATH,
	ARD_MANIFEST_PATH,
	DID_WEB_PATH,
	aiCatalog,
	didWebDocument,
	isAiCatalogPath,
} from "../discovery/ai-catalog.ts";

const URN = /^urn:air:ta93abe\.com:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/;
const HAS_JAPANESE = /[\u3040-\u30ff\u4e00-\u9fff]/;
const HAS_LATIN = /[A-Za-z]/;
const SITE_URL = "https://ta93abe.com";

describe("ARD capability manifest", () => {
	const catalog = aiCatalog();

	it("matches the ai-catalog / ARD scanner shape", () => {
		expect(catalog.specVersion).toBe("1.0");
		expect(catalog.host.displayName).toBe("Takumi Abe / ta93abe");
		expect(catalog.host.identifier).toBe("did:web:ta93abe.com");
		expect(catalog.entries.length).toBeGreaterThan(0);
	});

	it("publishes a did:web document that matches the catalog host identifier", () => {
		const did = didWebDocument();
		expect(did.id).toBe(catalog.host.identifier);
		expect(did.alsoKnownAs).toContain(`${SITE_URL}/`);
		expect(DID_WEB_PATH).toBe("/.well-known/did.json");
	});

	it("points entries at existing discovery documents", () => {
		const urls = catalog.entries.map((entry) => entry.url);
		expect(urls).toEqual(
			expect.arrayContaining([
				`${SITE_URL}/.well-known/mcp/server-card.json`,
				`${SITE_URL}/.well-known/agent-card.json`,
				`${SITE_URL}/.well-known/agent-skills/site-overview/SKILL.md`,
				`${SITE_URL}/.well-known/agent-skills/index.json`,
				`${SITE_URL}/.well-known/api-catalog`,
				`${SITE_URL}/llms.txt`,
			]),
		);
		expect(new Set(urls).size).toBe(urls.length);
	});

	it("gives each entry a domain-anchored URN, displayName, type, and url", () => {
		const queries: string[] = [];
		for (const entry of catalog.entries) {
			expect(entry.identifier).toMatch(URN);
			expect(entry.displayName.length).toBeGreaterThan(0);
			expect(entry.type).toMatch(/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i);
			expect(entry.url).toMatch(/^https:\/\/ta93abe\.com\//);
			expect("data" in entry).toBe(false);
			expect(entry.representativeQueries.length).toBeGreaterThanOrEqual(2);
			expect(entry.representativeQueries.length).toBeLessThanOrEqual(5);
			queries.push(...entry.representativeQueries);
		}
		expect(queries.some((query) => HAS_JAPANESE.test(query))).toBe(true);
		expect(queries.some((query) => HAS_LATIN.test(query))).toBe(true);
		const identifiers = catalog.entries.map((entry) => entry.identifier);
		expect(new Set(identifiers).size).toBe(identifiers.length);
	});

	it("advertises catalog Link relations and CORS for well-known paths", () => {
		expect(AGENT_CATALOG_LINKS).toContain(
			`<${AI_CATALOG_PATH}>; rel="ai-catalog"; type="application/json"`,
		);
		expect(AGENT_CATALOG_LINKS).toContain(
			`<${ARD_MANIFEST_PATH}>; rel="ard"; type="application/json"`,
		);
		expect(AI_CATALOG_CORS_HEADERS["Access-Control-Allow-Origin"]).toBe("*");
		expect(isAiCatalogPath(AI_CATALOG_PATH)).toBe(true);
		expect(isAiCatalogPath(ARD_MANIFEST_PATH)).toBe(true);
		expect(isAiCatalogPath("/.well-known/api-catalog")).toBe(false);
	});

	it("publishes an Agentmap in robots.txt", () => {
		const robots = readFileSync(resolve("public/robots.txt"), "utf8");
		expect(robots).toContain(`Agentmap: https://ta93abe.com${AI_CATALOG_PATH}`);
	});
});
