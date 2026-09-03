import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("published content", () => {
	it("does not keep site copy in src/content", () => {
		expect(existsSync(join(process.cwd(), "src/content"))).toBe(false);
		expect(existsSync(join(process.cwd(), "src/content.config.ts"))).toBe(
			false,
		);
	});

	it("does not keep the Sveltia admin UI", () => {
		expect(existsSync(join(process.cwd(), "public/admin"))).toBe(false);
	});
});
