// @ts-check

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, logHandlers } from "astro/config";

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
	integrations: [sitemap(), mdx(), react()],
	redirects: {
		"/works": "/gallery",
		"/works/[id]": "/gallery/[id]",
	},
	build: {
		inlineStylesheets: "auto",
	},
	compressHTML: true,
	prefetch: {
		prefetchAll: false,
		defaultStrategy: "hover",
	},
	// Astro 7 デフォルトの Sätteri（Rust）で Markdown/MDX を処理。
	// CSP と併用するためシンタックスハイライトは Prism（クラスベース）を使う。
	// Shiki はインライン style 属性前提で Astro CSP と非互換。
	markdown: {
		syntaxHighlight: "prism",
	},
	// エージェント向けは `astro dev --json` / `pnpm dev:json` を使う
	logger: logHandlers.console(),
	// Astro 7.1: ハッシュベース CSP + style-src-attr / script-src-elem
	// strict-dynamic は 'self' を無効化するため使わない（/_astro/*.js がブロックされる）。
	// is:inline スクリプトはハッシュ対象外なので、クライアント script は bundled にする。
	// style-src-attr の unsafe-inline は --delay 等の CSS 変数属性用（Prism 自体は不要）。
	security: {
		csp: {
			algorithm: "SHA-256",
			directives: [
				"default-src 'self'",
				"img-src 'self' data: blob: https:",
				"font-src 'self' data:",
				"media-src 'self' blob:",
				"connect-src 'self' https://*.i.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://cloudflareinsights.com",
				"base-uri 'self'",
				"form-action 'self'",
				"worker-src 'self' blob:",
			],
			styleDirective: {
				resources: cspStyleResources,
			},
			scriptDirective: {
				resources: cspScriptResources,
			},
		},
	},
	vite: {
		plugins: [tailwindcss()],
		build: {
			cssCodeSplit: true,
			rollupOptions: {
				output: {},
			},
		},
	},
});
