import { isValidSlug } from "../../../worker/content/collections.ts";
import type { FeedPost } from "../../../worker/content/derived.ts";
import {
	looksLikeMdx,
	parseMarkdownDocument,
} from "../../../worker/content/frontmatter.ts";
import {
	readCollectionIndex,
	type ContentIndexEntry,
} from "../../../worker/content/index-store.ts";
import { markdownKey } from "../../../worker/content/keys.ts";
import { validateFrontmatter } from "../../../worker/content/schema.ts";
import { renderBlogMarkdown } from "./markdown.ts";

export type BlogListItem = {
	slug: string;
	title: string;
	excerpt: string;
	date: Date;
	updatedDate?: Date;
	tags: string[];
};

export type BlogPost = BlogListItem & {
	body: string;
	html: string;
};

export function toFeedPost(post: BlogListItem): FeedPost {
	return {
		slug: post.slug,
		title: post.title,
		excerpt: post.excerpt,
		date: post.date,
		updatedDate: post.updatedDate,
	};
}

export function toDate(value: unknown): Date | undefined {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value;
	}
	if (typeof value === "string" && value.length > 0) {
		const parsed = new Date(value);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed;
		}
	}
	return undefined;
}

function tagsFrom(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter((tag): tag is string => typeof tag === "string");
}

export function indexEntryToListItem(
	entry: ContentIndexEntry,
): BlogListItem | null {
	const date = toDate(entry.frontmatter.date);
	if (!date) {
		return null;
	}

	return {
		slug: entry.slug,
		title: entry.title,
		excerpt: entry.excerpt,
		date,
		updatedDate: toDate(entry.frontmatter.updatedDate),
		tags: tagsFrom(entry.frontmatter.tags),
	};
}

export function sortBlogList(posts: BlogListItem[]): BlogListItem[] {
	return posts.toSorted(
		(left, right) =>
			right.date.getTime() - left.date.getTime() ||
			left.slug.localeCompare(right.slug),
	);
}

export async function listBlogPosts(bucket: R2Bucket): Promise<BlogListItem[]> {
	const index = await readCollectionIndex(bucket, "blog");
	return sortBlogList(
		index.entries
			.map(indexEntryToListItem)
			.filter((item): item is BlogListItem => item !== null),
	);
}

export async function loadBlogPost(
	bucket: R2Bucket,
	slug: string,
): Promise<BlogPost | null> {
	if (!isValidSlug(slug)) {
		return null;
	}

	const object = await bucket.get(markdownKey("blog", slug));
	if (!object) {
		return null;
	}

	const markdown = await object.text();
	if (looksLikeMdx(markdown)) {
		return null;
	}

	try {
		const parsed = parseMarkdownDocument(markdown);
		const validated = validateFrontmatter("blog", parsed.frontmatter);
		if (!validated.ok) {
			return null;
		}

		const date = toDate(validated.data.date);
		if (!date) {
			return null;
		}

		return {
			slug,
			title: validated.data.title,
			excerpt: validated.data.excerpt,
			date,
			updatedDate: toDate(validated.data.updatedDate),
			tags: tagsFrom(validated.data.tags),
			body: parsed.body,
			html: renderBlogMarkdown(parsed.body),
		};
	} catch {
		return null;
	}
}

export function blogNeighbors(
	posts: BlogListItem[],
	slug: string,
): {
	prev?: { id: string; title: string };
	next?: { id: string; title: string };
	related: BlogListItem[];
} {
	const index = posts.findIndex((post) => post.slug === slug);
	const current = index >= 0 ? posts[index] : undefined;
	const prev = index >= 0 ? posts[index + 1] : undefined;
	const next = index > 0 ? posts[index - 1] : undefined;
	const tags = new Set(current?.tags ?? []);

	return {
		prev: prev ? { id: prev.slug, title: prev.title } : undefined,
		next: next ? { id: next.slug, title: next.title } : undefined,
		related: posts
			.filter((post) => post.slug !== slug)
			.filter((post) => post.tags.some((tag) => tags.has(tag)))
			.slice(0, 3),
	};
}
