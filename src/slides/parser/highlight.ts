import type { Element } from "hast";
import type { ShikiTransformer } from "shiki";

import { parseCodeFenceMeta } from "./code-meta.ts";

function rawMetaString(meta: Record<string, unknown> | undefined): string {
	const value = meta?.["__raw"];
	return typeof value === "string" ? value : "";
}

function rawMeta(ctx: { options: { meta?: Record<string, unknown> } }): string {
	return rawMetaString(ctx.options.meta);
}

export function transformerSlideHighlight(): ShikiTransformer {
	return {
		name: "slide-highlight",
		pre(node) {
			const parsed = parseCodeFenceMeta(rawMeta(this));
			if (parsed.always.length > 0 || parsed.steps.length > 0) {
				this.addClassToHast(node, "has-highlight");
			}
			if (parsed.steps.length > 0) {
				this.addClassToHast(node, "has-click-highlight");
			}
		},
		line(node: Element, line) {
			const parsed = parseCodeFenceMeta(rawMeta(this));
			if (parsed.always.includes(line)) {
				this.addClassToHast(node, "line-highlighted");
			}
			for (const [step, lines] of parsed.steps.entries()) {
				if (lines.includes(line)) {
					node.properties = node.properties ?? {};
					node.properties["data-click-highlight"] = String(step);
				}
			}
		},
	};
}
