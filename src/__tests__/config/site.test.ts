import { describe, expect, it } from "vitest";

import { FEATURED_WORKS, HOME_CTAS, SITE } from "@/config/site";

describe("SITE intro", () => {
	it("uses the same positioning in the visible tagline and meta description", () => {
		expect(SITE.tagline).toContain(
			"データ基盤と CI を書くソフトウェアエンジニア",
		);
		expect(SITE.tagline).toContain("絵と音楽も置く");
		expect(SITE.description).toContain(
			"データ基盤と CI を書くソフトウェアエンジニア",
		);
		expect(SITE.description).toContain("絵と音楽も置く");
		expect(SITE.description).toContain(SITE.name);
		expect(SITE.description).toContain(SITE.handle);
	});
});

describe("HOME_CTAS", () => {
	it("points to About, Blog, and Contact without Gallery", () => {
		expect(HOME_CTAS.map((cta) => cta.href)).toEqual([
			"/about",
			"/blog",
			"/contact",
		]);
		expect(HOME_CTAS.map((cta) => cta.href)).not.toContain("/gallery");
	});
});

describe("FEATURED_WORKS", () => {
	it("links to GitHub or blog, never retired Gallery paths", () => {
		expect(FEATURED_WORKS.length).toBeGreaterThanOrEqual(2);
		expect(FEATURED_WORKS.length).toBeLessThanOrEqual(3);
		for (const work of FEATURED_WORKS) {
			expect(work.href.startsWith("/gallery")).toBe(false);
			expect(
				work.href.startsWith("https://github.com/") ||
					work.href.startsWith("/blog/"),
			).toBe(true);
		}
	});
});

describe("SITE newsletter", () => {
	it("points subscribe CTA at Substack, not a self-hosted endpoint", () => {
		expect(SITE.substackUrl).toBe("https://ta93abe.substack.com");
		expect(SITE.substackSubscribeUrl).toBe(
			"https://ta93abe.substack.com/subscribe",
		);
		expect(SITE.substackSubscribeUrl.startsWith(SITE.substackUrl)).toBe(true);
	});
});
