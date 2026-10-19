import type { Deck, Slide } from "./types.ts";

const HEADING_TAG = /<\/?h([1-6])(\s[^>]*)?>/gi;

function mergeClass(attrs: string, className: string): string {
	const classAttr = /(?<=\s|^)class=(["'])([^"']*)\1/i;
	if (classAttr.test(attrs)) {
		return attrs.replace(
			classAttr,
			(_full, quote: string, value: string) =>
				`class=${quote}${className}${value ? ` ${value}` : ""}${quote}`,
		);
	}
	return ` class="${className}"${attrs}`;
}

/** Shift heading levels in already-rendered slide HTML. Original level is kept as `.slide-hN` for CSS. */
export function remapHeadingTags(html: string, shift: number): string {
	if (shift <= 0) {
		return html;
	}
	return html.replace(HEADING_TAG, (full, levelStr: string, attrs = "") => {
		const level = Number(levelStr);
		const next = Math.min(6, level + shift);
		if (full.startsWith("</")) {
			return `</h${next}>`;
		}
		return `<h${next}${mergeClass(attrs, `slide-h${level}`)}>`;
	});
}

export function headingShiftForSlide(deck: Deck, index: number): number {
	const firstCover = deck.slides.findIndex((slide) => slide.type === "cover");
	if (firstCover === index) {
		return 0;
	}
	if (firstCover === -1 && index === 0) {
		return 0;
	}
	return 1;
}

export function remapSlideHeadingHtml(
	deck: Deck,
	slide: Slide,
	index: number,
): string {
	return remapHeadingTags(slide.html, headingShiftForSlide(deck, index));
}
