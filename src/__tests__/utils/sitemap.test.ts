import { describe, expect, it } from "vitest";

import { SITEMAP_INDEX_PATH, sitemapIndexLocation } from "@/utils/sitemap";

describe("sitemapIndexLocation", () => {
	it("aliases /sitemap.xml onto the sitemap index", () => {
		expect(sitemapIndexLocation("/sitemap.xml")).toBe(SITEMAP_INDEX_PATH);
		expect(sitemapIndexLocation("/sitemap.xml/")).toBe(SITEMAP_INDEX_PATH);
	});

	it("leaves the real sitemap index and other paths alone", () => {
		expect(sitemapIndexLocation(SITEMAP_INDEX_PATH)).toBeNull();
		expect(sitemapIndexLocation("/sitemap-blog.xml")).toBeNull();
		expect(sitemapIndexLocation("/")).toBeNull();
	});
});
