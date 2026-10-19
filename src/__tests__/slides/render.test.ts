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

	it("reveals click fragments and code steps on the print page", async () => {
		const { parseDeck } = await import("@/slides/parser/parse-deck");
		const source = `---
title: Print
date: 2026-09-06
description: d
slug: print-test
theme: dark
---

# Click

visible

<!-- click -->

hidden fragment

---

\`\`\`ts {1|2}
const a = 1;
const b = 2;
\`\`\`
`;
		const deck = await parseDeck(source, { filename: "print-test.md" });
		const html = renderSlideSections(deck, { print: true });
		expect(html).toContain('class="fragment is-visible"');
		expect(html).toContain('class="line is-highlighted" data-click-highlight=');
	});

	it("hides later slides on the live player page", () => {
		const html = renderSlideSections(twoSlides);
		expect(html).toContain(" hidden");
		expect(html).toContain('data-type="cover"');
		expect(html).toContain('data-index="2"');
	});

	it("injects cover meta from frontmatter on the first cover slide", () => {
		const html = renderSlideSections(twoSlides);
		expect(html).toContain('class="slide-cover-meta"');
		expect(html).toContain('datetime="2026-09-06T00:00:00.000Z"');
		expect(html).toContain("2026年9月6日");
		expect(html).toContain("Takumi Abe");
		expect(html).toContain("@ta93abe_");
		expect(html).toContain('class="slide-cover-main"');
	});
});
