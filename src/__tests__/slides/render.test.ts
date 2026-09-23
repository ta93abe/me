import { describe, expect, it } from "vitest";

import type { Deck } from "@/slides/parser/types";
import { renderSlideSections } from "@/slides/render";

const twoSlides: Deck = {
	frontmatter: {
		title: "ショーケース",
		date: "2026-09-06",
		description: "説明",
		slug: "showcase",
		theme: "dark",
	},
	slides: [
		{ type: "cover", html: "<h1>表紙</h1>", notes: "", clicks: 0 },
		{ type: "body", html: "<p>本文</p>", notes: "話す", clicks: 0 },
	],
};

describe("renderSlideSections", () => {
	it("shows every slide on the print page", () => {
		const html = renderSlideSections(twoSlides, { print: true });
		expect(html).not.toContain(" hidden");
		expect(html.match(/<section class="slide/g)?.length).toBe(2);
		expect(html).toContain("speaker-notes");
		expect(html).toContain('data-clicks="0"');
	});

	it("hides later slides on the live player page", () => {
		const html = renderSlideSections(twoSlides);
		expect(html).toContain(" hidden");
		expect(html).toContain('data-type="cover"');
		expect(html).toContain('data-index="2"');
	});
});
