// @ts-check

import path from "node:path";
import { fileURLToPath } from "node:url";

import cloudflare from "@astrojs/cloudflare";
import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, logHandlers, sessionDrivers } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import subsetFont from "subset-font";

import { PAGE_ALIASES } from "./src/config/redirects.ts";
import { remarkBlogEmbeds } from "./src/lib/content/remark-blog-embeds.ts";
import { copySlideMedia } from "./src/slides/copy-media.ts";
import { remarkSlideGuard } from "./src/slides/mdx/remark-slide-guard.ts";
import { remarkSlides } from "./src/slides/mdx/remark-slides.ts";
import { optionalFontDisplayPlugin } from "./src/utils/optional-font-display.ts";
import { rehypeCodeHighlight } from "./src/utils/rehype-code-highlight.ts";
import {
	createStaticSitemapSerializer,
	includeInStaticSitemap,
} from "./src/utils/sitemap-lastmod.ts";
import { subsetJapaneseWebfonts } from "./src/utils/webfont-subset.ts";

const sitemapRootDir = path.dirname(fileURLToPath(import.meta.url));
const sitemapSerialize = createStaticSitemapSerializer({
	rootDir: sitemapRootDir,
});

/**
 * Astro の CspResourceEntry 相当。
 * `import('astro').CspResourceEntry` は公開エントリから export されないためローカルで定義する。
 *
 * @typedef {{ resource: string; kind: "element" | "attribute" | "default" }} CspResourceObject
 * @typedef {string | CspResourceObject} CspResourceEntry
 */

/** @type {CspResourceEntry[]} */
const cspStyleResources = [
	{ resource: "'self'", kind: "element" },
	{ resource: "'unsafe-inline'", kind: "attribute" },
];

/** @type {CspResourceEntry[]} */
const cspScriptResources = [
	{ resource: "'self'", kind: "element" },
	// PostHog（必要時の remote bundle）と Cloudflare Web Analytics beacon
	{ resource: "https://*.i.posthog.com", kind: "element" },
	{ resource: "https://us-assets.i.posthog.com", kind: "element" },
	{ resource: "https://eu-assets.i.posthog.com", kind: "element" },
	{ resource: "https://static.cloudflareinsights.com", kind: "element" },
];

// https://astro.build/config
export default defineConfig({
	site: "https://ta93abe.com",
	// Astro 7 の trailingSlash: "always" は dev で不一致 URL を 404 reject する。
	// 本番の 301 は middleware と Worker で行う。
	adapter: cloudflare({
		// IMAGES は公開 R2 `me-images` のバインディング名なので Cloudflare Images と混ぜない
		imageService: "compile",
		// OG / resvg / satori は Node 前提のプリレンダー
		prerenderEnvironment: "node",
	}),
	// セッションは使わない。SESSION KV を自動で増やさない
	session: {
		driver: sessionDrivers.lruCache(),
	},
	integrations: [
		sitemap({
			filter: (page) =>
				includeInStaticSitemap(page, { rootDir: sitemapRootDir }),
			serialize(item) {
				return sitemapSerialize(item);
			},
		}),
		react(),
		// ブログ記事とスライドのデッキ（MDX）。プラグインは markdown.processor から継承する。
		mdx(),
		{
			// 日本語 woff2 をサイトで使う文字だけにする（TA-2173）
			name: "subset-japanese-webfonts",
			hooks: {
				"astro:build:done": async ({ dir, logger }) => {
					const result = await subsetJapaneseWebfonts(
						fileURLToPath(dir),
						(font, text) => subsetFont(font, text, { targetFormat: "woff2" }),
					);
					const before = result.fonts.reduce(
						(sum, f) => sum + f.beforeBytes,
						0,
					);
					const after = result.fonts.reduce((sum, f) => sum + f.afterBytes, 0);
					logger.info(
						`${result.fonts.length} fonts, ${result.chars} chars: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`,
					);
				},
			},
		},
		{
			name: "slide-deck-media",
			hooks: {
				"astro:server:setup": async () => {
					await copySlideMedia(
						path.join(path.dirname(fileURLToPath(import.meta.url)), "public"),
					);
				},
				"astro:build:start": async () => {
					await copySlideMedia(
						path.join(path.dirname(fileURLToPath(import.meta.url)), "public"),
					);
				},
			},
		},
	],
	redirects: {
		"/gallery": "/",
		"/atelier": "/",
		"/bookshelf": "/",
		...PAGE_ALIASES,
	},
	build: {
		inlineStylesheets: "auto",
	},
	compressHTML: true,
	prefetch: {
		prefetchAll: false,
		defaultStrategy: "hover",
	},
	// ブログ（src/content/blog）とスライド（src/slides/decks）の MDX。
	// ハイライトは rehypeCodeHighlight で振り分ける（ブログは Prism、スライドは Shiki をクラス化）。
	// どちらもクラスベースで、インライン style を出さない（ハッシュベース CSP と両立）。
	markdown: {
		syntaxHighlight: false,
		processor: unified({
			remarkPlugins: [
				remarkMath,
				remarkSlideGuard,
				remarkSlides,
				remarkBlogEmbeds,
			],
			rehypePlugins: [[rehypeKatex, { strict: "ignore" }], rehypeCodeHighlight],
			// 原稿の引用符をそのまま出す
			smartypants: false,
		}),
	},
	// エージェント向けは `astro dev --json` / `pnpm dev:json` を使う
	logger: logHandlers.console(),
	// Astro 7.1: ハッシュベース CSP + style-src-attr / script-src-elem
	// strict-dynamic は 'self' を無効化するため使わない（/_astro/*.js がブロックされる）。
	// is:inline スクリプトはハッシュ対象外なので、クライアント script は bundled にする。
	// style-src-attr の unsafe-inline は --delay 等の CSS 変数属性用（Prism 自体は不要）。
	// 実行時注入の <style>（Paper Shaders / React island）はハッシュを足さず、
	// 静的 CSS と style[data-paper-shader] の先置きで注入自体を止める（TA-1483）。
	security: {
		csp: {
			algorithm: "SHA-256",
			directives: [
				"default-src 'self'",
				"img-src 'self' data: blob: https:",
				"font-src 'self' data:",
				"media-src 'self' blob:",
				"connect-src 'self' https://*.i.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://cloudflareinsights.com",
				// platform.twitter.com は <Tweet live />（ブログ）の iframe。widgets.js 自体はそのページだけ script-src に足す
				"frame-src 'self' https://www.youtube-nocookie.com https://open.spotify.com https://platform.twitter.com",
				"base-uri 'self'",
				"form-action 'self'",
				"worker-src 'self' blob:",
			],
			styleDirective: {
				resources: cspStyleResources,
				// Paper Shaders が注入する固定 CSS。先置きで注入は止めるが、
				// ライブラリ更新漏れ時のフォールバック（TA-1483）。
				hashes: [
					{
						hash: "sha256-bcX2M6hOeEgeI9Ttj3KtXWZuoRsKenyQAlXswSnLakA=",
						kind: "element",
					},
					// 先置きの空 <style data-paper-shader>。Astro 7.4.12 以降は空タグのハッシュを自動で出さない。
					{
						hash: "sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
						kind: "element",
					},
				],
			},
			scriptDirective: {
				resources: cspScriptResources,
			},
		},
	},
	vite: {
		plugins: [optionalFontDisplayPlugin(), tailwindcss()],
		build: {
			cssCodeSplit: true,
			rollupOptions: {
				output: {},
			},
		},
	},
});
