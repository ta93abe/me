import { describe, expect, it } from "vitest";

import { HOME_CTAS, SITE } from "@/config/site";

describe("SITE", () => {
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

describe("SITE newsletter", () => {
	it("points subscribe CTA at Substack, not a self-hosted endpoint", () => {
		expect(SITE.substackUrl).toBe("https://ta93abe.substack.com");
		expect(SITE.substackSubscribeUrl).toBe(
			"https://ta93abe.substack.com/subscribe",
		);
		expect(SITE.substackSubscribeUrl.startsWith(SITE.substackUrl)).toBe(true);
	});
});

describe("HOME_CTAS", () => {
	it("points to About, Gallery, and Contact", () => {
		expect(HOME_CTAS.map((cta) => cta.href)).toEqual([
			"/about",
			"/gallery",
			"/contact",
		]);
	});
});
