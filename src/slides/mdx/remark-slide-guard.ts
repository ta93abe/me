import type { Root } from "mdast";
import type { Node } from "unist";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

import {
	ALLOWED_COMPONENTS,
	allowedAttributes,
	isSlideDeckFile,
	VOID_COMPONENTS,
} from "./allowlist.ts";
import { isCommentExpression, isMdxExpression, isMdxJsx } from "./mdx-nodes.ts";

/**
 * デッキの MDX で書ける範囲を絞る（ADR-0002 決定 7）。違反はビルド失敗にする。
 * - import / export
 * - `{...}` の式（`{/* *\/}` のコメントだけ可）
 * - 許可リスト外のコンポーネント・HTML タグ（style / script / 生の HTML を含む）
 * - 属性（マーカーは取らない。埋め込みは許可した名前の文字列だけ。style 属性もここで落ちる）
 */
export function remarkSlideGuard() {
	return (tree: Root, file: VFile) => {
		if (!isSlideDeckFile(file.path)) {
			return;
		}
		visit(tree, (node: Node) => {
			if (node.type === "mdxjsEsm") {
				file.fail("デッキで import / export は使えません", node);
			}
			if (isMdxExpression(node) && !isCommentExpression(node)) {
				file.fail(
					"デッキで {...} の式は使えません（コメント {/* */} だけ可）",
					node,
				);
			}
			if (!isMdxJsx(node)) {
				return;
			}
			const name = node.name ?? "<>";
			if (!ALLOWED_COMPONENTS.has(name)) {
				file.fail(
					`デッキで <${name}> は使えません。使えるのは ${[...ALLOWED_COMPONENTS].join(" / ")} だけです`,
					node,
				);
			}
			if (node.type !== "mdxJsxFlowElement") {
				file.fail(`<${name}> は行頭に単独で置いてください`, node);
			}
			const allowed = allowedAttributes(name);
			for (const attribute of node.attributes) {
				if (
					attribute.type !== "mdxJsxAttribute" ||
					!attribute.name ||
					!allowed.includes(attribute.name)
				) {
					file.fail(
						allowed.length === 0
							? `<${name}> に属性は書けません`
							: `<${name}> に書ける属性は ${allowed.join(" / ")} だけです`,
						node,
					);
				}
				if (typeof attribute.value !== "string") {
					file.fail(
						`<${name} ${attribute.name}> は "..." の文字列で書いてください（{...} の式は不可）`,
						node,
					);
				}
			}
			if (VOID_COMPONENTS.has(name) && node.children.length > 0) {
				file.fail(`<${name} /> は中身を持てません`, node);
			}
		});
	};
}
