import { HTMLElement, parse } from "node-html-parser";

import { countHighlightClicks } from "./code-meta.ts";
import { DeckError } from "./types.ts";

const CLICK_LINE = /^\s*<!--\s*click\s*-->\s*$/;
const CLICKS_MARK = /<!--\s*clicks\s*-->/g;

export function splitClickFragments(source: string): string[] {
	const lines = source.replace(/\r\n/g, "\n").split("\n");
	const chunks: string[] = [];
	let buffer: string[] = [];
	let fenceChar: "`" | "~" | null = null;
	let fenceLen = 0;

	const flush = () => {
		chunks.push(buffer.join("\n"));
		buffer = [];
	};

	for (const line of lines) {
		if (!fenceChar) {
			const open = line.match(/^(`{3,}|~{3,})/);
			if (open) {
				fenceChar = open[1][0] as "`" | "~";
				fenceLen = open[1].length;
				buffer.push(line);
				continue;
			}
			if (CLICK_LINE.test(line)) {
				flush();
				continue;
			}
			buffer.push(line);
			continue;
		}

		buffer.push(line);
		const close = line.match(/^(`{3,}|~{3,})\s*$/);
		if (close && close[1][0] === fenceChar && close[1].length >= fenceLen) {
			fenceChar = null;
			fenceLen = 0;
		}
	}

	flush();
	return chunks;
}

export function applyListClicks(
	html: string,
	start: number,
): { html: string; extra: number } {
	const root = parse(html);
	const list = root.querySelector("ul, ol");
	if (!list) {
		throw new DeckError("<!-- clicks --> のあとにリストがありません");
	}

	let extra = 0;
	for (const child of list.childNodes) {
		if (!(child instanceof HTMLElement) || child.rawTagName !== "li") {
			continue;
		}
		extra += 1;
		child.classList.add("fragment");
		child.setAttribute("data-click", String(start + extra));
	}

	if (extra === 0) {
		throw new DeckError("<!-- clicks --> のリストに項目がありません");
	}

	return { html: root.toString(), extra };
}

export async function materializeSlideHtml(
	source: string,
	toHtml: (markdown: string) => Promise<string>,
): Promise<{ html: string; clicks: number }> {
	const parts = splitClickFragments(source);
	let html = "";
	let clicks = 0;

	for (const [index, rawPart] of parts.entries()) {
		const wantsListClicks = /<!--\s*clicks\s*-->/.test(rawPart);
		const markdown = rawPart.replace(CLICKS_MARK, "\n").trim();
		if (!markdown) {
			throw new DeckError("click のあいだが空です");
		}

		let partHtml = await toHtml(markdown);

		if (index > 0) {
			clicks += 1;
			partHtml = `<div class="fragment" data-click="${clicks}">${partHtml}</div>`;
		}

		if (wantsListClicks) {
			const applied = applyListClicks(partHtml, clicks);
			partHtml = applied.html;
			clicks += applied.extra;
		}

		html += (html ? "\n" : "") + partHtml;
	}

	clicks = Math.max(clicks, countHighlightClicks(html));
	if (!html) {
		throw new DeckError("本文が空です");
	}

	return { html, clicks };
}
