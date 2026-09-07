import { isValidSlug } from "../../../worker/content/collections.ts";
import {
	publishDateValue,
	reviseDateValue,
	toDate,
} from "../../../worker/content/dates.ts";
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

export { toDate };

export type BlogListItem = {
	slug: string;
	title: string;
	excerpt: string;
	publish_date: Date;
	revise_date?: Date;
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
		publish_date: post.publish_date,
		revise_date: post.revise_date,
	};
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
	const publish_date = toDate(publishDateValue(entry.frontmatter));
	if (!publish_date) {
		return null;
	}

	return {
		slug: entry.slug,
		title: entry.title,
		excerpt: entry.excerpt,
		publish_date,
		revise_date: toDate(reviseDateValue(entry.frontmatter)),
		tags: tagsFrom(entry.frontmatter.tags),
	};
}

export function sortBlogList(posts: BlogListItem[]): BlogListItem[] {
	return posts.toSorted(
		(left, right) =>
			right.publish_date.getTime() - left.publish_date.getTime() ||
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

		const publish_date = toDate(publishDateValue(validated.data));
		if (!publish_date) {
			return null;
		}

		return {
			slug,
			title: validated.data.title,
			excerpt: validated.data.excerpt,
			publish_date,
			revise_date: toDate(reviseDateValue(validated.data)),
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
