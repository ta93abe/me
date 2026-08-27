import {
	FEATURED_GALLERY_IDS,
	FEATURED_WORK_FALLBACKS,
	type FeaturedWork,
} from "@/config/site";

export type FeaturedWorkSource = {
	id: string;
	title: string;
	excerpt: string;
};

export type ResolvedFeaturedWork = FeaturedWork & {
	source: "gallery" | "fallback";
};

type ResolveFeaturedWorksOptions = {
	galleryIds?: readonly string[];
	fallbacks?: readonly FeaturedWork[];
	limit?: number;
};

/**
 * Gallery の指定 slug を先に並べ、足りなければ fallback で 2〜3 件にする。
 * 存在しない slug は飛ばす（差し替え途中でもトップが空にならない）。
 */
export function resolveFeaturedWorks(
	gallery: readonly FeaturedWorkSource[],
	options: ResolveFeaturedWorksOptions = {},
): ResolvedFeaturedWork[] {
	const galleryIds = options.galleryIds ?? FEATURED_GALLERY_IDS;
	const fallbacks = options.fallbacks ?? FEATURED_WORK_FALLBACKS;
	const limit = options.limit ?? 3;

	const byId = new Map(gallery.map((entry) => [entry.id, entry]));
	const fromGallery: ResolvedFeaturedWork[] = [];

	for (const id of galleryIds) {
		const entry = byId.get(id);
		if (!entry) {
			continue;
		}
		fromGallery.push({
			href: `/gallery/${entry.id}`,
			title: entry.title,
			excerpt: entry.excerpt,
			source: "gallery",
		});
	}

	const usedHrefs = new Set(fromGallery.map((work) => work.href));
	const fromFallback = fallbacks
		.filter((work) => !usedHrefs.has(work.href))
		.map((work) => ({ ...work, source: "fallback" as const }));

	return [...fromGallery, ...fromFallback].slice(0, limit);
}

export function isExternalHref(href: string): boolean {
	return href.startsWith("https://") || href.startsWith("http://");
}
