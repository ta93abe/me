import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { loadDecks } from "@/slides/load-decks";

import { compileDeck, slideHtml } from "./helpers/compile-deck";

const decksDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../slides/decks",
);

async function compileFile(slug: string) {
	const source = await readFile(path.join(decksDir, `${slug}.mdx`), "utf8");
	return compileDeck(source, slug);
}

describe("showcase deck", () => {
	it("covers every slide type", async () => {
		const { html, info } = await compileFile("showcase");
		expect(info.slides.map((slide) => slide.type)).toEqual([
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
			"body",
			"end",
		]);
		expect(info.slides.map((slide) => slide.clicks)).toEqual([
			0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 1, 0, 0, 0,
		]);
		const code = slideHtml(html, 6);
		expect(code).toContain("shiki");
		expect(code).toContain("min-dark");
		expect(code).not.toMatch(/<(?:pre|span)[^>]*\sstyle=/i);
		expect(code).toContain("line-highlighted");
		expect(slideHtml(html, 7)).toContain("/slides/media/showcase/frame.svg");
		expect(slideHtml(html, 12)).toContain("katex");
		expect(slideHtml(html, 13)).toContain(
			'<x-tweet id="2098270535855870306" scale="0.7"></x-tweet>',
		);
	});
});

describe("light deck", () => {
	it("uses the light highlighter", async () => {
		const { html, info } = await compileFile("light");
		expect(info.slides.map((slide) => slide.type)).toEqual([
			"cover",
			"body",
			"code",
		]);
		expect(slideHtml(html, 3)).toContain("min-light");
	});
});

describe("real decks", () => {
	it("keep one h1 each (the first cover)", async () => {
		for (const deck of await loadDecks()) {
			const { html } = await compileFile(deck.frontmatter.slug);
			expect(html.match(/<h1[\s>]/g)?.length, deck.frontmatter.slug).toBe(1);
		}
	});

	it("emit no bare /slides/<slug> hrefs", async () => {
		for (const deck of await loadDecks()) {
			const { html } = await compileFile(deck.frontmatter.slug);
			expect(html, deck.frontmatter.slug).not.toMatch(
				/href="\/slides\/[a-z0-9-]+"/,
			);
		}
	});
});

describe("loadDecks", () => {
	it("lists git decks newest first", async () => {
		const decks = await loadDecks();
		expect(decks.map((deck) => deck.frontmatter.slug)).toEqual([
			"snowflake-observability",
			"snowflake-dbt",
			"snowflake-clickops-limits",
			"light",
			"showcase",
		]);
		const light = decks.find((deck) => deck.frontmatter.slug === "light");
		expect(light?.frontmatter.theme).toBe("light");
		expect(light?.frontmatter.unlisted).toBe(true);
	});
});
