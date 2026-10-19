import {
	SLIDE_DECK_GROUPS,
	type SlideDeckGroup,
} from "@/data/slide-deck-groups";
import type { Deck } from "@/slides/parser/types";

export type SlideDeckGroupSection = {
	readonly group: SlideDeckGroup;
	readonly decks: readonly Deck[];
};

export type PartitionedSlideDecks = {
	readonly groups: readonly SlideDeckGroupSection[];
	readonly ungrouped: readonly Deck[];
};

export function partitionDecksForIndex(
	decks: readonly Deck[],
): PartitionedSlideDecks {
	const bySlug = new Map(decks.map((deck) => [deck.frontmatter.slug, deck]));
	const assigned = new Set<string>();

	const groups: SlideDeckGroupSection[] = [];
	for (const group of SLIDE_DECK_GROUPS) {
		const groupDecks: Deck[] = [];
		for (const slug of group.slugs) {
			const deck = bySlug.get(slug);
			if (deck) {
				groupDecks.push(deck);
				assigned.add(slug);
			}
		}
		if (groupDecks.length > 0) {
			groups.push({ group, decks: groupDecks });
		}
	}

	const ungrouped = decks.filter(
		(deck) => !assigned.has(deck.frontmatter.slug),
	);

	return { groups, ungrouped };
}
