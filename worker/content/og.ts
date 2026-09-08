import { isValidSlug } from "./collections.ts";
import type { ContentIndexEntry } from "./index-store.ts";
import { readCollectionIndex } from "./index-store.ts";

export function parseOgBlogPath(pathname: string): string | null {
	const match = /^\/og\/blog\/([^/]+)\.png$/.exec(pathname);
	if (!match) {
		return null;
	}
	const slug = match[1];
	return isValidSlug(slug) ? slug : null;
}

export function ogTitleFromEntries(
	entries: ContentIndexEntry[],
	slug: string,
): string | null {
	return entries.find((entry) => entry.slug === slug)?.title ?? null;
}

export async function loadOgTitle(
	bucket: R2Bucket,
	slug: string,
): Promise<string | null> {
	const index = await readCollectionIndex(bucket, "blog");
	return ogTitleFromEntries(index.entries, slug);
}
