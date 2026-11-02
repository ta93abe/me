import { TALKS, type Talk } from "@/data/talks";
import { isUnlistedDeck } from "@/lib/slides/visibility";
import { loadDecks } from "@/slides/load-decks";
import type { DeckFrontmatter } from "@/slides/parser/types";

export type CrosslinkIssue = {
	readonly kind: "talk-slide" | "talk-unlisted-slide" | "deck-talk";
	readonly from: string;
	readonly missing: string;
};

type TalkRef = Pick<Talk, "slug" | "slideSlug">;
type DeckRef = {
	readonly frontmatter: Pick<DeckFrontmatter, "slug" | "talkSlug" | "unlisted">;
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

export function collectTalkSlideCrosslinkIssues(
	talks: readonly TalkRef[],
	decks: readonly DeckRef[],
): CrosslinkIssue[] {
	const knownTalks = new Set(talks.map((talk) => talk.slug));
	const slides = new Set(decks.map((deck) => deck.frontmatter.slug));
	const unlistedSlides = new Set(
		decks.filter(isUnlistedDeck).map((deck) => deck.frontmatter.slug),
	);
	const issues: CrosslinkIssue[] = [];

	for (const talk of talks) {
		if (!talk.slideSlug) {
			continue;
		}
		if (!slides.has(talk.slideSlug)) {
			issues.push({
				kind: "talk-slide",
				from: talk.slug,
				missing: talk.slideSlug,
			});
			continue;
		}
		if (unlistedSlides.has(talk.slideSlug)) {
			issues.push({
				kind: "talk-unlisted-slide",
				from: talk.slug,
				missing: talk.slideSlug,
			});
		}
	}

	for (const deck of decks) {
		const talkSlug = deck.frontmatter.talkSlug;
		if (talkSlug && !knownTalks.has(talkSlug)) {
			issues.push({
				kind: "deck-talk",
				from: deck.frontmatter.slug,
				missing: talkSlug,
			});
		}
	}

	return issues;
}

export async function validateTalkSlideCrosslinks(): Promise<CrosslinkIssue[]> {
	return collectTalkSlideCrosslinkIssues(TALKS, await loadDecks());
}

export function deckTalkYoutubeId(
	frontmatter: Pick<DeckFrontmatter, "talkSlug">,
): string | undefined {
	if (!frontmatter.talkSlug) {
		return undefined;
	}
	return talkBySlug(frontmatter.talkSlug)?.youtubeId;
}
