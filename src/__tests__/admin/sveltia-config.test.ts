import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const configPath = resolve(process.cwd(), "public/admin/config.yml");
const config = readFileSync(configPath, "utf8");

/**
 * Extract a top-level folder collection block from Sveltia config.yml.
 * Collections are list items indented with two spaces under `collections:`.
 */
const getCollectionBlock = (source: string, name: string): string => {
	const start = source.search(new RegExp(`^  - name: ${name}$`, "m"));
	if (start === -1) {
		throw new Error(`collection "${name}" not found`);
	}
	const rest = source.slice(start);
	const next = rest.slice(2).search(/^  - name: /m);
	return next === -1 ? rest : rest.slice(0, next + 2);
};

const fieldNames = (block: string): string[] => {
	const fieldsStart = block.indexOf("\n    fields:");
	if (fieldsStart === -1) {
		throw new Error("fields: not found in collection");
	}
	const fields = block.slice(fieldsStart);
	return [
		...fields.matchAll(/^\s+- (?:\{ name: |name: )([A-Za-z0-9_]+)/gm),
	].map((match) => match[1]);
};

describe("Sveltia CMS books collection", () => {
	it("defines a books folder collection matching content.config.ts", () => {
		const books = getCollectionBlock(config, "books");

		expect(books).toContain("folder: src/content/books");
		expect(books).toContain("extension: md");
		expect(fieldNames(books)).toEqual([
			"title",
			"author",
			"coverImage",
			"status",
			"finishedDate",
			"rating",
			"category",
			"excerpt",
			"body",
		]);
	});

	it("stores cover images in Git via image(), same as gallery / atelier", () => {
		const books = getCollectionBlock(config, "books");

		expect(books).toContain("media_folder: /src/assets/books");
		expect(books).toContain("public_folder: ../../assets/books");
		expect(books).toMatch(/name: coverImage[\s\S]*cloudflare_r2: false/);
		expect(books).toMatch(/widget: select[\s\S]*value: read/);
		expect(books).toMatch(/widget: select[\s\S]*value: reading/);
		expect(books).toMatch(/widget: select[\s\S]*value: stacked/);
		expect(books).toMatch(/name: rating[\s\S]*widget: number[\s\S]*min: 1/);
		expect(books).toMatch(/name: rating[\s\S]*max: 5/);
	});
});
