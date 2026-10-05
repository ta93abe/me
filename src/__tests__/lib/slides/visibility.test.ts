import { describe, expect, it } from "vitest";

import {
	isUnlistedDeck,
	listedDecks,
	slideDeckRobotsContent,
} from "@/lib/slides/visibility";
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

describe("listedDecks", () => {
	it("keeps listed decks and drops unlisted ones", () => {
		const listed = makeDeck("public");
		const hidden = makeDeck("demo", true);

		expect(isUnlistedDeck(listed)).toBe(false);
		expect(isUnlistedDeck(hidden)).toBe(true);
		expect(
			listedDecks([listed, hidden]).map((item) => item.frontmatter.slug),
		).toEqual(["public"]);
	});
});

describe("slideDeckRobotsContent", () => {
	it("uses noindex, follow for unlisted players", () => {
		expect(slideDeckRobotsContent({ unlisted: true })).toBe("noindex, follow");
	});

	it("keeps print stronger than unlisted", () => {
		expect(slideDeckRobotsContent({ print: true, unlisted: true })).toBe(
			"noindex, nofollow",
		);
	});

	it("indexes listed players", () => {
		expect(slideDeckRobotsContent({})).toBe("index, follow");
	});
});
