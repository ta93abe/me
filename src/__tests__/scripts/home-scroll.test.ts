import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readSrc(relativePath: string): string {
	return readFileSync(join(root, relativePath), "utf8");
}

describe("home scroll story (TA-1109 stage 2)", () => {
	it("mounts Lenis + GSAP only from the home page script", () => {
		const index = readSrc("pages/index.astro");
		expect(index).toMatch(/initHomeExperience/);
		expect(index).toMatch(/scripts\/home\/mount\.ts/);
	});

	it("defers heavy motion modules until idle (TA-1109 stage 3)", () => {
		const mount = readSrc("scripts/home/mount.ts");
		expect(mount).toMatch(/scheduleWhenIdleOrInteractive/);
		expect(mount).toMatch(/import\("\.\/bloom\.ts"\)/);
		expect(mount).toMatch(/import\("\.\/scroll\.ts"\)/);
		expect(mount).not.toMatch(/from "\.\/scroll\.ts"/);
		expect(mount).not.toMatch(/from "\.\/bloom\.ts"/);
	});

	it("does not split or fade the hero tagline before LCP (TA-2241)", () => {
		const scroll = readSrc("scripts/home/scroll.ts");
		expect(scroll).not.toMatch(/home-hero-tagline/);
		expect(scroll).toMatch(/home-manifesto-heading/);
		expect(scroll).toMatch(/splitWords/);
	});

	it("loads Paper Shaders after LCP instead of with Lenis (TA-2241)", () => {
		const mount = readSrc("scripts/home/mount.ts");
		expect(mount).toMatch(/scheduleAfterLcpOrIdle/);
		expect(mount).toMatch(/largest-contentful-paint/);
		expect(mount).not.toMatch(/Promise\.all/);
		expect(mount).toMatch(/home-motion-ready/);
		const scroll = readSrc("scripts/home/scroll.ts");
		expect(scroll).not.toMatch(/home-motion-ready/);
	});

	it("skips motion when reduced motion is preferred", () => {
		const mount = readSrc("scripts/home/mount.ts");
		expect(mount).toMatch(/prefersReducedMotion\(\)/);
		const scroll = readSrc("scripts/home/scroll.ts");
		expect(scroll).toMatch(/prefersReducedMotion\(\)/);
		const hero = readSrc("components/landing/HomeHero.astro");
		expect(hero).toMatch(/prefers-reduced-motion: reduce/);
		const paper = readSrc("scripts/hero-paper-shader.ts");
		expect(paper).toMatch(/prefersReducedMotion\(\)/);
	});

	it("animates with transform and opacity only in scroll.ts", () => {
		const scroll = readSrc("scripts/home/scroll.ts");
		expect(scroll).toMatch(/\by:\s*-/);
		expect(scroll).toMatch(/\bopacity:/);
		expect(scroll).not.toMatch(/\bheight:\s*["']/);
		expect(scroll).not.toMatch(/\btop:\s*["']/);
		expect(scroll).not.toMatch(/fontSize/);
	});

	it("exposes a decorative hero shader mount with aria-hidden", () => {
		const hero = readSrc("components/landing/HomeHero.astro");
		expect(hero).toMatch(/data-hero-shader/);
		expect(hero).toMatch(/aria-hidden="true"/);
		expect(hero).toMatch(/data-paper-shader/);
		expect(hero).toMatch(/paper-shader\.css/);
	});

	it("mounts Paper MeshGradient from deferred bloom module", () => {
		const bloom = readSrc("scripts/home/bloom.ts");
		expect(bloom).toMatch(/hero-paper-shader/);
		expect(bloom).toMatch(/data-hero-shader/);
	});

	it("keeps the hero shader static so Speed Index converges", () => {
		const paper = readSrc("scripts/hero-paper-shader.ts");
		expect(paper).toMatch(/const HERO_SHADER_SPEED = 0;/);
		expect(paper).toMatch(/new ShaderMount\([\s\S]*?HERO_SHADER_SPEED,/);
	});
});
