import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/** `src/content.config.ts` で宣言しているコレクション（ADR-0003、TA-2152）。 */
const COLLECTIONS = ["blog", "links", "works"];

describe("published content", () => {
	it("keeps only declared collections of <slug>.mdx in src/content", () => {
		const contentDir = join(process.cwd(), "src/content");
		expect(readdirSync(contentDir).toSorted()).toEqual(COLLECTIONS);
		for (const collection of COLLECTIONS) {
			const files = readdirSync(join(contentDir, collection));
			expect(files.length, collection).toBeGreaterThan(0);
			for (const file of files) {
				expect(file).toMatch(/^[a-z0-9][a-z0-9-]*\.mdx$/);
			}
		}
	});
});
