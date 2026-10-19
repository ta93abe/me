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

function mix(
	a: [number, number, number],
	amount: number,
	b: [number, number, number],
): [number, number, number] {
	return [
		Math.round(a[0] * amount + b[0] * (1 - amount)),
		Math.round(a[1] * amount + b[1] * (1 - amount)),
		Math.round(a[2] * amount + b[2] * (1 - amount)),
	];
}

describe("text-muted contrast (TA-1482)", () => {
	it("keeps --text-muted at 4.5:1 on light page backgrounds", () => {
		const muted = css.match(
			/:root\s*\{[\s\S]*?--text-muted:\s*(#[0-9a-f]{6})/i,
		);
		expect(muted?.[1]).toBeTruthy();
		const fg = hexToRgb(muted?.[1] ?? "#000000");
		expect(contrast(fg, hexToRgb("#ffffff"))).toBeGreaterThanOrEqual(4.5);
		expect(contrast(fg, hexToRgb("#f6f6f4"))).toBeGreaterThanOrEqual(4.5);
		expect(contrast(fg, hexToRgb("#eeeeeb"))).toBeGreaterThanOrEqual(4.5);
	});

	it("keeps the home muted mix at 4.5:1 on paper and card surfaces", () => {
		expect(css).toMatch(
			/--text-muted:\s*color-mix\(in srgb, var\(--home-ink-soft\) 90%, var\(--home-paper\)\)/,
		);
		const paper = hexToRgb("#f4eef8");
		const inkSoft = hexToRgb("#4c3a63");
		const field = hexToRgb("#6b21a8");
		const secondary = mix(paper, 0.88, field);
		const tertiary = mix(paper, 0.78, field);
		const muted = mix(inkSoft, 0.9, paper);
		expect(contrast(muted, paper)).toBeGreaterThanOrEqual(4.5);
		expect(contrast(muted, secondary)).toBeGreaterThanOrEqual(4.5);
		expect(contrast(muted, tertiary)).toBeGreaterThanOrEqual(4.5);
	});
});
