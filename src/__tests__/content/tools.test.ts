import { describe, expect, it } from "vitest";

import { readPageCopy, readToolCategories } from "../helpers/site-content.ts";

// src/content/tools/*.mdx と src/content/pages/tools.mdx を schema で検証して読む。
const categories = readToolCategories();
const copy = readPageCopy("tools");

describe("tools collection", () => {
	it("keeps the four categories in page order", () => {
		expect(categories.map((category) => category.id)).toEqual([
			"shell",
			"editor",
			"cli",
			"packages",
		]);
		expect(categories.map((category) => category.title)).toEqual([
			"シェル・ターミナル",
			"エディタ",
			"毎日の CLI",
			"パッケージ",
		]);
	});

	it("lists every tool once with an https URL", () => {
		const names = categories.flatMap((category) =>
			category.tools.map((tool) => tool.name),
		);
		expect(new Set(names).size).toBe(names.length);
		expect(names).toEqual(expect.arrayContaining(["Nix", "Fish", "Cursor"]));
		for (const category of categories) {
			for (const tool of category.tools) {
				expect(tool.url.startsWith("https://"), tool.name).toBe(true);
			}
		}
	});

	it("leads with Nix and links the dotfiles repository", () => {
		expect(copy.lead).toContain("Nix + Home Manager");
		expect(copy.cta?.href).toBe("https://github.com/ta93abe/dotfiles");
		expect(copy.pointsTitle).toBe("なぜ Nix か");
		expect(copy.points?.length).toBe(4);
	});
});

describe("pages collection", () => {
	it("keeps the about closing line", () => {
		expect(readPageCopy("about").closing).toBe("連絡は Contact からどうぞ。");
	});
});
