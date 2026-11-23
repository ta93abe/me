import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = join(srcDir, "..");

function readSrc(relativePath: string): string {
	return readFileSync(join(srcDir, relativePath), "utf8");
}

function fontFaceBlocks(css: string): string[] {
	return css.match(/@font-face\s*\{[\s\S]*?\}/g) ?? [];
}

describe("layout webfonts (TA-1539 / TA-2240)", () => {
	const fonts = readSrc("styles/fonts.css");
	const deferred = readSrc("styles/fonts-defer.css");
	const globalCss = readSrc("styles/global.css");
	const layout = readSrc("layouts/Layout.astro");
	const deferredScript = readSrc("scripts/deferred-fonts.ts");
	const slideTokens = readSrc("slides/design-system/tokens.css");
	const faces = [...fontFaceBlocks(fonts), ...fontFaceBlocks(deferred)];
	const criticalFaces = fontFaceBlocks(fonts);
	const japaneseFaces = faces.filter((face) => face.includes("-japanese-"));

	it("keeps @font-face out of the exploded @fontsource weight CSS", () => {
		expect(globalCss).not.toMatch(/@fontsource\/[^"' ]+\/\d{3}\.css/);
		expect(layout).toMatch(/styles\/fonts\.css/);
		expect(slideTokens).not.toMatch(/@fontsource\/[^"' ]+\/\d{3}\.css/);
	});

	it("declares at most 30 @font-face rules for Layout", () => {
		expect(faces.length).toBeGreaterThan(0);
		expect(faces.length).toBeLessThanOrEqual(30);
	});

	it("keeps only the weights the site actually uses", () => {
		expect(fonts).toContain('font-family: "Noto Serif JP"');
		expect(fonts).toContain('font-family: "Shippori Mincho"');
		expect(fonts).toContain('font-family: "Inter"');
		expect(fonts).toMatch(/font-weight:\s*400/);
		expect(fonts).toMatch(/font-weight:\s*700/);
		expect(fonts).toMatch(/font-weight:\s*500/);
		expect(fonts).not.toMatch(/font-weight:\s*600/);
		for (const face of faces.filter((block) =>
			block.includes("Shippori Mincho"),
		)) {
			expect(face).not.toMatch(/font-weight:\s*500/);
		}
	});

	it("uses optional display so late CJK files cannot shift layout or delay LCP", () => {
		for (const face of faces) {
			expect(face).toMatch(/font-display:\s*optional/);
			expect(face).not.toMatch(/font-display:\s*swap/);
		}
	});

	it("uses subset woff2 files instead of unicode-range shards", () => {
		expect(fonts).toMatch(/noto-serif-jp-japanese-400-normal\.woff2/);
		expect(fonts).toMatch(/shippori-mincho-japanese-700-normal\.woff2/);
		expect(deferred).toMatch(/shippori-mincho-japanese-400-normal\.woff2/);
		expect(deferred).toMatch(/noto-serif-jp-japanese-700-normal\.woff2/);
		expect(fonts).toMatch(/inter-latin-500-normal\.woff2/);
		expect(fonts).not.toMatch(/noto-serif-jp-\d+-400-normal/);
		expect(fonts).not.toMatch(/\.woff"/);
		for (const face of faces) {
			const src = face.match(/src:\s*url\("([^"]+)"\)/)?.[1];
			expect(src, face).toBeTruthy();
			const filename = src?.replace(/^@fontsource\//, "") ?? "";
			expect(
				existsSync(join(repoRoot, "node_modules/@fontsource", filename)),
				filename,
			).toBe(true);
		}
	});

	it("keeps latin faces ranged so the japanese file is not fetched for ASCII", () => {
		const latinFaces = faces.filter((face) => face.includes("-latin-"));
		expect(latinFaces.length).toBeGreaterThan(0);
		for (const face of latinFaces) {
			expect(face).toMatch(/unicode-range:\s*U\+0000-00FF/);
		}
	});

	it("ranges japanese faces to CJK so ASCII does not fetch the 140KB files", () => {
		expect(japaneseFaces.length).toBeGreaterThan(0);
		for (const face of japaneseFaces) {
			expect(face).toMatch(/unicode-range:/);
			expect(face).toMatch(/U\+3040-309F/);
			expect(face).toMatch(/U\+4E00-9FFF/);
			expect(face).not.toMatch(/U\+0000-00FF/);
		}
	});

	it("keeps body 400 japanese and display 700 in the render-blocking CSS", () => {
		expect(fonts).toMatch(/noto-serif-jp-japanese-400-normal\.woff2/);
		expect(fonts).toMatch(/shippori-mincho-japanese-700-normal\.woff2/);
		expect(fonts).not.toMatch(/shippori-mincho-japanese-400-normal\.woff2/);
		expect(fonts).not.toMatch(/noto-serif-jp-japanese-700-normal\.woff2/);
		expect(criticalFaces.length).toBeLessThan(faces.length);
	});

	it("loads the remaining CJK faces after window load", () => {
		expect(layout).toMatch(/scripts\/deferred-fonts\.ts/);
		expect(layout).toContain("fonts-defer.css?url");
		expect(layout).toMatch(/data-deferred-fonts=\{deferredFontsHref\}/);
		expect(deferredScript).not.toContain("fonts-defer.css?url");
		expect(deferredScript).toMatch(/dataset\.deferredFonts/);
		expect(deferredScript).toMatch(/addEventListener\(\s*"load"/);
		expect(layout).not.toMatch(/styles\/fonts-defer\.css"/);
	});

	it("does not stack two webfonts as fallbacks of each other", () => {
		expect(globalCss).toMatch(/--font-body:\s*"Noto Serif JP"/);
		expect(globalCss).toMatch(/--font-display:\s*"Shippori Mincho"/);
		expect(globalCss).not.toMatch(/--font-body:[^;]*"Shippori Mincho"/);
		expect(globalCss).not.toMatch(/--font-display:[^;]*"Noto Serif JP"/);
		expect(layout).toMatch(/skip-link font-sans/);
		expect(readSrc("components/Header.astro")).toMatch(/font-sans/);
		expect(readSrc("components/Footer.astro")).toMatch(/font-sans/);
	});
});
