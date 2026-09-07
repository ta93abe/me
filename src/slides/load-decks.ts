import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseDeck } from "./parser/parse-deck.ts";
import type { Deck } from "./parser/types.ts";

const decksDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"decks",
);

export function decksDirectory(): string {
	return decksDir;
}

export async function loadDecks(): Promise<Deck[]> {
	const names = (await readdir(decksDir))
		.filter((name) => name.endsWith(".md"))
		.toSorted();
	const decks: Deck[] = [];
	for (const name of names) {
		const filename = path.join(decksDir, name);
		const markdown = await readFile(filename, "utf8");
		decks.push(await parseDeck(markdown, { filename }));
	}

	return decks.toSorted(
		(a, b) =>
			b.frontmatter.date.localeCompare(a.frontmatter.date) ||
			a.frontmatter.slug.localeCompare(b.frontmatter.slug),
	);
}
