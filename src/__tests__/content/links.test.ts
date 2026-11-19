import { describe, expect, it } from "vitest";

import { readLinks } from "../helpers/site-content.ts";

// src/content/links/*.mdx を schema で検証し、order 順に読む。
const linksData = { links: readLinks() };

describe("curated links", () => {
	it("keeps 6–8 active profiles", () => {
		expect(linksData.links.length).toBeGreaterThanOrEqual(6);
		expect(linksData.links.length).toBeLessThanOrEqual(8);
	});

	it("includes the places that are actually updated", () => {
		expect(linksData.links.map((link) => link.name)).toEqual([
			"GitHub",
			"Zenn",
			"X",
			"LinkedIn",
			"Speaker Deck",
			"connpass",
			"Substack",
		]);
	});

	it("drops placeholder social entries", () => {
		const names = new Set(linksData.links.map((link) => link.name));
		for (const placeholder of [
			"WhatsApp",
			"Signal",
			"Product Hunt",
			"TikTok",
			"Qiita",
		]) {
			expect(names.has(placeholder)).toBe(false);
		}
	});
});
