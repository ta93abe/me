import { CONTENT_COLLECTIONS, type ContentCollection } from "./collections.ts";
import { looksLikeMdx, parseMarkdownDocument } from "./frontmatter.ts";
import { ALL_INDEX_KEY, collectionIndexKey, markdownKey } from "./keys.ts";
import { validateFrontmatter, type ValidatedFrontmatter } from "./schema.ts";

export type ContentIndexEntry = {
	collection: ContentCollection;
	slug: string;
	title: string;
	excerpt: string;
	updatedAt: string;
	frontmatter: ValidatedFrontmatter;
};

export type CollectionIndex = {
	collection: ContentCollection;
	generatedAt: string;
	entries: ContentIndexEntry[];
};

export type AllIndex = {
	generatedAt: string;
	collections: Record<ContentCollection, ContentIndexEntry[]>;
};

function toIso(value: unknown): string | undefined {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString();
	}
	if (typeof value === "string" && value.length > 0) {
		const parsed = new Date(value);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed.toISOString();
		}
	}
	return undefined;
}

function entryUpdatedAt(frontmatter: ValidatedFrontmatter): string {
	return (
		toIso(frontmatter.updatedDate) ??
		toIso(frontmatter.completedDate) ??
		toIso(frontmatter.finishedDate) ??
		toIso(frontmatter.date) ??
		new Date(0).toISOString()
	);
}

async function readEntry(
	bucket: R2Bucket,
	collection: ContentCollection,
	slug: string,
): Promise<ContentIndexEntry | null> {
	const object = await bucket.get(markdownKey(collection, slug));
	if (!object) {
		return null;
	}

	const markdown = await object.text();
	if (looksLikeMdx(markdown)) {
		return null;
	}

	try {
		const parsed = parseMarkdownDocument(markdown);
		const validated = validateFrontmatter(collection, parsed.frontmatter);
		if (!validated.ok) {
			return null;
		}

		return {
			collection,
			slug,
			title: validated.data.title,
			excerpt: validated.data.excerpt,
			updatedAt: object.uploaded.toISOString(),
			frontmatter: validated.data,
		};
	} catch {
		return null;
	}
}

async function listCollectionEntries(
	bucket: R2Bucket,
	collection: ContentCollection,
): Promise<ContentIndexEntry[]> {
	const entries: ContentIndexEntry[] = [];
	let cursor: string | undefined;

	do {
		const page = await bucket.list({
			prefix: `md/${collection}/`,
			cursor,
		});

		for (const object of page.objects) {
			const slug = object.key
				.slice(`md/${collection}/`.length)
				.replace(/\.md$/, "");
			const entry = await readEntry(bucket, collection, slug);
			if (entry) {
				entries.push(entry);
			}
		}

		cursor = page.truncated ? page.cursor : undefined;
	} while (cursor);

	entries.sort((left, right) => {
		const leftDate = entryUpdatedAt(left.frontmatter);
		const rightDate = entryUpdatedAt(right.frontmatter);
		return (
			rightDate.localeCompare(leftDate) || left.slug.localeCompare(right.slug)
		);
	});

	return entries;
}

export async function rebuildContentIndexes(
	bucket: R2Bucket,
): Promise<AllIndex> {
	const generatedAt = new Date().toISOString();
	const collections = {} as Record<ContentCollection, ContentIndexEntry[]>;

	for (const collection of CONTENT_COLLECTIONS) {
		const entries = await listCollectionEntries(bucket, collection);
		collections[collection] = entries;
		const payload: CollectionIndex = {
			collection,
			generatedAt,
			entries,
		};
		await bucket.put(
			collectionIndexKey(collection),
			JSON.stringify(payload, null, 2),
			{
				httpMetadata: { contentType: "application/json; charset=utf-8" },
			},
		);
	}

	const all: AllIndex = { generatedAt, collections };
	await bucket.put(ALL_INDEX_KEY, JSON.stringify(all, null, 2), {
		httpMetadata: { contentType: "application/json; charset=utf-8" },
	});
	return all;
}

export async function readCollectionIndex(
	bucket: R2Bucket,
	collection: ContentCollection,
): Promise<CollectionIndex> {
	const object = await bucket.get(collectionIndexKey(collection));
	if (!object) {
		return { collection, generatedAt: new Date(0).toISOString(), entries: [] };
	}
	return (await object.json()) as CollectionIndex;
}

export async function readAllIndex(bucket: R2Bucket): Promise<AllIndex> {
	const object = await bucket.get(ALL_INDEX_KEY);
	if (!object) {
		const empty = {} as Record<ContentCollection, ContentIndexEntry[]>;
		for (const collection of CONTENT_COLLECTIONS) {
			empty[collection] = [];
		}
		return { generatedAt: new Date(0).toISOString(), collections: empty };
	}
	return (await object.json()) as AllIndex;
}
