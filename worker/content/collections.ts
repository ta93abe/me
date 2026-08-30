export const CONTENT_COLLECTIONS = [
	"blog",
	"gallery",
	"atelier",
	"books",
] as const;

export type ContentCollection = (typeof CONTENT_COLLECTIONS)[number];

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,80}$/;

export const MAX_MARKDOWN_BYTES = 512 * 1024;
export const MAX_MEDIA_BYTES = 20 * 1024 * 1024;

export function isContentCollection(value: string): value is ContentCollection {
	return (CONTENT_COLLECTIONS as readonly string[]).includes(value);
}

export function isValidSlug(value: string): boolean {
	return SLUG_PATTERN.test(value);
}
