import { describe, expect, it } from "vitest";

import { HOME_CTAS, SITE } from "@/config/site";

describe("SITE intro", () => {
	it("exposes a trailing-slash About path as the author canonical", () => {
		expect(SITE.author).toBe("Takumi Abe");
		expect(SITE.authorPath).toBe("/about/");
	});

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
	it("points to Works, About, Blog, and Contact without unpublished collections", () => {
		expect(HOME_CTAS.map((cta) => cta.href)).toEqual([
			"/works/",
			"/about/",
			"/blog/",
			"/contact/",
		]);
		expect(HOME_CTAS.map((cta) => cta.href)).not.toContain("/gallery");
		expect(HOME_CTAS.map((cta) => cta.href)).not.toContain("/atelier");
		expect(HOME_CTAS.map((cta) => cta.href)).not.toContain("/bookshelf");
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

describe("SITE slides", () => {
	it("does not keep an external slides host", () => {
		expect("slidesUrl" in SITE).toBe(false);
	});
});
