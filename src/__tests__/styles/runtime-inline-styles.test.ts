import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { PAPER_SHADER_STYLE } from "@/styles/paper-shader-style";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const srcDir = join(root, "src");

const PAPER_SHADER_STYLE_HASH =
	"sha256-bcX2M6hOeEgeI9Ttj3KtXWZuoRsKenyQAlXswSnLakA=";

function readRepo(relativePath: string): string {
	return readFileSync(join(root, relativePath), "utf8");
}

function readSrc(relativePath: string): string {
	return readFileSync(join(srcDir, relativePath), "utf8");
}

function libraryPaperShaderStyle(): string {
	const mount = readRepo(
		"node_modules/@paper-design/shaders/dist/shader-mount.js",
	);
	const css = mount.match(/const defaultStyle = `([\s\S]*?)`;/)?.[1];
	if (!css) {
		throw new Error("Paper Shaders defaultStyle was not found");
	}
	return css;
}

describe("runtime inline styles (TA-1483)", () => {
	it("keeps the pre-placed Paper Shader CSS identical to the library", () => {
		const cssFile = readSrc("styles/paper-shader.css");
		expect(PAPER_SHADER_STYLE).toBe(libraryPaperShaderStyle());
		expect(cssFile).toMatch(/@layer paper-shaders/);
		expect(cssFile).toMatch(/:where\(\[data-paper-shader\]\)/);
		expect(cssFile).toMatch(/&\s*canvas/);
		expect(
			`sha256-${createHash("sha256").update(PAPER_SHADER_STYLE, "utf8").digest("base64")}`,
		).toBe(PAPER_SHADER_STYLE_HASH);
		expect(readRepo("astro.config.mjs")).toContain(PAPER_SHADER_STYLE_HASH);
	});

	it("pre-places style[data-paper-shader] so ShaderMount skips injection", () => {
		const hero = readSrc("components/landing/HomeHero.astro");
		expect(hero).toMatch(/<style is:inline data-paper-shader><\/style>/);
		expect(hero).toMatch(/styles\/paper-shader\.css/);
	});

	it("does not let React islands inject <style> at hydration", () => {
		expect(readSrc("components/MobileNav.tsx")).not.toMatch(/<style[\s>]/);
		expect(readSrc("components/NotFoundPlayground.tsx")).not.toMatch(
			/<style[\s>]/,
		);
		expect(readSrc("components/Header.astro")).toMatch(
			/styles\/mobile-nav\.css/,
		);
		expect(readSrc("components/NotFoundPlaygroundIsland.astro")).toMatch(
			/styles\/not-found-playground\.css/,
		);
	});

	it("does not add style-src-elem 'unsafe-inline'", () => {
		const config = readRepo("astro.config.mjs");
		expect(config).toMatch(/resource: "'unsafe-inline'", kind: "attribute"/);
		expect(config).not.toMatch(/resource: "'unsafe-inline'", kind: "element"/);
		expect(config).not.toMatch(/style-src-elem[^;]*unsafe-inline/);
	});
});
