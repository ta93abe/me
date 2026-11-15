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

/** デッキで書けるコンポーネントはこれだけ。ほかのタグ（小文字の HTML を含む）はビルド失敗。 */
export const ALLOWED_COMPONENTS: ReadonlySet<string> = new Set([
	...Object.keys(TYPE_MARKERS),
	...STRUCTURE_COMPONENTS,
]);

/** 子を持たず、属性も取らない（自己終了で書く）。 */
export const VOID_COMPONENTS: ReadonlySet<string> = new Set([
	...Object.keys(TYPE_MARKERS),
	"Column",
	"Click",
]);

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
