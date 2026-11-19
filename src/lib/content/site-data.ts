import { z } from "astro/zod";

/**
 * Works / Links など「1 項目 1 ファイル」のコレクション（TA-2152）。
 * スキーマと並び替えは純関数にして、Astro・Worker・テストのどこからでも使えるようにする。
 */

const nonEmpty = z.string().trim().min(1);
const order = z.number().int().nonnegative();

/** 外部の絶対 URL か、サイト内のパス（`/blog/<slug>/` など）。 */
const workHref = z.union([z.url(), z.string().regex(/^\/[^/]/)]);

/** `src/content/works/<slug>.mdx` */
export const workFrontmatterSchema = z
	.object({
		title: nonEmpty,
		/** GitHub のリポジトリか、サイト内のブログ記事 */
		href: workHref,
		excerpt: nonEmpty,
		order,
	})
	.strict();

/** `src/content/links/<slug>.mdx` */
export const linkFrontmatterSchema = z
	.object({
		name: nonEmpty,
		url: z.url(),
		/** simple-icons のスラッグか `src/data/custom-icons.ts` のキー */
		icon: nonEmpty,
		order,
	})
	.strict();

export type FeaturedWork = {
	href: string;
	title: string;
	excerpt: string;
};

export type SiteLink = {
	name: string;
	url: string;
	icon: string;
};

type Ordered = { id: string; data: { order: number } };

/**
 * `order` の昇順に並べる。同じ `order` が 2 つあると並びが決まらないので投げる（ビルド失敗）。
 */
export function sortByOrder<T extends Ordered>(
	collection: string,
	entries: readonly T[],
): T[] {
	const seen = new Map<number, string>();
	for (const entry of entries) {
		const other = seen.get(entry.data.order);
		if (other !== undefined) {
			throw new Error(
				`${collection}: order ${entry.data.order} が ${other} と ${entry.id} で重複しています`,
			);
		}
		seen.set(entry.data.order, entry.id);
	}
	return entries.toSorted((left, right) => left.data.order - right.data.order);
}

/** JSON-LD Person.sameAs。Links の URL を並び順のまま使う。 */
export function profileUrls(links: readonly SiteLink[]): string[] {
	return links.map((link) => link.url);
}
