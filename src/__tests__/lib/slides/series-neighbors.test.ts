import { describe, expect, it } from "vitest";

import { getSeriesNeighbors } from "@/lib/slides/series-neighbors";
import { loadDecks } from "@/slides/load-decks";

describe("getSeriesNeighbors", () => {
	it("returns prev/next for middle deck in Snowflake series", async () => {
		const decks = await loadDecks();
		const neighbors = getSeriesNeighbors("snowflake-dbt", decks);

		expect(neighbors.prev).toEqual({
			slug: "snowflake-clickops-limits",
			title: "SnowflakeとClickOpsの限界",
		});
		expect(neighbors.next).toEqual({
			slug: "snowflake-observability",
			title: "Snowflake で何が起きているのかを把握する",
		});
	});

	it("returns only next for first deck in series", async () => {
		const decks = await loadDecks();
		const neighbors = getSeriesNeighbors("snowflake-clickops-limits", decks);

		expect(neighbors.prev).toBeUndefined();
		expect(neighbors.next?.slug).toBe("snowflake-dbt");
	});

	it("returns only prev for last deck in series", async () => {
		const decks = await loadDecks();
		const neighbors = getSeriesNeighbors("snowflake-observability", decks);

		expect(neighbors.prev?.slug).toBe("snowflake-dbt");
		expect(neighbors.next).toBeUndefined();
	});

	it("returns empty for ungrouped deck", async () => {
		const decks = await loadDecks();
		expect(getSeriesNeighbors("showcase", decks)).toEqual({});
	});

	it("skips missing slugs when resolving neighbors", () => {
		const decks = [
			{
				frontmatter: {
					slug: "a",
					title: "A",
				},
			},
			{
				frontmatter: {
					slug: "c",
					title: "C",
				},
			},
		] as unknown as Parameters<typeof getSeriesNeighbors>[1];

		const neighbors = getSeriesNeighbors("c", decks, [
			{
				id: "test-series",
				title: "Test",
				description: "",
				slugs: ["a", "b", "c"],
			},
		]);
		expect(neighbors.prev).toEqual({ slug: "a", title: "A" });
		expect(neighbors.next).toBeUndefined();
	});
});
