import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
	SITEMAP_INDEX_ALIASES,
	SITEMAP_INDEX_PATH,
	isSitemapIndexAlias,
	isSitemapIndexDocument,
} from "@/lib/content/sitemap-aliases";

const robotsTxt = readFileSync(
	path.join(process.cwd(), "public/robots.txt"),
	"utf8",
);

describe("isSitemapIndexAlias", () => {
	it("matches conventional sitemap index URLs", () => {
		expect(isSitemapIndexAlias("/sitemap.xml")).toBe(true);
		expect(isSitemapIndexAlias("/sitemap.xml/")).toBe(true);
		expect(isSitemapIndexAlias("/sitemap_index.xml")).toBe(true);
		expect(isSitemapIndexAlias("/sitemap_index.xml/")).toBe(true);
	});

	it("leaves the canonical index and child sitemaps alone", () => {
		expect(isSitemapIndexAlias(SITEMAP_INDEX_PATH)).toBe(false);
		expect(isSitemapIndexAlias("/sitemap-0.xml")).toBe(false);
		expect(isSitemapIndexAlias("/sitemap-blog.xml")).toBe(false);
		expect(isSitemapIndexAlias("/robots.txt")).toBe(false);
		expect(isSitemapIndexAlias("/")).toBe(false);
	});

	it("keeps aliases distinct from the canonical index path", () => {
		expect(SITEMAP_INDEX_ALIASES).not.toContain(SITEMAP_INDEX_PATH);
	});
});

describe("isSitemapIndexDocument", () => {
	it("serves Search Console and alias URLs as the sitemap index", () => {
		expect(isSitemapIndexDocument("/sitemap.xml")).toBe(true);
		expect(isSitemapIndexDocument("/sitemap.xml/")).toBe(true);
		expect(isSitemapIndexDocument("/sitemap_index.xml")).toBe(true);
		expect(isSitemapIndexDocument("/sitemap-index.xml")).toBe(true);
		expect(isSitemapIndexDocument("/sitemap-index.xml/")).toBe(true);
	});

	it("does not treat child sitemaps as the index document", () => {
		expect(isSitemapIndexDocument("/sitemap-0.xml")).toBe(false);
		expect(isSitemapIndexDocument("/sitemap-blog.xml")).toBe(false);
		expect(isSitemapIndexDocument("/robots.txt")).toBe(false);
	});
});

describe("robots.txt sitemap advertisement", () => {
	it("points Search Console at /sitemap.xml instead of a redirecting alias", () => {
		expect(robotsTxt).toMatch(
			/^Sitemap: https:\/\/ta93abe.com\/sitemap\.xml$/m,
		);
		expect(robotsTxt).not.toMatch(/Sitemap:.*sitemap-index\.xml/);
	});
});
