export function slidePlayerPath(slug: string): string {
	return `/slides/${slug}/`;
}

export function slidePdfPath(slug: string): string {
	return `/slides/${slug}.pdf`;
}

export function talkAnchorPath(talkSlug: string): string {
	return `/talks/#talk-${talkSlug}`;
}
