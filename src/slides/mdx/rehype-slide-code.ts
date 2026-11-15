import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import type { Root } from "hast";
import { createHighlighter, createJavaScriptRegexEngine } from "shiki";
import type { VFile } from "vfile";

import { transformerSlideHighlight } from "../parser/highlight.ts";
import { rehypeShikiToClasses } from "../parser/shiki-classes.ts";

/**
 * 全 bundledLanguages を読むと CI の 5s timeout を超える。
 * デッキで使う言語だけ渡し、未知は javascript に落とす。
 */
const SLIDE_SHIKI_LANGS = [
	"typescript",
	"javascript",
	"tsx",
	"jsx",
	"json",
	"bash",
	"shellscript",
	"html",
	"css",
	"markdown",
	"python",
	"go",
	"rust",
	"yaml",
	"toml",
] as const;

let highlighterPromise: ReturnType<typeof createHighlighter> | undefined;

function highlighter() {
	highlighterPromise ??= createHighlighter({
		themes: ["min-dark", "min-light"],
		langs: [...SLIDE_SHIKI_LANGS],
		// Cloudflare / workerd は Oniguruma の WASM を instantiate できない
		engine: createJavaScriptRegexEngine(),
	});
	return highlighterPromise;
}

type AstroData = { astro?: { frontmatter?: Record<string, unknown> } };

/**
 * デッキのコードを Shiki でハイライトし、インライン style をクラスに移す（ADR-0011。CSP を緩めない）。
 * 行ハイライト `{2-4}` / `{1|3-4}` は transformerSlideHighlight が付ける。
 */
export async function highlightSlideCode(
	tree: Root,
	file: VFile,
): Promise<void> {
	const theme =
		(file.data as AstroData).astro?.frontmatter?.theme === "light"
			? "min-light"
			: "min-dark";
	const shiki = rehypeShikiFromHighlighter(await highlighter(), {
		theme,
		fallbackLanguage: "javascript",
		transformers: [transformerSlideHighlight()],
	});
	await shiki(tree, file, () => {});
	rehypeShikiToClasses()(tree);
}
