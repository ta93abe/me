import {
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
	mkdir,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
	baselineChars,
	collectNonLatinChars,
	contentHash,
	htmlTextForSubset,
	japaneseFontUrls,
	rehashedCssName,
	rewriteFontUrls,
	subsetFontUrl,
	subsetJapaneseWebfonts,
	subsetText,
} from "@/utils/webfont-subset";

describe("webfont subset helpers (TA-2173)", () => {
	it("collects only characters outside Latin-1", () => {
		const chars = collectNonLatinChars(["abc é 日本語。", "語🍚"]);
		expect([...chars].sort()).toEqual(["。", "日", "本", "語", "🍚"].sort());
	});

	it("decodes character references and drops style blocks", () => {
		const text = htmlTextForSubset(
			'<style>.a::before{content:"禁"}</style><p>&#x5922;&#24184;&amp;</p>',
		);
		expect(text).not.toContain("禁");
		expect(text).toContain("夢");
		expect(text).toContain("幸");
		expect(text).toContain("&");
	});

	it("always includes kana and Japanese punctuation", () => {
		const base = baselineChars();
		for (const char of ["あ", "ン", "「", "」", "。", "ー", "Ａ"]) {
			expect(base).toContain(char);
		}
	});

	it("orders subset text deterministically", () => {
		expect(subsetText(["語", "あ", "語", "日"])).toBe("あ日語");
	});

	it("finds and renames only japanese woff2 files", () => {
		const css =
			'src:url(/_astro/noto-serif-jp-japanese-400-normal.BeLL7eq-.woff2) format("woff2");' +
			"src:url(/_astro/noto-serif-jp-latin-400-normal.D0PsRsEs.woff2);" +
			"src:url(/_astro/shippori-mincho-japanese-700-normal.BBB_5iGT.woff)";
		expect(japaneseFontUrls(css)).toEqual([
			"/_astro/noto-serif-jp-japanese-400-normal.BeLL7eq-.woff2",
		]);
		const renamed = subsetFontUrl(
			"/_astro/noto-serif-jp-japanese-400-normal.BeLL7eq-.woff2",
			"abcd1234",
		);
		expect(renamed).toBe(
			"/_astro/noto-serif-jp-japanese-400-normal.abcd1234.woff2",
		);
		const rewritten = rewriteFontUrls(
			css,
			new Map([
				["/_astro/noto-serif-jp-japanese-400-normal.BeLL7eq-.woff2", renamed],
			]),
		);
		expect(rewritten).toContain(renamed);
		expect(rewritten).toContain("noto-serif-jp-latin-400-normal.D0PsRsEs");
		expect(() => subsetFontUrl("/_astro/inter-latin-400.woff2", "x")).toThrow();
	});

	it("renames hashed CSS assets", () => {
		expect(rehashedCssName("Layout.DCj2o1X9.css", "abcd1234")).toBe(
			"Layout.abcd1234.css",
		);
		expect(() => rehashedCssName("Layout.css", "x")).toThrow();
	});

	it("hashes content to a URL-safe 8 character id", () => {
		const hash = contentHash(new Uint8Array([1, 2, 3]));
		expect(hash).toMatch(/^[A-Za-z0-9_-]{8}$/);
		expect(contentHash(new Uint8Array([1, 2, 3]))).toBe(hash);
		expect(contentHash(new Uint8Array([1, 2, 4]))).not.toBe(hash);
	});
});

describe("subsetJapaneseWebfonts", () => {
	let dir: string | undefined;

	afterEach(async () => {
		if (dir) {
			await rm(dir, { recursive: true, force: true });
		}
	});

	async function setup(html: string) {
		dir = await mkdtemp(path.join(tmpdir(), "webfont-subset-"));
		await mkdir(path.join(dir, "_astro"));
		await mkdir(path.join(dir, "blog"));
		await writeFile(path.join(dir, "blog/index.html"), html);
		await writeFile(path.join(dir, "_astro/page.js"), 'el.textContent="検索";');
		await writeFile(
			path.join(dir, "_astro/Layout.OLDCSS01.css"),
			"@font-face{src:url(/_astro/noto-serif-jp-japanese-400-normal.OLDHASH1.woff2)}",
		);
		await writeFile(
			path.join(dir, "_astro/noto-serif-jp-japanese-400-normal.OLDHASH1.woff2"),
			"full-font",
		);
		return dir;
	}

	it("subsets with page and script text, writes a new hashed file and rewrites CSS", async () => {
		const clientDir = await setup(
			'<link rel="stylesheet" href="/_astro/Layout.OLDCSS01.css"><p>夢の話</p>',
		);
		const serverDir = path.join(
			clientDir,
			"..",
			`${path.basename(clientDir)}-server`,
		);
		await mkdir(serverDir);
		await writeFile(
			path.join(serverDir, "entry.mjs"),
			'const assets=["/_astro/Layout.OLDCSS01.css","/_astro/noto-serif-jp-japanese-400-normal.OLDHASH1.woff2"];',
		);
		const seen: string[] = [];
		const result = await subsetJapaneseWebfonts(
			clientDir,
			async (_font, text) => {
				seen.push(text);
				return new TextEncoder().encode(`subset:${text.length}`);
			},
			[serverDir],
		);

		expect(seen).toHaveLength(1);
		for (const char of ["夢", "話", "検", "索", "あ"]) {
			expect(seen[0]).toContain(char);
		}
		expect(result.fonts).toHaveLength(1);
		const [font] = result.fonts;
		expect(font?.newUrl).not.toBe(font?.url);

		const files = await readdir(path.join(clientDir, "_astro"));
		expect(files).not.toContain(
			"noto-serif-jp-japanese-400-normal.OLDHASH1.woff2",
		);
		expect(files).toContain(path.basename(font?.newUrl ?? ""));
		// フォント URL が変わった CSS は改名する（/_astro/* は immutable キャッシュ）
		expect(files).not.toContain("Layout.OLDCSS01.css");
		expect(result.css).toHaveLength(1);
		const newCss = result.css[0]?.[1] ?? "";
		expect(newCss).toMatch(/^Layout\.[A-Za-z0-9_-]{8}\.css$/);
		const css = await readFile(path.join(clientDir, "_astro", newCss), "utf8");
		expect(css).toContain(font?.newUrl);
		expect(css).not.toContain("OLDHASH1");

		const html = await readFile(
			path.join(clientDir, "blog/index.html"),
			"utf8",
		);
		expect(html).toContain(`/_astro/${newCss}`);
		expect(html).not.toContain("OLDCSS01");
		const entry = await readFile(path.join(serverDir, "entry.mjs"), "utf8");
		expect(entry).toContain(`/_astro/${newCss}`);
		expect(entry).toContain(font?.newUrl);
		expect(entry).not.toContain("OLDHASH1");
		await rm(serverDir, { recursive: true, force: true });
	});

	it("refuses inline references so CSP hashes stay valid", async () => {
		const clientDir = await setup(
			"<style>@font-face{src:url(/_astro/noto-serif-jp-japanese-400-normal.OLDHASH1.woff2)}</style>",
		);
		await expect(
			subsetJapaneseWebfonts(clientDir, async (font) => font),
		).rejects.toThrow(/直接参照/);
	});
});
