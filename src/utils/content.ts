/**
 * Content collection utilities
 * コンテンツコレクション用のヘルパー関数
 */

import type { CollectionKey } from "astro:content";
import { getCollection } from "astro:content";

/**
 * Create getStaticPaths function for collection detail pages
 * @param collection - The collection name
 * @returns getStaticPaths function
 */
export const createStaticPaths = <T extends CollectionKey>(collection: T) => {
	return async () => {
		const items = await getCollection(collection);
		return items.map((item) => ({
			params: { id: item.id },
			props: { item },
		}));
	};
};

/**
 * Sort content items by date (newest first)
 * @param items - Array of content items with date field
 * @param dateField - The field name containing the date
 * @returns Sorted array
 */
export const sortByDate = <T extends { data: Record<string, unknown> }>(
	items: T[],
	dateField = "date",
): T[] => {
	return [...items].sort((a, b) => {
		const dateA = a.data[dateField] as Date;
		const dateB = b.data[dateField] as Date;
		return dateB.getTime() - dateA.getTime();
	});
};

/**
 * Filter content items by tag
 * @param items - Array of content items
 * @param tag - Tag to filter by
 * @returns Filtered array
 */
export const filterByTag = <
	T extends { data: { tags?: string[] } },
>(
	items: T[],
	tag: string,
): T[] => {
	return items.filter((item) => item.data.tags?.includes(tag));
};

/**
 * Get related items based on shared tags
 * @param currentItem - The current item
 * @param allItems - All items in the collection
 * @param limit - Maximum number of related items
 * @returns Array of related items
 */
export const getRelatedItems = <
	T extends { id: string; data: { tags?: string[] } },
>(
	currentItem: T,
	allItems: T[],
	limit = 3,
): T[] => {
	const currentTags = currentItem.data.tags || [];
	if (currentTags.length === 0) return [];

	return allItems
		.filter((item) => item.id !== currentItem.id)
		.filter((item) => item.data.tags?.some((tag) => currentTags.includes(tag)))
		.slice(0, limit);
};
