import { describe, expect, it } from "vitest";

import {
	applyStaticSitemapLastmod,
	createStaticSitemapSerializer,
	toW3cLastmod,
} from "@/utils/sitemap-lastmod";

const W3C_DATETIME =
	/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

const STATIC_SITEMAP_URLS = [
	"https://ta93abe.com/",
	"https://ta93abe.com/about/",
	"https://ta93abe.com/blog/",
	"https://ta93abe.com/contact/",
	"https://ta93abe.com/gadgets/",
	"https://ta93abe.com/gadgets/eufy-omni-e25/",
	"https://ta93abe.com/gadgets/evering/",
	"https://ta93abe.com/gadgets/hhkb-type-s/",
	"https://ta93abe.com/gadgets/holo-orb-l-x-pac/",
	"https://ta93abe.com/gadgets/mac-studio/",
	"https://ta93abe.com/gadgets/milestone-ms-i1/",
	"https://ta93abe.com/gadgets/nature-remo-lapis/",
	"https://ta93abe.com/gadgets/nike-acg-zegama/",
	"https://ta93abe.com/gadgets/novation-launchkey-49/",
	"https://ta93abe.com/gadgets/novation-launchpad-pro/",
	"https://ta93abe.com/gadgets/oura-ring-5/",
	"https://ta93abe.com/gadgets/pebble-index-01/",
	"https://ta93abe.com/gadgets/philips-hue/",
	"https://ta93abe.com/gadgets/shure-sm7b/",
	"https://ta93abe.com/gadgets/sony-mdr-7506/",
	"https://ta93abe.com/gadgets/volt-276/",
	"https://ta93abe.com/links/",
	"https://ta93abe.com/slides/",
	"https://ta93abe.com/slides/light/",
	"https://ta93abe.com/slides/showcase/",
	"https://ta93abe.com/tools/",
	"https://ta93abe.com/works/",
] as const;

describe("toW3cLastmod", () => {
	it("formats Date values as W3C Datetime", () => {
		expect(toW3cLastmod(new Date("2026-09-16T15:00:00.000Z"))).toBe(
			"2026-09-16T15:00:00.000Z",
		);
	});

	it("formats date-only strings as UTC midnight", () => {
		expect(toW3cLastmod("2026-09-06")).toBe("2026-09-06T00:00:00.000Z");
	});
});

describe("applyStaticSitemapLastmod", () => {
	it("uses a path-specific lastmod when present", () => {
		const item = applyStaticSitemapLastmod(
			{ url: "https://ta93abe.com/about/" },
			new Map([["/about/", "2026-04-01T00:00:00.000Z"]]),
			"2026-09-16T15:00:00.000Z",
		);

		expect(item.lastmod).toBe("2026-04-01T00:00:00.000Z");
	});

	it("falls back to the build time when the path is unknown", () => {
		const item = applyStaticSitemapLastmod(
			{ url: "https://ta93abe.com/unknown/" },
			new Map(),
			"2026-09-16T15:00:00.000Z",
		);

		expect(item.lastmod).toBe("2026-09-16T15:00:00.000Z");
	});
});

describe("createStaticSitemapSerializer", () => {
	it("stamps every current static sitemap URL with a W3C lastmod", () => {
		const serialize = createStaticSitemapSerializer({
			now: new Date("2026-09-16T15:00:00.000Z"),
			rootDir: process.cwd(),
		});

		for (const url of STATIC_SITEMAP_URLS) {
			const item = serialize({ url });
			expect(item.lastmod, url).toMatch(W3C_DATETIME);
			expect(Number.isNaN(new Date(item.lastmod).getTime()), url).toBe(false);
		}
	});

	it("prefers gadget source dates over the build timestamp", () => {
		const serialize = createStaticSitemapSerializer({
			now: new Date("2099-01-01T00:00:00.000Z"),
			rootDir: process.cwd(),
		});
		const item = serialize({
			url: "https://ta93abe.com/gadgets/mac-studio/",
		});

		expect(item.lastmod).toMatch(W3C_DATETIME);
		expect(new Date(item.lastmod).getTime()).toBeLessThan(
			new Date("2099-01-01T00:00:00.000Z").getTime(),
		);
	});

	it("uses slide frontmatter dates for deck URLs", () => {
		const serialize = createStaticSitemapSerializer({
			now: new Date("2099-01-01T00:00:00.000Z"),
			rootDir: process.cwd(),
		});
		const item = serialize({
			url: "https://ta93abe.com/slides/showcase/",
		});

		expect(item.lastmod).toBe("2026-09-06T00:00:00.000Z");
	});
});
