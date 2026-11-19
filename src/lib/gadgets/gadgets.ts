export type GadgetRating = 1 | 2 | 3 | 4 | 5;

/** 使っている道具 1 件。正は `src/content/gadgets/<slug>.mdx`（TA-2152）。 */
export type Gadget = {
	readonly slug: string;
	readonly name: string;
	readonly note: string;
	readonly brand: string;
	/** 1–5。未記入なら Product JSON-LD は出さない */
	readonly rating?: GadgetRating;
	readonly pros?: readonly string[];
	readonly cons?: readonly string[];
	readonly imageSource?: {
		readonly href: string;
		readonly label?: string;
	};
	/** 本文が十分なページだけ true。未記入は詳細を noindex し sitemap から外す */
	readonly indexable?: boolean;
};

export function isGadgetRating(value: unknown): value is GadgetRating {
	return (
		value === 1 || value === 2 || value === 3 || value === 4 || value === 5
	);
}

export function hasGadgetRating(
	gadget: Gadget,
): gadget is Gadget & { rating: GadgetRating } {
	return isGadgetRating(gadget.rating);
}

export function gadgetRatingLabel(rating: GadgetRating): string {
	return `評価 ${rating} / 5`;
}

export function gadgetBySlug(
	gadgets: readonly Gadget[],
	slug: string,
): Gadget | undefined {
	return gadgets.find((gadget) => gadget.slug === slug);
}

export function gadgetPath(slug: string): string {
	return `/gadgets/${slug}/`;
}

export function gadgetViewTransitionName(slug: string): string {
	return `gadget-${slug}`;
}

export function gadgetSlugFromPath(pathname: string): string | null {
	const match = pathname.replace(/\/+$/, "").match(/^\/gadgets\/([^/]+)$/);
	return match?.[1] ?? null;
}

export function isGadgetsIndexPath(pathname: string): boolean {
	return pathname.replace(/\/+$/, "") === "/gadgets";
}

export function isIndexableGadget(gadget: Pick<Gadget, "indexable">): boolean {
	return gadget.indexable === true;
}

/** sitemap と Worker の Markdown alternate 用。indexable な詳細ページの slug。 */
export function indexableGadgetSlugs(gadgets: readonly Gadget[]): string[] {
	return gadgets.filter(isIndexableGadget).map((gadget) => gadget.slug);
}
