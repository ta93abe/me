import type { ElementContent } from "hast";
import type { Code, Heading, Root, RootContent } from "mdast";
import type { Node, Parent } from "unist";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

import { SITE } from "../../config/site.ts";
import { trailingSlashRedirectUrl } from "../../utils/canonical.ts";
import { formatDate, toDatetimeAttr } from "../../utils/date.ts";
import { parseCodeFenceMeta } from "../parser/code-meta.ts";
import type { SlideType } from "../parser/types.ts";
import { isSlideDeckFile, isTypeMarker, TYPE_MARKERS } from "./allowlist.ts";
import {
	isCommentExpression,
	isFlowJsx,
	isMdxJsx,
	type MdxJsxElement,
} from "./mdx-nodes.ts";

/** remark 段で組んだ構造ノード。`data.hName` / `hProperties` で hast の要素になる。 */
type Box = Parent & {
	type: "slideBox";
	data: {
		hName: string;
		hProperties: Record<string, unknown>;
		hChildren?: ElementContent[];
	};
};

type Content = RootContent | Box;

export type SlideSummary = { type: SlideType; clicks: number };

/** `render(entry).remarkPluginFrontmatter` に載せる値。 */
export type SlideDeckRenderInfo = {
	slideCount: number;
	slides: SlideSummary[];
};

type AstroData = { astro?: { frontmatter?: Record<string, unknown> } };

function box(
	tag: string,
	properties: Record<string, unknown>,
	children: Content[] = [],
	hChildren?: ElementContent[],
): Box {
	return {
		type: "slideBox",
		data: {
			hName: tag,
			hProperties: properties,
			...(hChildren ? { hChildren } : {}),
		},
		children: children as RootContent[],
	};
}

function text(value: string): ElementContent {
	return { type: "text", value };
}

function el(
	tagName: string,
	properties: Record<string, unknown>,
	children: ElementContent[],
): ElementContent {
	return {
		type: "element",
		tagName,
		properties: properties as never,
		children,
	};
}

class SlideContext {
	constructor(
		readonly file: VFile,
		readonly index: number,
	) {}

	fail(message: string, node?: Node): never {
		return this.file.fail(`スライド ${this.index + 1}: ${message}`, node);
	}
}

function sourceSlice(file: VFile, nodes: Node[]): string {
	const start = nodes[0]?.position?.start.offset;
	const end = nodes.at(-1)?.position?.end.offset;
	if (start === undefined || end === undefined) {
		return "";
	}
	return String(file.value).slice(start, end);
}

function isBlank(node: Node): boolean {
	return isCommentExpression(node);
}

/** 行頭 `---`（thematicBreak）で分ける。コードフェンスの中は code ノードなので分割しない。 */
function splitAtBreaks(children: RootContent[]): RootContent[][] {
	const chunks: RootContent[][] = [[]];
	for (const node of children) {
		if (node.type === "thematicBreak") {
			chunks.push([]);
			continue;
		}
		if (isBlank(node)) {
			continue;
		}
		chunks.at(-1)!.push(node);
	}
	return chunks.filter((chunk) => chunk.length > 0);
}

function splitAt(nodes: Content[], name: string): Content[][] {
	const parts: Content[][] = [[]];
	for (const node of nodes) {
		if (isFlowJsx(node, name)) {
			parts.push([]);
			continue;
		}
		parts.at(-1)!.push(node);
	}
	return parts;
}

function highlightClicks(nodes: Content[]): number {
	let max = 0;
	for (const node of nodes) {
		visit(node as Node, "code", (code: Code) => {
			const steps = parseCodeFenceMeta(code.meta ?? "").steps;
			if (steps.length > 0) {
				max = Math.max(max, steps.length - 1);
			}
		});
	}
	return max;
}

/** `<Clicks>` の中の最初のリストの項目を 1 クリックずつ出す。 */
function applyListClicks(
	ctx: SlideContext,
	element: MdxJsxElement,
	start: number,
): { nodes: Content[]; extra: number } {
	const children = element.children as Content[];
	const list = children.find((child) => child.type === "list");
	if (!list || list.type !== "list") {
		return ctx.fail("<Clicks> の中にリストがありません", element);
	}
	let extra = 0;
	for (const item of list.children) {
		extra += 1;
		item.data = {
			...item.data,
			hProperties: {
				...item.data?.hProperties,
				className: ["fragment"],
				dataClick: String(start + extra),
			},
		};
	}
	if (extra === 0) {
		return ctx.fail("<Clicks> のリストに項目がありません", element);
	}
	return { nodes: children, extra };
}

/** `<Click />` で区切り、2 つ目以降を fragment にする（旧 `<!-- click -->` と同じ）。 */
function materialize(
	ctx: SlideContext,
	nodes: Content[],
): { nodes: Content[]; clicks: number } {
	const parts = splitAt(nodes, "Click");
	const out: Content[] = [];
	let clicks = 0;

	for (const [index, part] of parts.entries()) {
		if (part.length === 0) {
			ctx.fail("<Click /> のあいだが空です");
		}
		let partNodes: Content[] = [];
		if (index > 0) {
			clicks += 1;
		}
		const fragmentClick = clicks;
		for (const node of part) {
			if (isFlowJsx(node, "Clicks")) {
				const applied = applyListClicks(ctx, node, clicks);
				partNodes.push(...applied.nodes);
				clicks += applied.extra;
				continue;
			}
			partNodes.push(node);
		}
		if (index > 0) {
			partNodes = [
				box(
					"div",
					{ className: ["fragment"], dataClick: String(fragmentClick) },
					partNodes,
				),
			];
		}
		out.push(...partNodes);
	}

	return { nodes: out, clicks: Math.max(clicks, highlightClicks(out)) };
}

function rewriteMedia(nodes: Content[], slug: string): void {
	for (const node of nodes) {
		visit(node as Node, (child: Node) => {
			if (child.type === "image") {
				const image = child as unknown as { url: string };
				if (!image.url || /^(https?:|data:|\/)/i.test(image.url)) {
					return;
				}
				const cleaned = image.url.replace(/^\.\//, "");
				image.url = cleaned.startsWith(`${slug}/`)
					? `/slides/media/${cleaned}`
					: `/slides/media/${slug}/${cleaned}`;
			}
			if (child.type === "link") {
				const link = child as unknown as { url: string };
				if (
					!link.url ||
					!link.url.startsWith("/") ||
					link.url.startsWith("//")
				) {
					return;
				}
				const location = trailingSlashRedirectUrl(
					new URL(link.url, "https://ta93abe.com"),
				);
				if (location) {
					link.url = `${location.pathname}${location.search}${location.hash}`;
				}
			}
		});
	}
}

/** 表紙以外の見出しを 1 段下げ、元のレベルを `.slide-hN` に残す（旧 heading-outline と同じ）。 */
function shiftHeadings(nodes: Content[], shift: number): void {
	if (shift <= 0) {
		return;
	}
	for (const node of nodes) {
		visit(node as Node, "heading", (heading: Heading) => {
			const original = heading.depth;
			heading.depth = Math.min(6, original + shift) as Heading["depth"];
			heading.data = {
				...heading.data,
				hProperties: {
					...heading.data?.hProperties,
					className: [`slide-h${original}`],
				},
			};
		});
	}
}

function dateString(value: unknown): string {
	if (value instanceof Date) {
		return value.toISOString().slice(0, 10);
	}
	return String(value ?? "");
}

function coverMetaChildren(
	frontmatter: Record<string, unknown>,
): ElementContent[] {
	const date = dateString(frontmatter.date);
	const sep = el(
		"span",
		{ className: ["slide-cover-meta__sep"], ariaHidden: "true" },
		[text("·")],
	);
	const details = el("p", { className: ["slide-cover-meta__details"] }, [
		el("time", { dateTime: toDatetimeAttr(date) }, [text(formatDate(date))]),
		sep,
		el("span", {}, [text(SITE.author)]),
		structuredClone(sep),
		el("span", {}, [text(SITE.twitter)]),
	]);
	const event =
		typeof frontmatter.event === "string" && frontmatter.event.trim() !== ""
			? [
					el("p", { className: ["slide-cover-meta__event"] }, [
						text(frontmatter.event.trim()),
					]),
				]
			: [];
	return [...event, details];
}

type ParsedSlide = {
	type: SlideType;
	body: Content[];
	notes: string;
	clicks: number;
};

function parseSlide(ctx: SlideContext, chunk: RootContent[]): ParsedSlide {
	let rest: Content[] = [...chunk];
	let type: SlideType = "body";

	const first = rest[0];
	if (first && isFlowJsx(first) && isTypeMarker(first.name)) {
		type = TYPE_MARKERS[first.name];
		rest = rest.slice(1);
	}
	for (const node of rest) {
		if (isMdxJsx(node as Node) && isTypeMarker((node as MdxJsxElement).name)) {
			ctx.fail(
				"型マーカーはスライドの先頭に 1 つだけ置いてください",
				node as Node,
			);
		}
	}

	const notes: string[] = [];
	rest = rest.filter((node) => {
		if (!isFlowJsx(node, "Notes")) {
			return true;
		}
		notes.push(sourceSlice(ctx.file, node.children).trim());
		return false;
	});

	const panes = splitAt(rest, "Column");
	if (type === "split") {
		if (panes.length !== 2) {
			ctx.fail("split は <Column /> を 1 つだけ使って左右を分けます");
		}
		const left = materialize(ctx, panes[0]);
		const right = materialize(ctx, panes[1]);
		return {
			type,
			body: [
				box("div", { className: ["split-pane"] }, left.nodes),
				box("div", { className: ["split-pane"] }, right.nodes),
			],
			notes: notes.join("\n\n").trim(),
			clicks: Math.max(left.clicks, right.clicks),
		};
	}
	if (panes.length > 1) {
		ctx.fail("<Column /> は <Split /> のスライドだけで使います");
	}
	if (rest.length === 0) {
		ctx.fail("本文が空です");
	}
	const rendered = materialize(ctx, rest);
	return {
		type,
		body: rendered.nodes,
		notes: notes.join("\n\n").trim(),
		clicks: rendered.clicks,
	};
}

/**
 * デッキ MDX を `<section class="slide">` の列に組み立てる（ADR-0002）。
 * 出力 DOM は旧 Markdown parser + `renderSlideSections` と同じにし、プレイヤー・print・PDF を変えない。
 * プレイヤー用に出す（先頭だけ is-active、残りは hidden inert）。print は `PrintSlides.astro` が開く。
 */
export function remarkSlides() {
	return (tree: Root, file: VFile) => {
		if (!isSlideDeckFile(file.path)) {
			return;
		}
		const data = file.data as AstroData;
		const frontmatter = data.astro?.frontmatter ?? {};
		const slug = String(frontmatter.slug ?? "");

		const chunks = splitAtBreaks(tree.children);
		if (chunks.length === 0) {
			file.fail("スライドが 1 枚もありません");
		}
		const slides = chunks.map((chunk, index) =>
			parseSlide(new SlideContext(file, index), chunk),
		);
		const firstCover = slides.findIndex((slide) => slide.type === "cover");
		const total = slides.length;

		tree.children = slides.map((slide, index) => {
			rewriteMedia(slide.body, slug);
			const keepLevel =
				firstCover === index || (firstCover === -1 && index === 0);
			shiftHeadings(slide.body, keepLevel ? 0 : 1);

			// 最初の表紙だけ、frontmatter から組んだ日付・登壇者・イベントを載せる
			const body: Content[] =
				slide.type === "cover" && firstCover === index
					? [
							box(
								"header",
								{ className: ["slide-cover-meta"] },
								[],
								coverMetaChildren(frontmatter),
							),
							box("div", { className: ["slide-cover-main"] }, slide.body),
						]
					: slide.body;

			const sectionChildren: Content[] = [
				box("div", { className: ["slide-body"] }, body),
			];
			if (slide.notes) {
				sectionChildren.push(
					box("div", { className: ["speaker-notes"] }, [], [text(slide.notes)]),
				);
			}
			const first = index === 0;
			return box(
				"section",
				{
					className: first ? ["slide", "is-active"] : ["slide"],
					dataType: slide.type,
					dataIndex: String(index + 1),
					dataClicks: String(slide.clicks),
					id: `s${index + 1}`,
					ariaLabel: `${index + 1} / ${total}`,
					...(first ? {} : { hidden: true, inert: true }),
				},
				sectionChildren,
			) as RootContent;
		});

		const info: SlideDeckRenderInfo = {
			slideCount: total,
			slides: slides.map((slide) => ({
				type: slide.type,
				clicks: slide.clicks,
			})),
		};
		data.astro = data.astro ?? {};
		data.astro.frontmatter = { ...frontmatter, ...info };
	};
}
