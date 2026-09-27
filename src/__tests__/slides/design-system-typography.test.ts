import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const designSystemDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../slides/design-system",
);

describe("slide design-system typography tokens", () => {
	it("aligns font stacks with site utilities and scales display/section/body", async () => {
		const tokens = await readFile(
			path.join(designSystemDir, "tokens.css"),
			"utf8",
		);
		const typography = await readFile(
			path.join(designSystemDir, "typography.css"),
			"utf8",
		);

		expect(tokens).toContain('"Shippori Mincho"');
		expect(tokens).toContain("--font-display:");
		expect(tokens).toContain('"Inter"');
		expect(tokens).toContain("--font-body:");
		expect(tokens).toMatch(/--fs-display:/);
		expect(tokens).toMatch(/--fs-section:/);
		expect(tokens).toMatch(/--fs-body:/);
		expect(tokens).toMatch(/--fs-quote:/);
		expect(tokens).toMatch(/--measure-quote:/);

		expect(typography).toContain("font-family: var(--font-body)");
		expect(typography).toContain("font-family: var(--font-display)");
	});
});
