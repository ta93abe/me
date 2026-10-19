import type { DeckFrontmatter } from "@/slides/parser/types";

export function isUnlistedDeck(deck: {
	frontmatter: Pick<DeckFrontmatter, "unlisted">;
}): boolean {
	return deck.frontmatter.unlisted === true;
}

export function listedDecks<
	T extends { frontmatter: Pick<DeckFrontmatter, "unlisted"> },
>(decks: readonly T[]): T[] {
	return decks.filter((deck) => !isUnlistedDeck(deck));
}

export function slideDeckRobotsContent(options: {
	print?: boolean;
	unlisted?: boolean;
}): string {
	if (options.print) {
		return "noindex, nofollow";
	}
	if (options.unlisted) {
		return "noindex, follow";
	}
	return "index, follow";
}
