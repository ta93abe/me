import { TALKS, type Talk } from "@/data/talks";
import { loadDecks } from "@/slides/load-decks";
import type { DeckFrontmatter } from "@/slides/parser/types";

export type CrosslinkIssue = {
	readonly kind: "talk-slide" | "deck-talk";
	readonly from: string;
	readonly missing: string;
};

export function talkSlugs(): Set<string> {
	return new Set(TALKS.map((talk) => talk.slug));
}

export function talkBySlug(slug: string): Talk | undefined {
	return TALKS.find((talk) => talk.slug === slug);
}

export async function deckSlugs(): Promise<Set<string>> {
	const decks = await loadDecks();
	return new Set(decks.map((deck) => deck.frontmatter.slug));
}

export async function validateTalkSlideCrosslinks(): Promise<CrosslinkIssue[]> {
	const decks = await loadDecks();
	const talks = talkSlugs();
	const slides = new Set(decks.map((deck) => deck.frontmatter.slug));
	const issues: CrosslinkIssue[] = [];

	for (const talk of TALKS) {
		if (talk.slideSlug && !slides.has(talk.slideSlug)) {
			issues.push({
				kind: "talk-slide",
				from: talk.slug,
				missing: talk.slideSlug,
			});
		}
	}

	for (const deck of decks) {
		const talkSlug = deck.frontmatter.talkSlug;
		if (talkSlug && !talks.has(talkSlug)) {
			issues.push({
				kind: "deck-talk",
				from: deck.frontmatter.slug,
				missing: talkSlug,
			});
		}
	}

	return issues;
}

export function deckTalkYoutubeId(
	frontmatter: Pick<DeckFrontmatter, "talkSlug">,
): string | undefined {
	if (!frontmatter.talkSlug) {
		return undefined;
	}
	return talkBySlug(frontmatter.talkSlug)?.youtubeId;
}
