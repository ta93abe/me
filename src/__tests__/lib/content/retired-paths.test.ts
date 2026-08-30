import { describe, expect, it } from "vitest";

import { isRetiredSitePath } from "@/lib/content/retired-paths";

describe("isRetiredSitePath", () => {
	it("matches retired collection indexes and slugs", () => {
		expect(isRetiredSitePath("/gallery")).toBe(true);
		expect(isRetiredSitePath("/gallery/")).toBe(true);
		expect(isRetiredSitePath("/gallery/dbt-jobs")).toBe(true);
		expect(isRetiredSitePath("/atelier")).toBe(true);
		expect(isRetiredSitePath("/bookshelf/some-book")).toBe(true);
		expect(isRetiredSitePath("/works")).toBe(true);
		expect(isRetiredSitePath("/works/dbt-jobs")).toBe(true);
	});

	it("leaves live pages alone", () => {
		expect(isRetiredSitePath("/")).toBe(false);
		expect(isRetiredSitePath("/blog")).toBe(false);
		expect(isRetiredSitePath("/blog/dbt-jobs-composite-action")).toBe(false);
		expect(isRetiredSitePath("/links")).toBe(false);
		expect(isRetiredSitePath("/tools")).toBe(false);
		expect(isRetiredSitePath("/slides")).toBe(false);
	});
});
