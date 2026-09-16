import { describe, expect, it } from "vitest";

import {
	SITEMAP_INDEX_ALIASES,
	SITEMAP_INDEX_PATH,
	isSitemapIndexAlias,
} from "@/lib/content/sitemap-aliases";

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
