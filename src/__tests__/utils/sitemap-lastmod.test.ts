import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
	applyStaticSitemapLastmod,
	createStaticSitemapSerializer,
	includeInStaticSitemap,
	toW3cLastmod,
	type SitemapLastmodItem,
} from "@/utils/sitemap-lastmod";

import { buildBlogSitemapXml } from "../../../worker/content/derived.ts";

const W3C_DATETIME =
	/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

const STATIC_SITEMAP_URLS = [
	"https://ta93abe.com/",
	"https://ta93abe.com/about/",
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
	"https://ta93abe.com/talks/",
	"https://ta93abe.com/slides/",
	"https://ta93abe.com/slides/light/",
	"https://ta93abe.com/slides/showcase/",
	"https://ta93abe.com/tools/",
	"https://ta93abe.com/works/",
] as const;

const BUILD_TIME = "2099-01-01T00:00:00.000Z";

function sitemapLocs(xml: string): string[] {
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
		(match) => match[1] ?? "",
	);
}

function writeFixture(rootDir: string, relativePath: string, contents: string) {
	const filePath = path.join(rootDir, relativePath);
	mkdirSync(path.dirname(filePath), { recursive: true });
	writeFileSync(filePath, contents);
}

function fixtureRoot(): string {
	const rootDir = mkdtempSync(path.join(tmpdir(), "sitemap-lastmod-"));
	writeFixture(
		rootDir,
		"src/data/talks.ts",
		`export const TALKS = [
	{
		slug: "newer",
		date: "2026-08-27",
	},
	{
		slug: "older",
		date: "2026-05-14",
	},
];
`,
	);
	writeFixture(rootDir, "src/data/gadgets.ts", "export const GADGETS = [];\n");
	writeFixture(
		rootDir,
		"src/slides/decks/demo.md",
		`---
slug: demo
date: 2026-03-02
updated: 2026-04-08
---
`,
	);
	writeFixture(rootDir, "src/pages/index.astro", "<h1>home</h1>\n");
	return rootDir;
}

describe("includeInStaticSitemap", () => {
	it("keeps the current static sitemap URLs", () => {
		for (const url of STATIC_SITEMAP_URLS) {
			expect(includeInStaticSitemap(url), url).toBe(true);
		}
	});

	it("leaves /blog/ and post URLs to sitemap-blog", () => {
		expect(includeInStaticSitemap("https://ta93abe.com/blog/")).toBe(false);
		expect(includeInStaticSitemap("https://ta93abe.com/blog")).toBe(false);
		expect(
			includeInStaticSitemap("https://ta93abe.com/blog/hello-world/"),
		).toBe(false);
	});

	it("still drops print and OG routes", () => {
		expect(
			includeInStaticSitemap("https://ta93abe.com/slides/showcase/print/"),
		).toBe(false);
		expect(
			includeInStaticSitemap("https://ta93abe.com/og/blog/hello-world.png"),
		).toBe(false);
	});

	it("has no overlap with the blog sitemap", () => {
		const blogLocs = new Set(
			sitemapLocs(
				buildBlogSitemapXml(
					[
						{
							slug: "hello-world",
							title: "Hello",
							excerpt: "from r2",
							publish_date: new Date("2026-08-30T00:00:00.000Z"),
						},
					],
					"https://ta93abe.com",
				),
			),
		);

		expect(blogLocs.has("https://ta93abe.com/blog/")).toBe(true);
		expect(STATIC_SITEMAP_URLS.filter((url) => blogLocs.has(url))).toEqual([]);
	});
});

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
			{
				url: "https://ta93abe.com/about/",
				changefreq: "monthly",
			} as SitemapLastmodItem & { changefreq: string },
			new Map([["/about/", "2026-04-01T00:00:00.000Z"]]),
		);

		expect(item.lastmod).toBe("2026-04-01T00:00:00.000Z");
		expect(
			(item as SitemapLastmodItem & { changefreq: string }).changefreq,
		).toBe("monthly");
	});

	it("omits lastmod when the path has no content date", () => {
		const item = applyStaticSitemapLastmod(
			{
				url: "https://ta93abe.com/unknown/",
				lastmod: BUILD_TIME,
			},
			new Map(),
		);

		expect(item.lastmod).toBeUndefined();
	});
});

describe("createStaticSitemapSerializer", () => {
	it("stamps known static URLs with a content lastmod, not a build time", () => {
		const serialize = createStaticSitemapSerializer({
			rootDir: process.cwd(),
		});

		const lastmods = STATIC_SITEMAP_URLS.map((url) => {
			const item = serialize({ url, lastmod: BUILD_TIME });
			if (item.lastmod) {
				expect(item.lastmod, url).toMatch(W3C_DATETIME);
				expect(Number.isNaN(new Date(item.lastmod).getTime()), url).toBe(false);
				expect(new Date(item.lastmod).getTime(), url).toBeLessThan(
					new Date(BUILD_TIME).getTime(),
				);
			}
			return item.lastmod;
		});

		const unique = new Set(lastmods.filter((value) => value !== undefined));
		expect(unique.size).toBeGreaterThan(1);
		expect(unique.has(BUILD_TIME)).toBe(false);
	});

	it("omits lastmod for /blog/ instead of using the build timestamp", () => {
		const serialize = createStaticSitemapSerializer({
			rootDir: process.cwd(),
		});
		const item = serialize({
			url: "https://ta93abe.com/blog/",
			lastmod: BUILD_TIME,
		});

		expect(item.lastmod).toBeUndefined();
	});

	it("prefers gadget source dates over the build timestamp", () => {
		const serialize = createStaticSitemapSerializer({
			rootDir: process.cwd(),
		});
		const item = serialize({
			url: "https://ta93abe.com/gadgets/mac-studio/",
			lastmod: BUILD_TIME,
		});

		expect(item.lastmod).toMatch(W3C_DATETIME);
		expect(new Date(item.lastmod ?? "").getTime()).toBeLessThan(
			new Date(BUILD_TIME).getTime(),
		);
	});

	it("uses slide frontmatter dates for deck URLs", () => {
		const serialize = createStaticSitemapSerializer({
			rootDir: process.cwd(),
		});
		const item = serialize({
			url: "https://ta93abe.com/slides/showcase/",
			lastmod: BUILD_TIME,
		});

		expect(item.lastmod).toBe("2026-09-06T00:00:00.000Z");
	});

	it("uses talk and slide content dates when git history is missing", () => {
		const serialize = createStaticSitemapSerializer({
			rootDir: fixtureRoot(),
		});

		expect(
			serialize({
				url: "https://ta93abe.com/talks/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBe("2026-08-27T00:00:00.000Z");
		expect(
			serialize({
				url: "https://ta93abe.com/slides/demo/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBe("2026-04-08T00:00:00.000Z");
		expect(
			serialize({
				url: "https://ta93abe.com/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBeUndefined();
		expect(
			serialize({
				url: "https://ta93abe.com/gadgets/mac-studio/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBeUndefined();
		expect(
			serialize({
				url: "https://ta93abe.com/blog/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBeUndefined();
	});
});
