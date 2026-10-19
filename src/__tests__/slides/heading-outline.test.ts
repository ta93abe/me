import { describe, expect, it } from "vitest";

import {
	headingShiftForSlide,
	remapHeadingTags,
} from "@/slides/parser/heading-outline";
import type { Deck } from "@/slides/parser/types";

const deck = (types: Array<"cover" | "section" | "body">): Deck => ({
	frontmatter: {
		title: "t",
		date: "2026-09-06",
		description: "d",
		slug: "sample",
		theme: "dark",
	},
	slides: types.map((type) => ({
		type,
		html: "<h1>x</h1>",
		notes: "",
		clicks: 0,
	})),
});

describe("heading-outline", () => {
	it("shifts heading tags and keeps the original level as a class", () => {
		expect(remapHeadingTags('<h1 class="x">A</h1><h2>B</h2>', 1)).toBe(
			'<h2 class="slide-h1 x">A</h2><h3 class="slide-h2">B</h3>',
		);
	});

	it("does not shift the first cover, demotes section by 2 and others by 1", () => {
		const withCover = deck(["cover", "section", "body"]);
		expect(headingShiftForSlide(withCover, 0)).toBe(0);
		expect(headingShiftForSlide(withCover, 1)).toBe(2);
		expect(headingShiftForSlide(withCover, 2)).toBe(1);
	});

	it("keeps the first slide as h1 when the deck has no cover", () => {
		const bodyOnly = deck(["body", "body"]);
		expect(headingShiftForSlide(bodyOnly, 0)).toBe(0);
		expect(headingShiftForSlide(bodyOnly, 1)).toBe(1);
	});
});
