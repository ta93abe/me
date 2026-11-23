/**
 * 日本語 webfont をサイトで使う文字だけにサブセット化する（TA-2173）。
 *
 * `@fontsource/<family>/files/*-japanese-*.woff2` はかな・漢字を丸ごと
 * 1 ファイルに入れていて、1 本 1.4MB 前後ある。日本語の本文があるページは
 * これを全部取りに行く。ビルド後の HTML と JS から実際に使う文字を集め、
 * その文字だけの woff2 を新しいハッシュ名で書き出して CSS の参照を差し替える。
 *
 * ソースではなく出力から集めるのは、ツイート埋め込みのようにビルド時に
 * 取ってくる本文があるため。
 */

import { createHash } from "node:crypto";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/** `/_astro/noto-serif-jp-japanese-400-normal.BeLL7eq-.woff2` の形。 */
const JAPANESE_FONT_URL =
	/\/_astro\/([a-z0-9-]+-japanese-\d{3}-normal)\.[A-Za-z0-9_-]+\.woff2/g;

/**
 * 出力に出てこなくても入れておく文字。かな・和文の約物・全角英数は
 * 合わせて数百字と小さく、足りないと 1 字だけ別書体になって目立つ。
 */
const BASELINE_RANGES: readonly [number, number][] = [
	[0x3000, 0x303f], // CJK 記号と句読点
	[0x3040, 0x309f], // ひらがな
	[0x30a0, 0x30ff], // カタカナ
	[0xff01, 0xff5e], // 全角英数・記号
];

/** HTML / JS から、ラテン 1 の外にある文字を集める。 */
export function collectNonLatinChars(
	sources: Iterable<string>,
	into: Set<string> = new Set(),
): Set<string> {
	for (const source of sources) {
		for (const char of source) {
			if ((char.codePointAt(0) ?? 0) > 0xff) {
				into.add(char);
			}
		}
	}
	return into;
}

const NAMED_ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
};

/**
 * HTML から文字を取る前の下ごしらえ。数値文字参照を戻し、
 * style の中身は捨てる（script は JSON-LD や島の props に本文が入るので残す）。
 */
export function htmlTextForSubset(html: string): string {
	return html
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
			safeFromCodePoint(Number.parseInt(hex, 16)),
		)
		.replace(/&#(\d+);/g, (_, dec: string) =>
			safeFromCodePoint(Number.parseInt(dec, 10)),
		)
		.replace(/&([a-z]+);/gi, (match, name: string) => {
			return NAMED_ENTITIES[name.toLowerCase()] ?? match;
		});
}

function safeFromCodePoint(codePoint: number): string {
	try {
		return String.fromCodePoint(codePoint);
	} catch {
		return "";
	}
}

export function baselineChars(): string {
	let out = "";
	for (const [start, end] of BASELINE_RANGES) {
		for (let code = start; code <= end; code += 1) {
			out += String.fromCodePoint(code);
		}
	}
	return out;
}

/** 文字集合を、サブセットに渡す安定した文字列にする（並びを固定してハッシュをぶらさない）。 */
export function subsetText(chars: Iterable<string>): string {
	return [...new Set(chars)]
		.sort((a, b) => (a.codePointAt(0) ?? 0) - (b.codePointAt(0) ?? 0))
		.join("");
}

/** CSS が参照している日本語 woff2 の URL（`/_astro/...`）を返す。 */
export function japaneseFontUrls(css: string): string[] {
	return [...new Set([...css.matchAll(JAPANESE_FONT_URL)].map((m) => m[0]))];
}

/** Vite の asset 名に近い 8 文字のハッシュ。 */
export function contentHash(bytes: Uint8Array): string {
	return createHash("sha256").update(bytes).digest("base64url").slice(0, 8);
}

/** `/_astro/<base>.<old>.woff2` を `/_astro/<base>.<hash>.woff2` にする。 */
export function subsetFontUrl(originalUrl: string, hash: string): string {
	const match = originalUrl.match(
		/^(\/_astro\/[a-z0-9-]+-japanese-\d{3}-normal)\.[A-Za-z0-9_-]+\.woff2$/,
	);
	if (!match) {
		throw new Error(`Unexpected japanese font URL: ${originalUrl}`);
	}
	return `${match[1]}.${hash}.woff2`;
}

/** 参照を書き換える対象のテキストファイル。 */
const REFERENCE_FILE = /\.(?:html|js|mjs|cjs|css|json)$/;

/** `Layout.DCj2o1X9.css` を `Layout.<hash>.css` にする。 */
export function rehashedCssName(fileName: string, hash: string): string {
	const match = fileName.match(/^(.+)\.[A-Za-z0-9_-]+\.css$/);
	if (!match) {
		throw new Error(`Unexpected CSS asset name: ${fileName}`);
	}
	return `${match[1]}.${hash}.css`;
}

export function rewriteFontUrls(
	css: string,
	replacements: ReadonlyMap<string, string>,
): string {
	let out = css;
	for (const [from, to] of replacements) {
		out = out.split(from).join(to);
	}
	return out;
}

/** インライン script 本文。サブセットの URL 置換でここが変わると CSP ハッシュが壊れる。 */
export function inlineScriptBodies(html: string): string[] {
	return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(
		(match) => match[1] ?? "",
	);
}

function assertInlineScriptsUnchanged(
	before: string,
	after: string,
	relativePath: string,
): void {
	const beforeScripts = inlineScriptBodies(before);
	const afterScripts = inlineScriptBodies(after);
	if (beforeScripts.join("\0") !== afterScripts.join("\0")) {
		throw new Error(
			`${relativePath} のインライン script がサブセット後に変わる。CSP ハッシュが壊れるので、アセット URL は data-* に出すこと`,
		);
	}
}

async function listFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { recursive: true, withFileTypes: true });
	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => path.join(entry.parentPath, entry.name));
}

export type SubsetFn = (font: Uint8Array, text: string) => Promise<Uint8Array>;

export interface SubsetReport {
	url: string;
	newUrl: string;
	beforeBytes: number;
	afterBytes: number;
}

/**
 * `clientDir`（`dist/client`）の日本語 woff2 をサブセット化し、CSS の参照を
 * 書き換える。元の woff2 は消す（参照は CSS からしかない）。
 * 書き換えた CSS は改名し、`clientDir` と `referenceDirs`（`dist/server` など）に
 * ある HTML / JS / CSS / JSON の参照を新しい名前にする。
 */
export async function subsetJapaneseWebfonts(
	clientDir: string,
	subset: SubsetFn,
	referenceDirs: readonly string[] = [],
): Promise<{
	chars: number;
	fonts: SubsetReport[];
	css: [from: string, to: string][];
}> {
	const files = await listFiles(clientDir);
	const htmlFiles = files.filter((file) => file.endsWith(".html"));
	const jsFiles = files.filter((file) => file.endsWith(".js"));
	const cssFiles = files.filter((file) => file.endsWith(".css"));

	const chars = new Set<string>();
	for (const file of htmlFiles) {
		const html = await readFile(file, "utf8");
		if (japaneseFontUrls(html).length > 0) {
			// インライン CSS にあると CSP のハッシュまで変わるので扱わない
			throw new Error(
				`${path.relative(clientDir, file)} が日本語 woff2 を直接参照している。外部 CSS に置くこと`,
			);
		}
		collectNonLatinChars([htmlTextForSubset(html)], chars);
	}
	for (const file of jsFiles) {
		collectNonLatinChars([await readFile(file, "utf8")], chars);
	}
	collectNonLatinChars([baselineChars()], chars);
	const text = subsetText(chars);

	const cssByFile = new Map<string, string>();
	const urls = new Set<string>();
	for (const file of cssFiles) {
		const css = await readFile(file, "utf8");
		const found = japaneseFontUrls(css);
		if (found.length > 0) {
			cssByFile.set(file, css);
			for (const url of found) {
				urls.add(url);
			}
		}
	}

	const replacements = new Map<string, string>();
	const fonts: SubsetReport[] = [];
	for (const url of [...urls].sort()) {
		const source = path.join(clientDir, url);
		// subset-font（fontverter）は Buffer でないと形式を判定できない
		const original = await readFile(source);
		const subsetted = await subset(original, text);
		const newUrl = subsetFontUrl(url, contentHash(subsetted));
		await writeFile(path.join(clientDir, newUrl), subsetted);
		if (newUrl !== url) {
			await rm(source);
		}
		replacements.set(url, newUrl);
		fonts.push({
			url,
			newUrl,
			beforeBytes: original.byteLength,
			afterBytes: subsetted.byteLength,
		});
	}

	// `/_astro/*` は immutable で 1 年キャッシュされる。フォント URL を変えた CSS を
	// 同じ名前で上書きすると、再訪ユーザーには消えた旧フォントを指す CSS が残る。
	// 中身のハッシュで CSS も改名し、dist 全体の参照を差し替える。
	const renamedCss = new Map<string, string>();
	for (const [file, css] of cssByFile) {
		const rewritten = rewriteFontUrls(css, replacements);
		const oldName = path.basename(file);
		const newName = rehashedCssName(
			oldName,
			contentHash(new TextEncoder().encode(rewritten)),
		);
		await writeFile(path.join(path.dirname(file), newName), rewritten);
		if (newName !== oldName) {
			await rm(file);
			renamedCss.set(oldName, newName);
		}
	}

	// サーバーバンドルのアセット一覧も旧フォント名を持っているので一緒に直す
	const renamed = new Map<string, string>([...replacements, ...renamedCss]);
	if (renamed.size > 0) {
		for (const dir of [clientDir, ...referenceDirs]) {
			for (const file of await listFiles(dir)) {
				if (!REFERENCE_FILE.test(file)) {
					continue;
				}
				const content = await readFile(file, "utf8");
				const rewritten = rewriteFontUrls(content, renamed);
				if (rewritten !== content) {
					if (file.endsWith(".html")) {
						assertInlineScriptsUnchanged(
							content,
							rewritten,
							path.relative(dir, file),
						);
					}
					await writeFile(file, rewritten);
				}
			}
		}
	}

	return { chars: chars.size, fonts, css: [...renamedCss] };
}
