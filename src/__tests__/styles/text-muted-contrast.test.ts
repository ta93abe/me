import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const css = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "../../styles/global.css"),
	"utf8",
);

function hexToRgb(hex: string): [number, number, number] {
	const value = hex.replace("#", "");
	return [
		Number.parseInt(value.slice(0, 2), 16),
		Number.parseInt(value.slice(2, 4), 16),
		Number.parseInt(value.slice(4, 6), 16),
	];
}

function srgbToLin(channel: number): number {
	const c = channel / 255;
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb: [number, number, number]): number {
	return (
		0.2126 * srgbToLin(rgb[0]) +
		0.7152 * srgbToLin(rgb[1]) +
		0.0722 * srgbToLin(rgb[2])
	);
}

function contrast(
	fg: [number, number, number],
	bg: [number, number, number],
): number {
	const a = luminance(fg);
	const b = luminance(bg);
	const lighter = Math.max(a, b);
	const darker = Math.min(a, b);
	return (lighter + 0.05) / (darker + 0.05);
}

function rootToken(name: string): string {
	const value = css.match(
		new RegExp(`:root\\s*\\{[\\s\\S]*?--${name}:\\s*(#[0-9a-f]{6})`, "i"),
	)?.[1];
	expect(value, name).toBeTruthy();
	return value ?? "#000000";
}

function block(selector: string): string {
	const start = css.indexOf(`${selector} {`);
	return css.slice(start, css.indexOf("\n}", start));
}

describe("text-muted contrast (TA-1482)", () => {
	it("keeps --text-muted at 4.5:1 on every light page surface", () => {
		const fg = hexToRgb(rootToken("text-muted"));
		for (const surface of ["bg-primary", "bg-secondary", "bg-tertiary"]) {
			expect(
				contrast(fg, hexToRgb(rootToken(surface))),
				surface,
			).toBeGreaterThanOrEqual(4.5);
		}
	});

	it("lets the home page reuse the shared neutral surfaces and muted text", () => {
		const home = block('body[data-theme="home"]');
		expect(home).not.toMatch(
			/--(bg-secondary|bg-tertiary|text-muted|border-color):/,
		);
		expect(home).toMatch(/--home-paper:\s*#ffffff/);
	});
});

describe("monochrome palette", () => {
	// 無彩色（R=G=B）か、紫（青と赤が緑より強い）だけを許す
	function isNeutralOrPurple(hex: string): boolean {
		const [r, g, b] = hexToRgb(hex);
		if (r === g && g === b) {
			return true;
		}
		return b > g && r > g;
	}

	it("uses only grays and purple in the site and home tokens", () => {
		const tokens = [block(":root"), block('body[data-theme="home"]')].join(
			"\n",
		);
		const hexes = tokens.match(/#[0-9a-f]{6}\b/gi) ?? [];
		expect(hexes.length).toBeGreaterThan(10);
		for (const hex of hexes) {
			expect(isNeutralOrPurple(hex), hex).toBe(true);
		}
	});
});
