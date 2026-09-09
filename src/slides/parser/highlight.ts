import type { Element } from "hast";
import type { ShikiTransformer } from "shiki";

import { parseCodeFenceMeta, type HighlightMeta } from "./code-meta.ts";

function rawMetaString(meta: Record<string, unknown> | undefined): string {
	const value = meta?.["__raw"];
	return typeof value === "string" ? value : "";
}

function rawMeta(ctx: { options: { meta?: Record<string, unknown> } }): string {
	return rawMetaString(ctx.options.meta);
}

function parsedMeta(ctx: {
	options: { meta?: Record<string, unknown> };
}): HighlightMeta {
	const stored = ctx.options.meta?.slideHighlight;
	if (stored && typeof stored === "object") {
		return stored as HighlightMeta;
	}
	return parseCodeFenceMeta(rawMeta(ctx));
}

export function transformerSlideHighlight(): ShikiTransformer {
	return {
		name: "slide-highlight",
		preprocess(_code, options) {
			const meta = options.meta as Record<string, unknown> | undefined;
			if (!meta) {
				return;
			}
			meta.slideHighlight = parseCodeFenceMeta(rawMetaString(meta));
		},
		pre(node) {
			const parsed = parsedMeta(this);
			if (parsed.always.length > 0 || parsed.steps.length > 0) {
				this.addClassToHast(node, "has-highlight");
			}
			if (parsed.steps.length > 0) {
				this.addClassToHast(node, "has-click-highlight");
			}
		},
		line(node: Element, line) {
			const parsed = parsedMeta(this);
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
