import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { loadDecks } from "@/slides/load-decks";
import { parseDeck } from "@/slides/parser/parse-deck";

const decksDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../slides/decks",
);

describe("showcase deck", () => {
	it("covers every slide type", async () => {
		const filename = path.join(decksDir, "showcase.md");
		const markdown = await readFile(filename, "utf8");
		const deck = await parseDeck(markdown, { filename });
		expect(deck.slides.map((slide) => slide.type)).toEqual([
			"cover",
			"section",
			"body",
			"split",
			"quote",
			"code",
			"figure",
			"center",
			"body",
			"body",
			"code",
			"body",
			"end",
		]);
		expect(deck.frontmatter.theme).toBe("dark");
		expect(deck.slides[5]?.html).toContain("shiki");
		expect(deck.slides[5]?.html).toContain("min-dark");
		expect(deck.slides[5]?.html).not.toMatch(/\sstyle=/i);
		expect(deck.slides[5]?.html).toContain("line-highlighted");
		expect(deck.slides[6]?.html).toContain("/slides/media/showcase/frame.svg");
		expect(deck.slides[8]?.clicks).toBe(1);
		expect(deck.slides[9]?.clicks).toBe(3);
		expect(deck.slides[10]?.clicks).toBe(1);
		expect(deck.slides[11]?.html).toContain("katex");
	});
});

describe("light deck", () => {
	it("uses the light palette and highlighter", async () => {
		const filename = path.join(decksDir, "light.md");
		const markdown = await readFile(filename, "utf8");
		const deck = await parseDeck(markdown, { filename });
		expect(deck.frontmatter.theme).toBe("light");
		expect(deck.slides.map((slide) => slide.type)).toEqual([
			"cover",
			"body",
			"code",
		]);
		expect(deck.slides[2]?.html).toContain("min-light");
		expect(deck.slides[2]?.html).not.toMatch(/\sstyle=/i);
	});
});

describe("loadDecks", () => {
	it("lists git decks newest first", async () => {
		const decks = await loadDecks();
		expect(decks.map((deck) => deck.frontmatter.slug)).toEqual([
			"light",
			"showcase",
		]);
	});
});
