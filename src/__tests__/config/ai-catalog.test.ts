import { describe, expect, it } from "vitest";

import {
	AI_CATALOG_PATH,
	AI_CATALOG_REL,
	AI_CATALOG_TYPE,
	aiCatalogHttpLink,
	aiCatalogUrl,
} from "@/config/ai-catalog";
import { SITE } from "@/config/site";

describe("ARD ai-catalog discovery", () => {
	it("uses an absolute catalog URL on the site origin", () => {
		expect(aiCatalogUrl()).toBe(
			"https://ta93abe.com/.well-known/ai-catalog.json",
		);
		expect(aiCatalogUrl(SITE.url)).toBe(
			"https://ta93abe.com/.well-known/ai-catalog.json",
		);
		expect(aiCatalogUrl("https://ta93abe.com/")).toBe(
			"https://ta93abe.com/.well-known/ai-catalog.json",
		);
	});

	it("matches the HTTP Link form used by homepage discovery headers", () => {
		expect(AI_CATALOG_PATH).toBe("/.well-known/ai-catalog.json");
		expect(AI_CATALOG_REL).toBe("ai-catalog");
		expect(AI_CATALOG_TYPE).toBe("application/json");
		expect(aiCatalogHttpLink()).toBe(
			`</.well-known/ai-catalog.json>; rel="ai-catalog"; type="application/json"`,
		);
	});
});
