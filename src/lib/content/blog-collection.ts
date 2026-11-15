import { getCollection, type CollectionEntry } from "astro:content";

import { sortBlogList, type BlogListItem } from "./blog.ts";

export type BlogEntry = CollectionEntry<"blog">;

export function blogEntryToListItem(entry: BlogEntry): BlogListItem {
	return {
		slug: entry.id,
		title: entry.data.title,
		excerpt: entry.data.excerpt,
		publish_date: entry.data.date,
		revise_date: entry.data.updatedDate,
		tags: entry.data.tags,
	};
}

/** 公開日の新しい順。 */
export async function getBlogEntries(): Promise<BlogEntry[]> {
	const entries = await getCollection("blog");
	const order = new Map(
		sortBlogList(entries.map(blogEntryToListItem)).map((item, index) => [
			item.slug,
			index,
		]),
	);
	return entries.toSorted(
		(left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0),
	);
}

export async function getBlogList(): Promise<BlogListItem[]> {
	return (await getBlogEntries()).map(blogEntryToListItem);
}
