import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSrc(relativePath: string): string {
	return readFileSync(join(root, relativePath), "utf8");
}

describe("home layout shift guards", () => {
	it("does not pin the home hero copy to viewport-centered flex or dvh/svh/vh", () => {
		const hero = readSrc("components/landing/HomeHero.astro");
		const copyBlock = hero.match(/\.home-hero-copy\s*\{[^}]+\}/)?.[0] ?? "";
		expect(copyBlock).toMatch(/\.home-hero-copy/);
		expect(copyBlock).not.toMatch(/justify-content:\s*center/);
		expect(hero).not.toMatch(/\b100(?:d|s)?vh\b/);
	});

	it("does not lock the home page viewport", () => {
		const index = readSrc("pages/index.astro");
		expect(index).not.toMatch(/\blockViewport\b/);
		expect(index).toMatch(/\bhomeTheme\b/);
	});

	it("keeps lock-viewport height on the layout viewport, not dynamic dvh", () => {
		const css = readSrc("styles/global.css");
		expect(css).toMatch(/body\.lock-viewport\s*\{[^}]*height:\s*100%/s);
		expect(css).not.toMatch(/body\.lock-viewport\s*\{[^}]*100dvh/s);
	});

	it("hides a closed mobile nav dialog so it cannot occupy layout", () => {
		const css = readSrc("styles/mobile-nav.css");
		expect(css).toMatch(/dialog:not\(\[open\]\)/);
		expect(css).toMatch(/display:\s*none/);
		expect(css).not.toMatch(/\bh-dvh\b/);
	});

	it("does not hydrate a React island for the mobile nav", () => {
		const header = readSrc("components/Header.astro");
		expect(header).not.toMatch(/client:/);
		expect(header).toMatch(/MobileNav\.astro/);
		expect(readSrc("components/MobileNav.astro")).toMatch(/<dialog/);
		expect(readSrc("components/MobileNav.astro")).not.toMatch(/framer-motion/);
		expect(readSrc("scripts/mobile-nav.ts")).toMatch(/min-width:\s*48rem/);
		const pkg = JSON.parse(readSrc("../package.json")) as {
			dependencies: Record<string, string>;
		};
		expect(pkg.dependencies["framer-motion"]).toBeUndefined();
	});

	it("animates the mobile nav with starting-style and honors reduced motion", () => {
		const css = readSrc("styles/mobile-nav.css");
		expect(css).toMatch(/@starting-style/);
		expect(css).toMatch(/allow-discrete/);
		expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
		expect(css).toMatch(/transition:\s*none/);
	});
});
