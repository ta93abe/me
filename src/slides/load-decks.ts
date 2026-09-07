import { parseDeck } from "./parser/parse-deck.ts";
import type { Deck } from "./parser/types.ts";

/**
 * Cloudflare / workerd 上の `astro dev` では Node の `fs` + `import.meta.url`
 * が実ファイルパスにならない。Vite がビルド時に中身を埋め込む glob を使う。
 */
const deckModules = import.meta.glob("./decks/*.md", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

function filenameFromGlobKey(key: string): string {
	const slash = key.lastIndexOf("/");
	return slash === -1 ? key : key.slice(slash + 1);
}

export async function loadDecks(): Promise<Deck[]> {
	const decks: Deck[] = [];
	for (const [key, markdown] of Object.entries(deckModules)) {
		const filename = filenameFromGlobKey(key);
		if (!filename.endsWith(".md")) {
			continue;
		}
		decks.push(await parseDeck(markdown, { filename }));
	}

	return decks.toSorted(
		(a, b) =>
			b.frontmatter.date.localeCompare(a.frontmatter.date) ||
			a.frontmatter.slug.localeCompare(b.frontmatter.slug),
	);
}
