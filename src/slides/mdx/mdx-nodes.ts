import type { Node, Parent } from "unist";

/** mdast-util-mdx の拡張ノード（型だけ。依存を増やさないためここで持つ）。 */
export type MdxJsxAttribute = {
	type: "mdxJsxAttribute" | "mdxJsxExpressionAttribute";
	name?: string;
	value?: unknown;
};

export type MdxJsxElement = Parent & {
	type: "mdxJsxFlowElement" | "mdxJsxTextElement";
	name: string | null;
	attributes: MdxJsxAttribute[];
};

export type MdxExpression = Node & {
	type: "mdxFlowExpression" | "mdxTextExpression";
	value: string;
};

export function isMdxJsx(node: Node): node is MdxJsxElement {
	return node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement";
}

export function isFlowJsx(node: Node, name?: string): node is MdxJsxElement {
	return (
		node.type === "mdxJsxFlowElement" &&
		(name === undefined || (node as MdxJsxElement).name === name)
	);
}

export function isMdxExpression(node: Node): node is MdxExpression {
	return node.type === "mdxFlowExpression" || node.type === "mdxTextExpression";
}

/** `{/* ... *\/}` のコメントだけの式。 */
export function isCommentExpression(node: Node): boolean {
	return isMdxExpression(node) && /^\s*\/\*[\s\S]*\*\/\s*$/.test(node.value);
}
