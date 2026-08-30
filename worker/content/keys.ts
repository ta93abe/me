import {
	type ContentCollection,
	isContentCollection,
	isValidSlug,
} from "./collections.ts";

export function markdownKey(
	collection: ContentCollection,
	slug: string,
): string {
	return `md/${collection}/${slug}.md`;
}

export function collectionIndexKey(collection: ContentCollection): string {
	return `index/${collection}.json`;
}

export const ALL_INDEX_KEY = "index/all.json";

export function mediaObjectKey(
	collection: ContentCollection,
	slug: string,
	filename: string,
): string {
	return `content/${collection}/${slug}/${filename}`;
}

export function parseMarkdownKey(
	key: string,
): { collection: ContentCollection; slug: string } | null {
	const match = /^md\/([^/]+)\/([^/]+)\.md$/.exec(key);
	if (!match) {
		return null;
	}

	const collection = match[1];
	const slug = match[2];
	if (!isContentCollection(collection) || !isValidSlug(slug)) {
		return null;
	}

	return { collection, slug };
}

export function sanitizeFilename(filename: string): string | null {
	const base = filename.split(/[/\\]/).pop()?.trim() ?? "";
	if (!base || base === "." || base === "..") {
		return null;
	}

	const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "-");
	if (!cleaned || cleaned === "." || cleaned === "..") {
		return null;
	}

	if (cleaned.length > 120) {
		return null;
	}

	return cleaned;
}
