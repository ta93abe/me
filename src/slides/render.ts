import { SITE } from "@/config/site";
import { formatDate, toDatetimeAttr } from "@/utils/date";

import type { Deck, DeckFrontmatter, Slide } from "./parser/types.ts";

export function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function renderCoverMeta(frontmatter: DeckFrontmatter): string {
	const dateLabel = formatDate(frontmatter.date);
	const dateTime = toDatetimeAttr(frontmatter.date);
	const detailParts = [
		`<time datetime="${escapeHtml(dateTime)}">${escapeHtml(dateLabel)}</time>`,
		`<span>${escapeHtml(SITE.author)}</span>`,
		`<span>${escapeHtml(SITE.twitter)}</span>`,
	];
	const details = detailParts.join(
		'<span class="slide-cover-meta__sep" aria-hidden="true">·</span>',
	);
	const eventBlock = frontmatter.event
		? `<p class="slide-cover-meta__event">${escapeHtml(frontmatter.event)}</p>`
		: "";
	return `<header class="slide-cover-meta">${eventBlock}<p class="slide-cover-meta__details">${details}</p></header>`;
}

function wrapCoverBody(deck: Deck, slide: Slide, index: number): string {
	const firstCoverIndex = deck.slides.findIndex(
		(item) => item.type === "cover",
	);
	const meta =
		firstCoverIndex === index ? renderCoverMeta(deck.frontmatter) : "";
	return `${meta}<div class="slide-cover-main">${slide.html}</div>`;
}

function slideBodyHtml(deck: Deck, slide: Slide, index: number): string {
	if (slide.type === "cover") {
		return wrapCoverBody(deck, slide, index);
	}
	return slide.html;
}

/** Print/PDF: reveal every click fragment and code step (player overview parity). */
function revealPrintSlideHtml(html: string): string {
	return html
		.replace(/\bclass="fragment"/g, 'class="fragment is-visible"')
		.replace(
			/\bclass="line"(\s+data-click-highlight=)/g,
			'class="line is-highlighted"$1',
		);
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
			let body = slideBodyHtml(deck, slide, index);
			if (print) {
				body = revealPrintSlideHtml(body);
			}
			return `<section class="slide${active}" data-type="${slide.type}" data-index="${index + 1}" data-clicks="${slide.clicks}" id="s${index + 1}" aria-label="${index + 1} / ${deck.slides.length}"${hidden}>
  <div class="slide-body">${body}</div>
  ${notes}
</section>`;
		})
		.join("\n");
}
