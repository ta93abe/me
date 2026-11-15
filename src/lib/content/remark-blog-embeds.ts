import type { Root, RootContent } from "mdast";
import { visit } from "unist-util-visit";

import { standaloneEmbed } from "./standalone-embed.ts";

type VFileLike = { path?: string; value?: unknown };

export const BLOG_EMBED_COMPONENT = "BlogEmbed";

const BLOG_DIR = /[\\/]src[\\/]content[\\/]blog[\\/]/;

function sourceOf(node: RootContent, file: VFileLike): string | null {
	const start = node.position?.start.offset;
	const end = node.position?.end.offset;
	if (start === undefined || end === undefined) {
		return null;
	}
	return String(file.value ?? "").slice(start, end);
}

/**
 * ブログ記事（`src/content/blog/`）で、URL だけの段落を `<BlogEmbed kind href id />` に置き換える。
 * 取得と HTML 化はビルド時に `BlogEmbed.astro` が行う。
 */
export function remarkBlogEmbeds() {
	return (tree: Root, file: VFileLike) => {
		if (!file.path || !BLOG_DIR.test(file.path)) {
			return;
		}
		visit(tree, "paragraph", (node, index, parent) => {
			if (index === undefined || !parent) {
				return;
			}
			const source = sourceOf(node, file);
			const embed = source ? standaloneEmbed(source) : null;
			if (!embed) {
				return;
			}
			const attributes = [
				{ type: "mdxJsxAttribute", name: "kind", value: embed.kind },
				{ type: "mdxJsxAttribute", name: "href", value: embed.href },
				...("id" in embed
					? [{ type: "mdxJsxAttribute", name: "id", value: embed.id }]
					: []),
			];
			// mdxJsxFlowElement は mdast-util-mdx-jsx の拡張型。ここでは形だけ合わせて差し替える。
			parent.children[index] = {
				type: "mdxJsxFlowElement",
				name: BLOG_EMBED_COMPONENT,
				attributes,
				children: [],
				position: node.position,
			} as unknown as RootContent;
		});
	};
}
