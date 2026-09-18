import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function pngDimensions(file: string): { width: number; height: number } {
	const buf = readFileSync(file);
	return {
		width: buf.readUInt32BE(16),
		height: buf.readUInt32BE(20),
	};
}

describe("site favicon assets", () => {
	it("keeps the tab icon small enough for every-page fetches", () => {
		const file = join(root, "public/favicon.png");
		expect(statSync(file).size).toBeLessThanOrEqual(8 * 1024);
		const { width, height } = pngDimensions(file);
		expect([32, 48]).toContain(width);
		expect(height).toBe(width);
	});

	it("serves apple-touch-icon as a separate 180px asset", () => {
		const file = join(root, "public/apple-touch-icon.png");
		expect(existsSync(file)).toBe(true);
		expect(statSync(file).size).toBeLessThanOrEqual(32 * 1024);
		expect(pngDimensions(file)).toEqual({ width: 180, height: 180 });
	});
});

describe("favicon HTML", () => {
	it("points layouts at the small PNG and a separate apple-touch-icon", () => {
		for (const rel of [
			"src/layouts/Layout.astro",
			"src/layouts/SlideDeck.astro",
		]) {
			const html = readFileSync(join(root, rel), "utf8");
			expect(html, rel).toContain('rel="icon" type="image/png"');
			expect(html, rel).toContain('href="/favicon.png"');
			expect(html, rel).toContain('rel="apple-touch-icon"');
			expect(html, rel).toContain('href="/apple-touch-icon.png"');
		}
	});
});
