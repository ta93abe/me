import type { Root } from "mdast";
import type { Node } from "unist";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

import {
	ALLOWED_COMPONENTS,
	isSlideDeckFile,
	VOID_COMPONENTS,
} from "./allowlist.ts";
import { isCommentExpression, isMdxExpression, isMdxJsx } from "./mdx-nodes.ts";

/**
 * デッキの MDX で書ける範囲を絞る（ADR-0002 決定 7）。違反はビルド失敗にする。
 * - import / export
 * - `{...}` の式（`{/* *\/}` のコメントだけ可）
 * - 許可リスト外のコンポーネント・HTML タグ（style / script / 生の HTML を含む）
 * - 属性（マーカーは属性を取らない。style 属性もここで落ちる）
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
			if (node.attributes.length > 0) {
				file.fail(`<${name}> に属性は書けません`, node);
			}
			if (VOID_COMPONENTS.has(name) && node.children.length > 0) {
				file.fail(`<${name} /> は中身を持てません`, node);
			}
		});
	};
}
