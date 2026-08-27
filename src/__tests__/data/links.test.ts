import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const linksPath = join(
	dirname(fileURLToPath(import.meta.url)),
	"../../data/links.json",
);

const linksData = JSON.parse(readFileSync(linksPath, "utf8")) as {
	links: Array<{ name: string; url: string; icon: string }>;
};

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
