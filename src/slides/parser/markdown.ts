import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createHighlighter, createJavaScriptRegexEngine } from "shiki";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import { rehypeShikiToClasses } from "./shiki-classes.ts";
import type { ColorTheme } from "./types.ts";

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

const highlighterPromise = createHighlighter({
	themes: ["min-dark", "min-light"],
	langs: [...SLIDE_SHIKI_LANGS],
	// Cloudflare / workerd は Oniguruma の WASM を instantiate できない
	engine: createJavaScriptRegexEngine(),
});

type ImageNode = {
	type: "image";
	url: string;
};

function rewriteRelativeImages(slug: string) {
	return () => (tree: unknown) => {
		visit(tree as never, "image", (node: ImageNode) => {
			if (!node.url || /^(https?:|data:|\/)/i.test(node.url)) {
				return;
			}
			const cleaned = node.url.replace(/^\.\//, "");
			node.url = cleaned.startsWith(`${slug}/`)
				? `/slides/media/${cleaned}`
				: `/slides/media/${slug}/${cleaned}`;
		});
	};
}

export async function markdownToHtml(
	markdown: string,
	slug: string,
	theme: ColorTheme = "dark",
): Promise<string> {
	const highlighter = await highlighterPromise;
	const themeName = theme === "light" ? "min-light" : "min-dark";
	const file = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(rewriteRelativeImages(slug))
		.use(remarkRehype, { allowDangerousHtml: false })
		.use(() =>
			rehypeShikiFromHighlighter(highlighter, {
				theme: themeName,
				fallbackLanguage: "javascript",
			}),
		)
		.use(rehypeShikiToClasses)
		.use(rehypeStringify)
		.process(markdown);

	return String(file).trim();
}
