export type WorkSortable = {
	id: string;
	data: {
		featured?: boolean;
		completedDate?: Date;
	};
};

export function sortWorksByDate<T extends WorkSortable>(works: T[]): T[] {
	return [...works].toSorted((a, b) => {
		const aTime = a.data.completedDate?.getTime() ?? 0;
		const bTime = b.data.completedDate?.getTime() ?? 0;
		return bTime - aTime;
	});
}

/**
 * 代表作を返す。`featured: true` があればそれを優先し、
 * 無ければ新しい順の先頭を使う。
 */
export function getFeaturedWorks<T extends WorkSortable>(
	works: T[],
	limit = 3,
): T[] {
	const sorted = sortWorksByDate(works);
	const featured = sorted.filter((work) => work.data.featured);
	const pool = featured.length > 0 ? featured : sorted;
	return pool.slice(0, limit);
}
