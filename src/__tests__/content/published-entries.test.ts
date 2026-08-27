import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const CONTENT_ROOT = join(process.cwd(), "src/content");

const SAMPLE_TITLE_PATTERN = /サンプル|テスト投稿|最初のブログ投稿/;

function listEntries(collection: string): string[] {
	return readdirSync(join(CONTENT_ROOT, collection)).filter((name) =>
		/\.(md|mdx)$/.test(name),
	);
}

function frontmatter(collection: string, file: string): string {
	const text = readFileSync(join(CONTENT_ROOT, collection, file), "utf8");
	const match = text.match(/^---\n([\s\S]*?)\n---/);
	return match?.[1] ?? "";
}

function coverImages(collection: string): string[] {
	return listEntries(collection)
		.map((file) => {
			const match = frontmatter(collection, file).match(
				/^coverImage:\s*"?([^"\n]+)"?/m,
			);
			return match?.[1]?.trim();
		})
		.filter((value): value is string => Boolean(value));
}

describe("published content", () => {
	it("has a real blog post and no sample posts", () => {
		const files = listEntries("blog");

		expect(files).not.toContain("first-post.md");
		expect(files).not.toContain("test-post.md");
		expect(files.length).toBeGreaterThan(0);

		for (const file of files) {
			expect(frontmatter("blog", file)).not.toMatch(SAMPLE_TITLE_PATTERN);
		}
	});

	it("has no sample books", () => {
		expect(listEntries("books")).toEqual([]);
	});

	it("keeps only gallery pieces with unique covers", () => {
		const files = listEntries("gallery");
		const covers = coverImages("gallery");

		expect(files).toContain("dbt-jobs.mdx");
		expect(files).not.toEqual(
			expect.arrayContaining([
				"quiet-frame.md",
				"evening-grain.md",
				"after-rain.md",
				"thin-chord.md",
			]),
		);
		expect(covers.length).toBe(files.length);
		expect(new Set(covers).size).toBe(covers.length);
		expect(covers.some((cover) => cover.includes("dbt-jobs"))).toBe(true);
	});

	it("does not publish placeholder atelier pieces", () => {
		expect(listEntries("atelier")).toEqual([]);
	});
});
