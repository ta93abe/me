import { Marked } from "marked";
import { parse } from "node-html-parser";

const marked = new Marked({ gfm: true });

const UNSAFE_SELECTOR =
	"script, style, iframe, object, embed, noscript, link, meta";

const URL_ATTRS = new Set([
	"href",
	"src",
	"action",
	"formaction",
	"poster",
	"data",
	"xlink:href",
]);

function decodeHtmlEntities(value: string): string {
	return value
		.replace(/&colon;/gi, ":")
		.replace(/&tab;/gi, "\t")
		.replace(/&newline;/gi, "\n")
		.replace(/&#x([0-9a-fA-F]+);?/g, (_, hex: string) => {
			const code = Number.parseInt(hex, 16);
			return Number.isFinite(code) ? String.fromCodePoint(code) : "";
		})
		.replace(/&#(\d+);?/g, (_, dec: string) => {
			const code = Number(dec);
			return Number.isFinite(code) ? String.fromCodePoint(code) : "";
		});
}

function stripUrlNoise(value: string): string {
	let result = "";
	for (const char of value) {
		const code = char.codePointAt(0) ?? 0;
		if (code <= 0x20 || code === 0xa0 || code === 0x200b) {
			continue;
		}
		result += char;
	}
	return result;
}

function isDangerousUrl(value: string): boolean {
	const normalized = stripUrlNoise(decodeHtmlEntities(value)).toLowerCase();
	return (
		normalized.startsWith("javascript:") ||
		normalized.startsWith("vbscript:") ||
		normalized.startsWith("data:text/html")
	);
}

function isDangerousSrcset(value: string): boolean {
	return value.split(",").some((part) => {
		const url = part.trim().split(/\s+/)[0] ?? "";
		return url.length > 0 && isDangerousUrl(url);
	});
}

export function sanitizeFeedHtml(html: string): string {
	const root = parse(html, { comment: false });
	for (const node of root.querySelectorAll(UNSAFE_SELECTOR)) {
		node.remove();
	}
	for (const node of root.querySelectorAll("*")) {
		for (const [name, value] of Object.entries(node.attributes)) {
			const attr = name.toLowerCase();
			if (attr.startsWith("on") || attr === "style") {
				node.removeAttribute(name);
				continue;
			}
			if (attr === "srcset" && isDangerousSrcset(value)) {
				node.removeAttribute(name);
				continue;
			}
			if (URL_ATTRS.has(attr) && isDangerousUrl(value)) {
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
