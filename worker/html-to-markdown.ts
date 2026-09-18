import {
	HTMLElement,
	type Node,
	NodeType,
	parse,
	TextNode,
} from "node-html-parser";

export type AgentMarkdown = {
	markdown: string;
	markdownTokens: number;
	originalTokens: number;
};

const STRIP_TAGS = new Set([
	"script",
	"style",
	"noscript",
	"template",
	"svg",
	"iframe",
	"canvas",
	"button",
	"form",
	"input",
	"select",
	"textarea",
	"video",
	"audio",
]);

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

export function estimateTokenCount(value: string): number {
	return Math.ceil(value.length / 4);
}

export function htmlToAgentMarkdown(html: string): AgentMarkdown {
	const document = parse(html, { comment: false });
	const frontmatter = extractFrontmatter(document);
	const jsonLd = extractJsonLd(document);
	const body = convertContent(contentRoot(document));
	const parts = [frontmatter, body, jsonLd].filter(Boolean);
	const markdown = `${parts.join("\n\n")}\n`;
	return {
		markdown,
		markdownTokens: estimateTokenCount(markdown),
		originalTokens: estimateTokenCount(html),
	};
}

function isElement(node: Node): node is HTMLElement {
	return node.nodeType === NodeType.ELEMENT_NODE;
}

function isText(node: Node): node is TextNode {
	return node.nodeType === NodeType.TEXT_NODE;
}

function tagName(node: HTMLElement): string {
	return node.rawTagName.toLowerCase();
}

function contentRoot(document: HTMLElement): HTMLElement {
	return (
		document.querySelector("#main-content") ??
		document.querySelector("main") ??
		document.querySelector("article") ??
		document.querySelector("body") ??
		document
	);
}

function metaContent(root: HTMLElement, selector: string): string {
	return root.querySelector(selector)?.getAttribute("content")?.trim() ?? "";
}

function extractFrontmatter(root: HTMLElement): string {
	const title =
		root.querySelector("title")?.textContent.trim() ||
		metaContent(root, 'meta[property="og:title"]') ||
		metaContent(root, 'meta[name="title"]');
	const description =
		metaContent(root, 'meta[name="description"]') ||
		metaContent(root, 'meta[property="og:description"]');
	const image = metaContent(root, 'meta[property="og:image"]');
	const fields: Array<[string, string]> = [];
	if (title) {
		fields.push(["title", title]);
	}
	if (description) {
		fields.push(["description", description]);
	}
	if (image) {
		fields.push(["image", image]);
	}
	if (fields.length === 0) {
		return "";
	}
	const lines = fields.map(([name, value]) => `${name}: ${yamlScalar(value)}`);
	return `---\n${lines.join("\n")}\n---`;
}

function yamlScalar(value: string): string {
	if (value === "") {
		return '""';
	}
	if (/^[A-Za-z0-9][A-Za-z0-9 .,_/-]*$/.test(value) && !value.includes(":")) {
		return value;
	}
	return JSON.stringify(value);
}

function extractJsonLd(root: HTMLElement): string {
	const values: unknown[] = [];
	for (const script of root.querySelectorAll(
		'script[type="application/ld+json"]',
	)) {
		const raw = script.textContent.trim();
		if (!raw) {
			continue;
		}
		try {
			values.push(JSON.parse(raw) as unknown);
		} catch {
			values.push(raw);
		}
	}
	if (values.length === 0) {
		return "";
	}
	const lines = values.map((value) =>
		typeof value === "string" ? value : JSON.stringify(value),
	);
	return `\`\`\`json\n${lines.join("\n")}\n\`\`\``;
}

function convertContent(root: HTMLElement): string {
	return normalizeMarkdown(
		root.childNodes.map((node) => convertBlock(node)).join(""),
	);
}

function normalizeMarkdown(value: string): string {
	return value
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function convertBlock(node: Node): string {
	if (isText(node)) {
		const text = node.text.replace(/\s+/g, " ").trim();
		return text ? `${text}\n\n` : "";
	}
	if (!isElement(node)) {
		return "";
	}
	const tag = tagName(node);
	if (STRIP_TAGS.has(tag)) {
		return "";
	}
	if (HEADING_TAGS.has(tag)) {
		const level = Number(tag.slice(1));
		const text = inlineChildren(node).trim();
		return text ? `${"#".repeat(level)} ${text}\n\n` : "";
	}
	if (tag === "p" || tag === "figcaption") {
		const text = inlineChildren(node).trim();
		return text ? `${text}\n\n` : "";
	}
	if (tag === "pre") {
		return convertPre(node);
	}
	if (tag === "blockquote") {
		const inner = normalizeMarkdown(
			node.childNodes.map((child) => convertBlock(child)).join(""),
		);
		if (!inner) {
			return "";
		}
		return `${inner
			.split("\n")
			.map((line) => (line ? `> ${line}` : ">"))
			.join("\n")}\n\n`;
	}
	if (tag === "ul" || tag === "ol") {
		return convertList(node, tag);
	}
	if (tag === "table") {
		return convertTable(node);
	}
	if (tag === "hr") {
		return "---\n\n";
	}
	if (tag === "br") {
		return "\n";
	}
	if (tag === "a" || tag === "img" || tag === "code" || tag === "span") {
		const text = convertInline(node).trim();
		return text ? `${text}\n\n` : "";
	}
	return node.childNodes.map((child) => convertBlock(child)).join("");
}

function convertPre(node: HTMLElement): string {
	const inner = node.innerHTML;
	// node-html-parser keeps <pre> children as a single text node, so re-parse.
	const fragment = /<code[\s>]/i.test(inner)
		? parse(`<div>${inner}</div>`)
		: node;
	const code = fragment.querySelector("code");
	const source = code ?? fragment;
	const className = `${node.getAttribute("class") ?? ""} ${code?.getAttribute("class") ?? ""}`;
	const language = className.match(/language-([a-z0-9_+-]+)/i)?.[1] ?? "";
	const text = source.textContent.replace(/\n$/, "");
	return `\`\`\`${language}\n${text}\n\`\`\`\n\n`;
}

function convertList(node: HTMLElement, type: "ul" | "ol"): string {
	const items = node.childNodes
		.filter(isElement)
		.filter((child) => tagName(child) === "li");
	if (items.length === 0) {
		return "";
	}
	const lines = items.map((item, index) => {
		const marker = type === "ol" ? `${index + 1}.` : "-";
		return convertListItem(item, marker);
	});
	return `${lines.join("\n")}\n\n`;
}

function convertListItem(item: HTMLElement, marker: string): string {
	const nested: string[] = [];
	const parts: string[] = [];
	for (const child of item.childNodes) {
		if (
			isElement(child) &&
			(tagName(child) === "ul" || tagName(child) === "ol")
		) {
			nested.push(
				normalizeMarkdown(convertList(child, tagName(child) as "ul" | "ol")),
			);
			continue;
		}
		parts.push(convertInline(child));
	}
	const text = parts.join("").replace(/\s+/g, " ").trim();
	const nestedBlock = nested
		.join("\n")
		.split("\n")
		.filter(Boolean)
		.map((line) => `  ${line}`)
		.join("\n");
	if (!text && !nestedBlock) {
		return `${marker}`;
	}
	if (!nestedBlock) {
		return `${marker} ${text}`;
	}
	return text
		? `${marker} ${text}\n${nestedBlock}`
		: `${marker}\n${nestedBlock}`;
}

function convertTable(node: HTMLElement): string {
	const rows = node.querySelectorAll("tr");
	if (rows.length === 0) {
		return "";
	}
	const cells = rows.map((row) =>
		row
			.querySelectorAll("th, td")
			.map((cell) => inlineChildren(cell).trim().replace(/\|/g, "\\|")),
	);
	const width = Math.max(...cells.map((row) => row.length), 0);
	if (width === 0) {
		return "";
	}
	const padded = cells.map((row) => {
		const next = [...row];
		while (next.length < width) {
			next.push("");
		}
		return next;
	});
	const header = padded[0] ?? [];
	const body = padded.slice(1);
	const headerLine = `| ${header.join(" | ")} |`;
	const divider = `| ${header.map(() => "---").join(" | ")} |`;
	const bodyLines = body.map((row) => `| ${row.join(" | ")} |`);
	return `${[headerLine, divider, ...bodyLines].join("\n")}\n\n`;
}

function convertInline(node: Node): string {
	if (isText(node)) {
		return node.text.replace(/\s+/g, " ");
	}
	if (!isElement(node)) {
		return "";
	}
	const tag = tagName(node);
	if (STRIP_TAGS.has(tag)) {
		return "";
	}
	if (tag === "br") {
		return "\n";
	}
	if (tag === "strong" || tag === "b") {
		return wrapInline("**", inlineChildren(node));
	}
	if (tag === "em" || tag === "i") {
		return wrapInline("*", inlineChildren(node));
	}
	if (tag === "del" || tag === "s") {
		return wrapInline("~~", inlineChildren(node));
	}
	if (tag === "code") {
		return wrapCode(node.textContent);
	}
	if (tag === "a") {
		const href = node.getAttribute("href") ?? "";
		const text =
			inlineChildren(node).trim() ||
			node.getAttribute("aria-label")?.trim() ||
			href;
		if (!href) {
			return text;
		}
		return `[${text}](${href})`;
	}
	if (tag === "img") {
		const src = node.getAttribute("src") ?? "";
		if (!src) {
			return "";
		}
		return `![${node.getAttribute("alt") ?? ""}](${src})`;
	}
	return inlineChildren(node);
}

function inlineChildren(node: HTMLElement): string {
	return node.childNodes.map((child) => convertInline(child)).join("");
}

function wrapInline(delimiter: string, value: string): string {
	const trimmed = value.trim();
	return trimmed ? `${delimiter}${trimmed}${delimiter}` : "";
}

function wrapCode(value: string): string {
	if (!value) {
		return "";
	}
	const longest = value.match(/`+/g)?.reduce((max, ticks) => {
		return ticks.length > max ? ticks.length : max;
	}, 0);
	const ticks = "`".repeat((longest ?? 0) + 1);
	return `${ticks}${value}${ticks}`;
}
