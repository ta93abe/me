import {
	SLIDE_DECK_GROUPS,
	type SlideDeckGroup,
} from "@/data/slide-deck-groups";
import type { Deck } from "@/slides/parser/types";

export type SeriesDeckLink = {
	readonly slug: string;
	readonly title: string;
};

export type SeriesNeighbors = {
	readonly prev?: SeriesDeckLink;
	readonly next?: SeriesDeckLink;
};

/**
 * 同一 `SLIDE_DECK_GROUPS` 系列内の前後デッキ（存在する slug のみ、宣言順）。
 * どのグループにも属さない slug は `{}`。
 */
export function getSeriesNeighbors(
	currentSlug: string,
	decks: readonly Deck[],
	groups: readonly SlideDeckGroup[] = SLIDE_DECK_GROUPS,
): SeriesNeighbors {
	const bySlug = new Map(decks.map((deck) => [deck.frontmatter.slug, deck]));

	for (const group of groups) {
		if (!group.slugs.includes(currentSlug)) {
			continue;
		}

		const ordered = group.slugs
			.map((seriesSlug) => bySlug.get(seriesSlug))
			.filter((deck): deck is Deck => deck !== undefined);

		const index = ordered.findIndex(
			(deck) => deck.frontmatter.slug === currentSlug,
		);
		if (index === -1) {
			return {};
		}

		const prevDeck = index > 0 ? ordered[index - 1] : undefined;
		const nextDeck =
			index < ordered.length - 1 ? ordered[index + 1] : undefined;

		return {
			...(prevDeck
				? {
						prev: {
							slug: prevDeck.frontmatter.slug,
							title: prevDeck.frontmatter.title,
						},
					}
				: {}),
			...(nextDeck
				? {
						next: {
							slug: nextDeck.frontmatter.slug,
							title: nextDeck.frontmatter.title,
						},
					}
				: {}),
		};
	}

	return {};
}
