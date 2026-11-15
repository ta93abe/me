import type { FeedPost } from "../../../worker/content/derived.ts";

export type BlogListItem = {
	slug: string;
	title: string;
	excerpt: string;
	publish_date: Date;
	revise_date?: Date;
	tags: string[];
};

export function toFeedPost(post: BlogListItem): FeedPost {
	return {
		slug: post.slug,
		title: post.title,
		excerpt: post.excerpt,
		publish_date: post.publish_date,
		revise_date: post.revise_date,
		tags: post.tags,
	};
}

export function sortBlogList(posts: BlogListItem[]): BlogListItem[] {
	return posts.toSorted(
		(left, right) =>
			right.publish_date.getTime() - left.publish_date.getTime() ||
			left.slug.localeCompare(right.slug),
	);
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
