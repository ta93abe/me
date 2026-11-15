import { parseFrontmatter } from "@astrojs/markdown-remark";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { VFile } from "vfile";

import { remarkSlideGuard } from "@/slides/mdx/remark-slide-guard";
import {
	remarkSlides,
	type SlideDeckRenderInfo,
} from "@/slides/mdx/remark-slides";
import { rehypeCodeHighlight } from "@/utils/rehype-code-highlight";

const MDX_NODE_TYPES = [
	"mdxFlowExpression",
	"mdxJsxFlowElement",
	"mdxJsxTextElement",
	"mdxTextExpression",
	"mdxjsEsm",
];

export type CompiledDeck = {
	html: string;
	info: SlideDeckRenderInfo;
};

/**
 * Astro の MDX と同じ remark / rehype プラグインでデッキを HTML にする（テスト用）。
 * パスは `src/slides/decks/<slug>.mdx` にする（プラグインはこのパスだけを対象にする）。
 */
export async function compileDeck(
	source: string,
	slug = "demo",
): Promise<CompiledDeck> {
	const { frontmatter, content } = parseFrontmatter(source);
	const file = new VFile({
		path: `/repo/src/slides/decks/${slug}.mdx`,
		value: content,
		data: { astro: { frontmatter } },
	});
	const result = await unified()
		.use(remarkParse)
		.use(remarkMdx)
		.use(remarkGfm)
		.use(remarkMath)
		.use(remarkSlideGuard)
		.use(remarkSlides)
		.use(remarkRehype, { passThrough: MDX_NODE_TYPES } as never)
		.use(rehypeKatex, { strict: "ignore" })
		.use(rehypeCodeHighlight)
		.use(rehypeStringify)
		.process(file);
	const data = result.data as {
		astro: { frontmatter: SlideDeckRenderInfo };
	};
	return { html: String(result), info: data.astro.frontmatter };
}

export function deck(body: string, frontmatter = ""): string {
	return `---
title: Demo
date: 2026-09-06
description: demo
slug: demo
${frontmatter}
---

${body}
`;
}

/** n 番目（1 始まり）の <section class="slide"> を返す。 */
export function slideHtml(html: string, index: number): string {
	const sections = html
		.split(/(?=<section class="slide)/)
		.filter((part) => part.startsWith("<section"));
	return sections[index - 1] ?? "";
}
