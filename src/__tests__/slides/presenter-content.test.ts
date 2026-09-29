import { describe, expect, it } from "vitest";

import {
	slideHeading,
	slidePreviewHint,
} from "@/slides/player/presenter-content";

function slideFromHtml(html: string, index = "2"): HTMLElement {
	const section = document.createElement("section");
	section.className = "slide";
	section.setAttribute("data-index", index);
	section.innerHTML = `<div class="slide-body">${html}</div>`;
	return section;
}

describe("presenter-content", () => {
	it("uses the first heading as slide title", () => {
		const slide = slideFromHtml("<h2>章</h2><p>本文</p>");
		expect(slideHeading(slide)).toBe("章");
	});

	it("falls back to slide index when heading is missing", () => {
		const slide = slideFromHtml("<p>only body</p>", "7");
		expect(slideHeading(slide)).toBe("スライド 7");
	});

	it("extracts a one-line preview after the heading", () => {
		const slide = slideFromHtml(
			"<h2>見出し</h2><p>次の枚で話す要点を一行で。</p>",
		);
		expect(slidePreviewHint(slide)).toBe("次の枚で話す要点を一行で。");
	});

	it("skips speaker notes and duplicate heading text", () => {
		const slide = slideFromHtml(
			`<h2>引用</h2><blockquote>短い引用</blockquote><div class="speaker-notes">話す</div>`,
		);
		expect(slidePreviewHint(slide)).toBe("短い引用");
	});

	it("truncates long preview lines", () => {
		const long = "あ".repeat(120);
		const slide = slideFromHtml(`<h2>t</h2><p>${long}</p>`);
		expect(slidePreviewHint(slide)).toHaveLength(96);
		expect(slidePreviewHint(slide)?.endsWith("…")).toBe(true);
	});
});
