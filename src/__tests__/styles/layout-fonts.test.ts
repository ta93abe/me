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

describe("layout webfonts (TA-1539)", () => {
	const fonts = readSrc("styles/fonts.css");
	const globalCss = readSrc("styles/global.css");
	const layout = readSrc("layouts/Layout.astro");
	const slideTokens = readSrc("slides/design-system/tokens.css");
	const faces = fontFaceBlocks(fonts);

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

	it("uses subset woff2 files instead of unicode-range shards", () => {
		expect(fonts).toMatch(/noto-serif-jp-japanese-400-normal\.woff2/);
		expect(fonts).toMatch(/shippori-mincho-japanese-700-normal\.woff2/);
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
});
