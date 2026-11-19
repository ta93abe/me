import { describe, expect, it } from "vitest";

import { readWorks } from "../helpers/site-content.ts";

// src/content/works/*.mdx を schema で検証し、order 順に読む。
const works = readWorks();

describe("works collection", () => {
	it("is the single source for three GitHub or blog works, never unpublished collections", () => {
		expect(works.map((work) => work.title)).toEqual([
			"dbt-jobs",
			"dbt-intro",
			"enbu",
		]);
		for (const work of works) {
			expect(work.href.startsWith("/gallery")).toBe(false);
			expect(work.href.startsWith("/atelier")).toBe(false);
			expect(work.href.startsWith("/bookshelf")).toBe(false);
			expect(work.href.startsWith("/works")).toBe(false);
			expect(
				work.href.startsWith("https://github.com/") ||
					work.href.startsWith("/blog/"),
			).toBe(true);
		}
	});
});
