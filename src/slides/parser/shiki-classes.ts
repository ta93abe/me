import type { Element } from "hast";
import { SKIP, visit } from "unist-util-visit";

function classTokens(node: Element): string[] {
	const raw = [node.properties?.className, node.properties?.class].flatMap(
		(value) => {
			if (Array.isArray(value)) {
				return value.map(String);
			}
			if (typeof value === "string") {
				return [value];
			}
			return [];
		},
	);
	return raw.flatMap((item) => item.split(/\s+/)).filter(Boolean);
}

function readStyle(value: unknown): string | null {
	if (typeof value === "string") {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map(String).join(";");
	}
	return null;
}

function normalizeColor(value: string): string | null {
	const trimmed = value.trim().toLowerCase();
	const hex = trimmed.match(/^#([0-9a-f]{3,8})$/);
	if (hex) {
		return hex[1];
	}
	return null;
}

export function colorClassName(color: string): string | null {
	const hex = normalizeColor(color);
	return hex ? `shiki-fg-${hex}` : null;
}

function isKatexTree(node: Element): boolean {
	return classTokens(node).some(
		(token) => token === "katex" || token.startsWith("katex-"),
	);
}

/**
 * Shiki のインライン style をクラスへ移す。me の CSP は style-src-elem が
 * 'self' なので、ハイライト色はテーマ CSS 側で持つ。
 * KaTeX の strut など、コード以外の style 属性は消さない。
 */
export function rehypeShikiToClasses() {
	return (tree: unknown) => {
		visit(tree as never, "element", (node: Element) => {
			if (isKatexTree(node)) {
				return SKIP;
			}
			rewriteShikiStyle(node);
		});
	};
}

function rewriteShikiStyle(node: Element) {
	const style = readStyle(node.properties?.style);
	if (!style || style.trim() === "") {
		return;
	}

	const classes = classTokens(node);
	const color = style.match(/(?:^|;)\s*color:\s*([^;]+)/i);
	if (color) {
		const className = colorClassName(color[1]);
		if (className) {
			classes.push(className);
		}
	}
	if (/font-style:\s*italic/i.test(style)) {
		classes.push("shiki-italic");
	}
	if (/font-weight:\s*(bold|[5-9]00)/i.test(style)) {
		classes.push("shiki-bold");
	}
	if (/text-decoration:\s*underline/i.test(style)) {
		classes.push("shiki-underline");
	}

	node.properties.className = classes;
	delete node.properties.style;
	delete node.properties.class;
}
