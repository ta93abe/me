import { Marked } from "marked";
import { parse } from "node-html-parser";

const marked = new Marked({ gfm: true });

const UNSAFE_SELECTOR =
	"script, style, iframe, object, embed, noscript, link, meta";

export function sanitizeFeedHtml(html: string): string {
	const root = parse(html, { comment: false });
	for (const node of root.querySelectorAll(UNSAFE_SELECTOR)) {
		node.remove();
	}
	for (const node of root.querySelectorAll("*")) {
		for (const [name, value] of Object.entries(node.attributes)) {
			if (name.toLowerCase().startsWith("on")) {
				node.removeAttribute(name);
				continue;
			}
			if (
				(name === "href" || name === "src") &&
				/^\s*javascript:/i.test(value)
			) {
				node.removeAttribute(name);
			}
		}
	}
	return root.innerHTML;
}

export function renderFeedHtml(markdown: string): string {
	const html = marked.parse(markdown, { async: false }) as string;
	return sanitizeFeedHtml(html);
}
