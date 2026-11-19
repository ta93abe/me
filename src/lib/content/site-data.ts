import { z } from "astro/zod";

import type { Talk } from "../talks/talks.ts";
import { isYoutubeId } from "./youtube-url.ts";

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

/** `2026-02-30` のように形だけ合っていて実在しない日付を落とす。 */
function isCalendarDate(value: string): boolean {
	const date = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** `src/content/talks/<slug>.mdx`。slug はファイル名。並び順は `date` の新しい順。 */
export const talkFrontmatterSchema = z
	.object({
		title: nonEmpty,
		event: nonEmpty,
		/** `YYYY-MM-DD`。表示・JSON-LD・sitemap がこの文字列をそのまま使う。 */
		date: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/)
			.refine(isCalendarDate, "存在しない日付です"),
		excerpt: nonEmpty,
		youtubeId: z
			.string()
			.refine(isYoutubeId, "YouTube の動画 ID ではありません"),
		/** 公開デッキの slug。存在と unlisted でないことはテストで確かめる。 */
		slideSlug: z
			.string()
			.regex(/^[a-z][a-z0-9-]*$/)
			.optional(),
		youtubeThumbnailFit: z.enum(["wide", "square"]).optional(),
		links: z
			.array(z.object({ label: nonEmpty, href: z.url() }).strict())
			.optional(),
	})
	.strict();

export type TalkFrontmatter = z.infer<typeof talkFrontmatterSchema>;

/** 新しい順。同じ日付はファイル名順にして並びを決める。 */
export function talksFromEntries(
	entries: readonly { id: string; data: TalkFrontmatter }[],
): Talk[] {
	return entries
		.toSorted(
			(left, right) =>
				right.data.date.localeCompare(left.data.date) ||
				left.id.localeCompare(right.id),
		)
		.map(({ id, data }) => ({ slug: id, ...data }));
}

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
