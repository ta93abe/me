import { describe, expect, it } from "vitest";

import { SLIDE_DECK_GROUPS } from "@/data/slide-deck-groups";
import { partitionDecksForIndex } from "@/lib/slides/partition-decks";
import { listedDecks } from "@/lib/slides/visibility";
import { loadDecks } from "@/slides/load-decks";
import type { Deck } from "@/slides/parser/types";

function makeDeck(slug: string, unlisted?: boolean): Deck {
	return {
		frontmatter: {
			title: slug,
			date: "2026-09-06",
			description: slug,
			slug,
			theme: "dark",
			...(unlisted ? { unlisted: true } : {}),
		},
		slides: [],
	};
}

describe("partitionDecksForIndex", () => {
	it("groups Snowflake trilogy in series order", async () => {
		const decks = listedDecks(await loadDecks());
		const { groups, ungrouped } = partitionDecksForIndex(decks);

		expect(groups).toHaveLength(1);
		expect(groups[0]?.group.id).toBe("snowflake-ops");
		expect(groups[0]?.decks.map((item) => item.frontmatter.slug)).toEqual([
			"snowflake-clickops-limits",
			"snowflake-dbt",
			"snowflake-observability",
		]);

		expect(ungrouped.map((item) => item.frontmatter.slug)).toEqual([]);
	});

	it("omits unlisted decks from groups and leftover cards", () => {
		const { groups, ungrouped } = partitionDecksForIndex([
			makeDeck("snowflake-clickops-limits", true),
			makeDeck("snowflake-dbt"),
			makeDeck("showcase", true),
			makeDeck("listed-extra"),
		]);

		expect(groups).toHaveLength(1);
		expect(groups[0]?.decks.map((item) => item.frontmatter.slug)).toEqual([
			"snowflake-dbt",
		]);
		expect(ungrouped.map((item) => item.frontmatter.slug)).toEqual([
			"listed-extra",
		]);
	});

	it("declares only slugs that exist in git decks", async () => {
		const decks = await loadDecks();
		const slugs = new Set(decks.map((deck) => deck.frontmatter.slug));
		for (const group of SLIDE_DECK_GROUPS) {
			for (const slug of group.slugs) {
				expect(slugs.has(slug), `missing deck for group slug ${slug}`).toBe(
					true,
				);
			}
		}
	});
});
