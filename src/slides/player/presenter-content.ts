const PREVIEW_MAX = 96;

export function slideHeading(slide: Element | null | undefined): string {
	const heading = slide?.querySelector("h1, h2");
	const text = heading?.textContent?.trim();
	if (text) {
		return text;
	}
	const index = slide?.getAttribute("data-index") ?? "";
	return index ? `スライド ${index}` : "スライド";
}

function truncatePreview(text: string): string {
	if (text.length <= PREVIEW_MAX) {
		return text;
	}
	return `${text.slice(0, PREVIEW_MAX - 1)}…`;
}

export function slidePreviewHint(slide: Element | null | undefined): string {
	if (!slide) {
		return "";
	}
	const headingText = slide.querySelector("h1, h2")?.textContent?.trim() ?? "";
	const root = slide.querySelector(".slide-body") ?? slide;
	const selectors =
		"p, li, blockquote, h3, .slide-cover-meta__event, .slide-cover-meta__details";
	for (const el of root.querySelectorAll(selectors)) {
		if (el.closest(".speaker-notes")) {
			continue;
		}
		const text = el.textContent?.replace(/\s+/g, " ").trim();
		if (!text || text === headingText) {
			continue;
		}
		return truncatePreview(text);
	}
	return "";
}
