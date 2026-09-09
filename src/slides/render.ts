import type { Deck } from "./parser/types.ts";

export function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

export function renderSlideSections(
	deck: Deck,
	options: { print?: boolean } = {},
): string {
	const print = options.print === true;
	return deck.slides
		.map((slide, index) => {
			const notes = slide.notes
				? `<div class="speaker-notes">${escapeHtml(slide.notes)}</div>`
				: "";
			const active = print || index === 0 ? " is-active" : "";
			const hidden = print || index === 0 ? "" : " hidden inert";
			return `<section class="slide${active}" data-type="${slide.type}" data-index="${index + 1}" data-clicks="${slide.clicks}" id="s${index + 1}" aria-label="${index + 1} / ${deck.slides.length}"${hidden}>
  <div class="slide-body">${slide.html}</div>
  ${notes}
</section>`;
		})
		.join("\n");
}
