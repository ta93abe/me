import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSrc(relativePath: string): string {
	return readFileSync(join(srcDir, relativePath), "utf8");
}

describe("404 canonical omission", () => {
	it("lets Layout skip rel=canonical when omitCanonical is set", () => {
		const layout = readSrc("layouts/Layout.astro");
		expect(layout).toContain("omitCanonical");
		expect(layout).toMatch(/!omitCanonical &&[\s\S]*rel="canonical"/);
	});

	it("asks the static 404 page not to emit a canonical", () => {
		const page = readSrc("pages/404.astro");
		expect(page).toContain("noindex");
		expect(page).toContain("omitCanonical");
	});

	it("asks missing blog slugs not to emit a canonical", () => {
		const page = readSrc("pages/blog/[id].astro");
		expect(page).toMatch(
			/!post \? \([\s\S]*noindex[\s\S]*omitCanonical[\s\S]*NotFoundPlayground/,
		);
	});
});
