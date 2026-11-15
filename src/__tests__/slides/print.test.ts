import { describe, expect, it } from "vitest";

import { revealPrintSlidesHtml } from "@/slides/print";

import { compileDeck, deck } from "./helpers/compile-deck";

describe("revealPrintSlidesHtml", () => {
	it("shows every slide, click fragment, and code step", async () => {
		const { html } = await compileDeck(
			deck(
				"# 一\n\n---\n\n二\n\n<Click />\n\n三\n\n---\n\n<Code />\n\n```ts {1|2}\nconst a = 1;\nconst b = 2;\n```",
			),
		);
		const print = revealPrintSlidesHtml(html);
		expect(print.match(/<section class="slide is-active"/g)).toHaveLength(3);
		expect(print).not.toMatch(/<section[^>]*\shidden/);
		expect(print).not.toMatch(/<section[^>]*\sinert/);
		expect(print).toContain('class="fragment is-visible"');
		expect(print).toContain(
			'class="line is-highlighted" data-click-highlight=',
		);
		expect(
			revealPrintSlidesHtml(
				'<img src="/a.png" alt="" loading="lazy" decoding="async">',
			),
		).toBe('<img src="/a.png" alt="" decoding="async">');
	});
});
