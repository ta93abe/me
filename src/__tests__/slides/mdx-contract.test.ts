import { describe, expect, it } from "vitest";

import { compileDeck, deck, slideHtml } from "./helpers/compile-deck";

describe("deck MDX contract (ADR-0002)", () => {
	it("splits at --- and defaults to body", async () => {
		const { html, info } = await compileDeck(deck("# One\n\n---\n\n# Two"));
		expect(info.slideCount).toBe(2);
		expect(info.slides.map((slide) => slide.type)).toEqual(["body", "body"]);
		expect(slideHtml(html, 1)).toContain('class="slide is-active"');
		expect(slideHtml(html, 1)).toContain('aria-label="1 / 2"');
		expect(slideHtml(html, 2)).toMatch(/<section class="slide"[^>]*hidden/);
		expect(slideHtml(html, 2)).toContain("inert");
	});

	it("does not split inside fenced code", async () => {
		const { info } = await compileDeck(
			deck("<Code />\n\n```ts\nconst a = 1;\n---\nconst b = 2;\n```"),
		);
		expect(info.slideCount).toBe(1);
	});

	it("reads the leading type marker and notes", async () => {
		const { html, info } = await compileDeck(
			deck("<Quote />\n\n<Notes>\n\n短く止める。\n\n</Notes>\n\n> 引用"),
		);
		expect(info.slides[0].type).toBe("quote");
		expect(html).toContain('data-type="quote"');
		expect(html).toContain('<div class="speaker-notes">短く止める。</div>');
		expect(html).not.toContain("<Notes");
	});

	it("splits columns on <Split />", async () => {
		const { html } = await compileDeck(
			deck("<Split />\n\n## 左\n\n<Column />\n\n## 右"),
		);
		expect(html).toContain(
			'<div class="slide-body"><div class="split-pane"><h2>左</h2></div><div class="split-pane"><h2>右</h2></div></div>',
		);
	});

	it("reveals parts after <Click /> and list items in <Clicks>", async () => {
		const { html, info } = await compileDeck(
			deck("最初\n\n<Click />\n\n次\n\n<Clicks>\n\n- a\n- b\n\n</Clicks>"),
		);
		expect(info.slides[0].clicks).toBe(3);
		expect(html).toContain('<div class="fragment" data-click="1">');
		expect(html).toContain('<li class="fragment" data-click="2">a</li>');
		expect(html).toContain('<li class="fragment" data-click="3">b</li>');
	});

	it("counts code highlight steps as clicks and keeps classes only", async () => {
		const { html, info } = await compileDeck(
			deck(
				"<Code />\n\n```ts {1|2|3}\nconst a = 1;\nconst b = 2;\nconst c = 3;\n```",
			),
		);
		expect(info.slides[0].clicks).toBe(2);
		expect(html).toContain("has-click-highlight");
		expect(html).toContain('data-click-highlight="2"');
		expect(html).toContain("min-dark");
		expect(html).not.toMatch(/<(?:pre|span)[^>]*\sstyle=/);
	});

	it("follows theme: light for code", async () => {
		const { html } = await compileDeck(
			deck("<Code />\n\n```ts\nconst a = 1;\n```", "theme: light"),
		);
		expect(html).toContain("min-light");
	});

	it("keeps the first cover at h1, demotes later headings, and adds cover meta", async () => {
		const { html } = await compileDeck(
			deck("<Cover />\n\n# 表紙\n\n---\n\n# 本文", "event: 勉強会"),
		);
		const cover = slideHtml(html, 1);
		expect(cover).toContain('<header class="slide-cover-meta">');
		expect(cover).toContain('<p class="slide-cover-meta__event">勉強会</p>');
		expect(cover).toContain('<time datetime="2026-09-06');
		expect(cover).toContain(
			'<div class="slide-cover-main"><h1>表紙</h1></div>',
		);
		expect(slideHtml(html, 2)).toContain('<h2 class="slide-h1">本文</h2>');
	});

	it("keeps the first slide as h1 when the deck has no cover", async () => {
		const { html } = await compileDeck(deck("# 一枚目\n\n---\n\n# 二枚目"));
		expect(slideHtml(html, 1)).toContain("<h1>一枚目</h1>");
		expect(slideHtml(html, 2)).toContain('<h2 class="slide-h1">二枚目</h2>');
	});

	it("rewrites relative images and bare internal links", async () => {
		const { html } = await compileDeck(
			deck("![図](./frame.svg)\n\n[前の回](/slides/demo)"),
		);
		expect(html).toContain('src="/slides/media/demo/frame.svg"');
		expect(html).toContain('href="/slides/demo/"');
	});

	it("renders math with KaTeX", async () => {
		const { html } = await compileDeck(deck("インライン $e^{i\\pi}+1=0$"));
		expect(html).toContain("katex");
	});

	it("allows MDX comments", async () => {
		const { info } = await compileDeck(deck("{/* メモ */}\n\n# 本文"));
		expect(info.slideCount).toBe(1);
	});
});

describe("deck MDX contract violations fail the build", () => {
	const cases: Array<[string, string, RegExp]> = [
		["import", 'import X from "x";\n\n# a', /import \/ export/],
		["export", "export const a = 1;\n\n# a", /import \/ export/],
		["expression", "値は {1 + 1}", /式/],
		["unknown component", "<Tweet />", /<Tweet> は使えません/],
		["raw html", '<div class="x">a</div>', /<div> は使えません/],
		["style element", "<style>{`a{}`}</style>", /<style> は使えません|式/],
		["script element", "<script>alert(1)</script>", /<script> は使えません/],
		["attribute", '<Cover style="color: red" />\n\n# a', /属性/],
		["inline marker", "文中に <Click /> を置く", /行頭に単独/],
		["second type marker", "<Cover />\n\n# a\n\n<End />", /先頭に 1 つだけ/],
		[
			"column outside split",
			"# a\n\n<Column />\n\nb",
			/<Split \/> のスライドだけ/,
		],
		["split without column", "<Split />\n\n# a", /<Column \/> を 1 つだけ/],
		["empty click part", "a\n\n<Click />\n\n<Click />\n\nb", /あいだが空/],
		[
			"clicks without list",
			"<Clicks>\n\n本文\n\n</Clicks>",
			/リストがありません/,
		],
	];

	for (const [name, body, message] of cases) {
		it(`rejects ${name}`, async () => {
			await expect(compileDeck(deck(body))).rejects.toThrow(message);
		});
	}
});
