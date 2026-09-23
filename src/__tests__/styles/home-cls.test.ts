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
		const nav = readSrc("components/MobileNav.tsx");
		expect(nav).toMatch(/dialog:not\(\[open\]\)/);
		expect(nav).toMatch(/display:\s*none/);
		expect(nav).not.toMatch(/\bh-dvh\b/);
	});

	it("does not hydrate the mobile nav island on desktop", () => {
		const header = readSrc("components/Header.astro");
		expect(header).toMatch(/client:media="\(max-width:\s*767px\)"/);
		expect(header).not.toMatch(/client:load/);
	});
});
