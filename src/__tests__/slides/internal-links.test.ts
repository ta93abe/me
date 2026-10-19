import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseDeck } from "@/slides/parser/parse-deck";

const decksDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../slides/decks",
);

const BARE_SLIDE_HREF = /href="\/slides\/[^"/.]+"/g;

describe("slide deck internal links", () => {
	it("emits no bare /slides/<slug> hrefs", async () => {
		const files = (await readdir(decksDir)).filter((name) =>
			name.endsWith(".md"),
		);
		expect(files.length).toBeGreaterThan(0);

		for (const name of files) {
			const filename = path.join(decksDir, name);
			const markdown = await readFile(filename, "utf8");
			const deck = await parseDeck(markdown, { filename });
			const html = deck.slides.map((slide) => slide.html).join("\n");
			expect(html.match(BARE_SLIDE_HREF) ?? [], name).toEqual([]);
		}
	});
});
