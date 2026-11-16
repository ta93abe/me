import { FEATURED_WORKS, SITE, type FeaturedWork } from "@/config/site";
import linksData from "@/data/links.json";
import { TALKS, type Talk } from "@/data/talks";

/** Google スニペット向け。完了条件は 50 文字以上、目安は 60〜110。 */
export const COLLECTION_DESCRIPTION_MAX_LENGTH = 110;

export const SLIDES_COLLECTION_LEAD = "登壇やLTで使用したスライドの一覧です。";
export const TALKS_COLLECTION_LEAD = "登壇と配信に出た回です。";
export const BLOG_COLLECTION_LEAD =
	"技術ブログ。日々の学びや開発の記録を共有しています。";
export const WORKS_COLLECTION_LEAD = "代表作。";
export const CONTACT_LEAD = "SNS から連絡できます。";

function withPeriod(text: string): string {
	const trimmed = text.replace(/。+$/u, "").trim();
	return trimmed ? `${trimmed}。` : "";
}

function uniqueNames(names: readonly string[]): string[] {
	const seen = new Set<string>();
	const unique: string[] = [];
	for (const name of names) {
		const trimmed = name.trim();
		if (!trimmed || seen.has(trimmed)) {
			continue;
		}
		seen.add(trimmed);
		unique.push(trimmed);
	}
	return unique;
}

/**
 * 「リード。名前、名前。」の meta description。
 * 名前は先頭から載せ、maxLength を超える分は落とす。1件目は超えても残す。
 */
export function namedListDescription(
	lead: string,
	names: readonly string[],
	maxLength: number = COLLECTION_DESCRIPTION_MAX_LENGTH,
): string {
	const leadText = withPeriod(lead);
	const unique = uniqueNames(names);
	if (unique.length === 0) {
		return leadText;
	}

	const included: string[] = [];
	for (const name of unique) {
		const candidate = `${leadText}${[...included, name].join("、")}。`;
		if (included.length > 0 && candidate.length > maxLength) {
			break;
		}
		included.push(name);
	}
	return `${leadText}${included.join("、")}。`;
}

/**
 * 抜粋の先頭節。ページにある文だけを短くする。
 * `を` / `で` が 8 文字目以降にあれば、その前まで。
 */
export function firstClause(text: string): string {
	const trimmed = text.replace(/。+$/u, "").trim();
	if (!trimmed) {
		return "";
	}
	const particle = trimmed.search(/を|で/u);
	if (particle >= 8) {
		return trimmed.slice(0, particle).trim();
	}
	return trimmed;
}

export function slidesCollectionDescription(titles: readonly string[]): string {
	return namedListDescription(SLIDES_COLLECTION_LEAD, titles);
}

export function talksCollectionDescription(
	talks: readonly Talk[] = TALKS,
): string {
	return namedListDescription(
		TALKS_COLLECTION_LEAD,
		talks.map((talk) => talk.title),
	);
}

export function blogCollectionDescription(titles: readonly string[]): string {
	const unique = uniqueNames(titles);
	if (unique.length === 0) {
		return withPeriod(BLOG_COLLECTION_LEAD);
	}
	return namedListDescription("技術ブログ", unique);
}

export function worksCollectionDescription(
	works: readonly FeaturedWork[] = FEATURED_WORKS,
): string {
	const titles = namedListDescription(
		WORKS_COLLECTION_LEAD,
		works.map((work) => work.title),
	);
	return namedListDescription(
		titles,
		works.map((work) => firstClause(work.excerpt)),
	);
}

export function contactPageDescription(
	links: readonly { name: string }[] = linksData.links,
	twitter: string = SITE.twitter,
): string {
	const others = uniqueNames(links.map((link) => link.name)).filter(
		(name) => name !== "X",
	);
	return namedListDescription(
		`連絡は SNS から。いちばん反応しやすいのは X（${twitter}）`,
		others,
	);
}

export const TALKS_COLLECTION_DESCRIPTION = talksCollectionDescription();
export const WORKS_COLLECTION_DESCRIPTION = worksCollectionDescription();
export const CONTACT_DESCRIPTION = contactPageDescription();
export const BLOG_COLLECTION_DESCRIPTION = BLOG_COLLECTION_LEAD;
export const SLIDES_COLLECTION_DESCRIPTION = SLIDES_COLLECTION_LEAD;
