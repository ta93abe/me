import { describe, expect, it } from "vitest";

import { parseDeck } from "@/slides/parser/parse-deck";
import { splitSlides } from "@/slides/parser/split-slides";
import { DeckError } from "@/slides/parser/types";

const header = `---
title: サンプル
date: 2026-09-06
description: 説明
slug: sample
---
`;

async function parse(body: string, filename = "sample.md") {
	return parseDeck(`${header}\n${body}`, { filename });
}

describe("splitSlides", () => {
	it("does not split inside fenced code", () => {
		const chunks = splitSlides(
			`# one\n\n\`\`\`md\n---\nnot a slide\n\`\`\`\n\n---\n\n# two`,
		);
		expect(chunks).toHaveLength(2);
		expect(chunks[0]).toContain("not a slide");
	});
});

describe("parseDeck", () => {
	it("defaults unspecified slides to body", async () => {
		const deck = await parse("# 本文\n\n段落");
		expect(deck.slides).toHaveLength(1);
		expect(deck.slides[0]?.type).toBe("body");
		expect(deck.slides[0]?.html).toContain("<h1>");
	});

	it("reads type comments and notes", async () => {
		const deck = await parse(
			`<!-- type: cover -->\n\n# 表紙\n\n<!-- notes\n話す\n-->`,
		);
		expect(deck.slides[0]?.type).toBe("cover");
		expect(deck.slides[0]?.notes.trim()).toBe("話す");
	});

	it("splits columns", async () => {
		const deck = await parse(
			`<!-- type: split -->\n\n## 左\n\n<!-- column -->\n\n## 右`,
		);
		expect(deck.slides[0]?.type).toBe("split");
		expect(deck.slides[0]?.columns).toHaveLength(2);
		expect(deck.slides[0]?.html).toContain("split-pane");
	});

	it("defaults theme to dark", async () => {
		const deck = await parse("# 本文\n\n```ts\nconst n = 1;\n```");
		expect(deck.frontmatter.theme).toBe("dark");
		expect(deck.slides[0]?.html).toContain("min-dark");
		expect(deck.slides[0]?.html).toContain("shiki-fg-");
		expect(deck.slides[0]?.html).not.toMatch(/\sstyle=/i);
		expect(deck.slides[0]?.html).not.toMatch(/class="[^"]*"[^>]*\sclass="/);
	});

	it("accepts theme light", async () => {
		const deck = await parseDeck(
			`---\ntitle: t\ndate: 2026-09-06\ndescription: d\nslug: sample\ntheme: light\n---\n\n# x\n\n\`\`\`ts\nconst n = 1;\n\`\`\`\n`,
			{ filename: "sample.md" },
		);
		expect(deck.frontmatter.theme).toBe("light");
		expect(deck.slides[0]?.html).toContain("min-light");
		expect(deck.slides[0]?.html).not.toMatch(/\sstyle=/i);
	});

	it("rejects unknown theme values", async () => {
		await expect(
			parseDeck(
				`---\ntitle: t\ndate: 2026-09-06\ndescription: d\nslug: sample\ntheme: seriph\n---\n\n# x`,
				{ filename: "sample.md" },
			),
		).rejects.toBeInstanceOf(DeckError);
	});

	it("rejects look keys other than theme", async () => {
		await expect(
			parseDeck(
				`---\ntitle: t\ndate: 2026-09-06\ndescription: d\nslug: sample\nlayout: cover\n---\n\n# x`,
				{ filename: "sample.md" },
			),
		).rejects.toBeInstanceOf(DeckError);
	});

	it("rejects MDX import", async () => {
		await expect(parse("import X from './x'\n\n# hi")).rejects.toMatchObject({
			name: "DeckError",
		});
	});

	it("rejects JSX components", async () => {
		await expect(parse("<Counter />\n")).rejects.toBeInstanceOf(DeckError);
	});

	it("rejects unknown types", async () => {
		await expect(parse("<!-- type: hero -->\n\n# x")).rejects.toBeInstanceOf(
			DeckError,
		);
	});

	it("parses GFM tables", async () => {
		const deck = await parse("| a | b |\n| --- | --- |\n| 1 | 2 |");
		expect(deck.slides[0]?.html).toContain("<table>");
	});

	it("rewrites relative images under /slides/media", async () => {
		const deck = await parse("![枠](./frame.svg)");
		expect(deck.slides[0]?.html).toContain("/slides/media/sample/frame.svg");
	});

	it("defaults clicks to 0", async () => {
		const deck = await parse("# 本文\n\n段落");
		expect(deck.slides[0]?.clicks).toBe(0);
	});

	it("wraps click fragments", async () => {
		const deck = await parse("# 先\n\n見える\n\n<!-- click -->\n\n隠す");
		expect(deck.slides[0]?.clicks).toBe(1);
		expect(deck.slides[0]?.html).toContain('data-click="1"');
		expect(deck.slides[0]?.html).toContain('class="fragment"');
	});

	it("turns lists into click steps", async () => {
		const deck = await parse("# 要点\n\n<!-- clicks -->\n\n- 一\n- 二\n- 三");
		expect(deck.slides[0]?.clicks).toBe(3);
		expect(deck.slides[0]?.html.match(/data-click="/g)?.length).toBe(3);
	});

	it("highlights code lines from fence meta", async () => {
		const deck = await parse("```ts {2}\nconst a = 1;\nconst b = 2;\n```");
		expect(deck.slides[0]?.html).toContain("line-highlighted");
		expect(deck.slides[0]?.html).toContain("has-highlight");
	});

	it("treats piped line groups as click highlights", async () => {
		const deck = await parse("```ts {1|2}\nconst a = 1;\nconst b = 2;\n```");
		expect(deck.slides[0]?.clicks).toBe(1);
		expect(deck.slides[0]?.html).toContain("data-click-highlight");
	});

	it("renders katex math", async () => {
		const deck = await parse("式は $e=mc^2$。");
		expect(deck.slides[0]?.html).toContain("katex");
		expect(deck.slides[0]?.html).toMatch(/strut[^>]*style="/);
	});

	it("keeps katex strut styles while stripping shiki styles", async () => {
		const deck = await parse("式は $e=mc^2$。\n\n```ts\nconst n = 1;\n```");
		const html = deck.slides[0]?.html ?? "";
		expect(html).toMatch(/strut[^>]*style="/);
		expect(html).not.toMatch(/<pre[^>]*style=/i);
		expect(html).toContain("shiki-fg-");
	});

	it("accepts center and end types", async () => {
		const deck = await parse(
			"<!-- type: center -->\n\n# 中央\n\n---\n\n<!-- type: end -->\n\n# おわり",
		);
		expect(deck.slides.map((slide) => slide.type)).toEqual(["center", "end"]);
	});

	it("rejects empty click gaps", async () => {
		await expect(
			parse("# x\n\n<!-- click -->\n\n<!-- click -->\n\nあと"),
		).rejects.toBeInstanceOf(DeckError);
	});
});
