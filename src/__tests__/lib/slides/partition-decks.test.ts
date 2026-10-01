import { describe, expect, it } from "vitest";

import { SLIDE_DECK_GROUPS } from "@/data/slide-deck-groups";
import { partitionDecksForIndex } from "@/lib/slides/partition-decks";
import { loadDecks } from "@/slides/load-decks";

describe("partitionDecksForIndex", () => {
	it("groups Snowflake trilogy in series order", async () => {
		const decks = await loadDecks();
		const { groups, ungrouped } = partitionDecksForIndex(decks);

		expect(groups).toHaveLength(1);
		expect(groups[0]?.group.id).toBe("snowflake-ops");
		expect(groups[0]?.decks.map((deck) => deck.frontmatter.slug)).toEqual([
			"snowflake-clickops-limits",
			"snowflake-dbt",
			"snowflake-observability",
		]);

		expect(ungrouped.map((deck) => deck.frontmatter.slug)).toEqual([
			"light",
			"showcase",
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
