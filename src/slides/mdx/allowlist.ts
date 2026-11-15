import type { SlideType } from "../parser/types.ts";

/** スライドの型マーカー（ADR-0002）。各スライドの先頭に 1 つだけ置く。無ければ body。 */
export const TYPE_MARKERS = {
	Cover: "cover",
	Section: "section",
	Split: "split",
	Quote: "quote",
	Code: "code",
	Figure: "figure",
	Center: "center",
	End: "end",
} as const satisfies Record<string, SlideType>;

export type TypeMarker = keyof typeof TYPE_MARKERS;

/** 段組み・ノート・クリック。 */
export const STRUCTURE_COMPONENTS = [
	"Column",
	"Notes",
	"Click",
	"Clicks",
] as const;

/**
 * 描画時に Astro コンポーネントになる埋め込み。属性は文字列リテラルで、ここに挙げたものだけ書ける。
 * 実体は SlideDeck.astro の `components` で渡す。
 */
export const EMBED_COMPONENT_ATTRIBUTES = {
	Tweet: ["id", "url", "scale", "cards"],
	Divider: [],
} as const satisfies Record<string, readonly string[]>;

/** デッキで書けるコンポーネントはこれだけ。ほかのタグ（小文字の HTML を含む）はビルド失敗。 */
export const ALLOWED_COMPONENTS: ReadonlySet<string> = new Set([
	...Object.keys(TYPE_MARKERS),
	...STRUCTURE_COMPONENTS,
	...Object.keys(EMBED_COMPONENT_ATTRIBUTES),
]);

/** 子を持たない（自己終了で書く）。 */
export const VOID_COMPONENTS: ReadonlySet<string> = new Set([
	...Object.keys(TYPE_MARKERS),
	"Column",
	"Click",
	...Object.keys(EMBED_COMPONENT_ATTRIBUTES),
]);

/** 書ける属性名。マーカーと構造コンポーネントは属性を取らない。 */
export function allowedAttributes(name: string): readonly string[] {
	return Object.hasOwn(EMBED_COMPONENT_ATTRIBUTES, name)
		? EMBED_COMPONENT_ATTRIBUTES[
				name as keyof typeof EMBED_COMPONENT_ATTRIBUTES
			]
		: [];
}

export function isTypeMarker(
	name: string | null | undefined,
): name is TypeMarker {
	return typeof name === "string" && Object.hasOwn(TYPE_MARKERS, name);
}

/** `src/slides/decks/` のファイルだけを対象にする。 */
export const SLIDE_DECK_PATH =
	/[\\/]src[\\/]slides[\\/]decks[\\/][^\\/]+\.mdx$/;

export function isSlideDeckFile(path: string | undefined): boolean {
	return typeof path === "string" && SLIDE_DECK_PATH.test(path);
}
