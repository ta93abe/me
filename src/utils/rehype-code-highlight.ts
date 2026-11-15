import { rehypePrism } from "@astrojs/markdown-remark";
import type { Root } from "hast";
import type { VFile } from "vfile";

import { isSlideDeckFile } from "../slides/mdx/allowlist.ts";
import { highlightSlideCode } from "../slides/mdx/rehype-slide-code.ts";

/**
 * コードハイライトの振り分け。`markdown.syntaxHighlight` は false にしてここで決める。
 * - スライド（`src/slides/decks/*.mdx`）: Shiki をクラス化（デッキの theme に追従）
 * - それ以外（ブログなど）: Astro の Prism（クラスベース。CSP 互換）
 */
// rehypePrism は unified の Plugin 型だが、中身は this を使わないので素の関数として呼ぶ
const prismTransformer = rehypePrism as unknown as (
	excludeLangs?: string[],
) => (tree: Root) => Promise<void>;

export function rehypeCodeHighlight() {
	const prism = prismTransformer(undefined);
	return async (tree: Root, file: VFile) => {
		if (isSlideDeckFile(file.path)) {
			await highlightSlideCode(tree, file);
			return;
		}
		await prism(tree);
	};
}
