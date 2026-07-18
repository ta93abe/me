// @ts-check

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, logHandlers } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://ta93abe.com",
	integrations: [sitemap(), mdx(), react()],
	build: {
		inlineStylesheets: "auto",
	},
	compressHTML: true,
	prefetch: {
		prefetchAll: false,
		defaultStrategy: "hover",
	},
	// Astro 7 デフォルトの Sätteri（Rust）で Markdown/MDX を処理。
	// GFM / SmartyPants は標準搭載のため remark-gfm は不要。
	markdown: {
		shikiConfig: {
			theme: "github-dark",
			wrap: true,
		},
	},
	// エージェント向けは `astro dev --json` / `pnpm dev:json` を使う
	logger: logHandlers.console({ pretty: true }),
	// Astro 7.1: ハッシュベース CSP + style-src-attr / script-src-elem
	// PostHog の動的 script 注入は strict-dynamic で許可する。
	// Shiki のトークン色は style 属性のため style-src-attr に unsafe-inline を限定付与。
	security: {
		csp: {
			algorithm: "SHA-256",
			directives: [
				"default-src 'self'",
				"img-src 'self' data: blob: https:",
				"font-src 'self' data:",
				"media-src 'self' blob:",
				"connect-src 'self' https://*.i.posthog.com https://us.i.posthog.com https://eu.i.posthog.com",
				"frame-ancestors 'none'",
				"base-uri 'self'",
				"form-action 'self'",
				"worker-src 'self' blob:",
			],
			styleDirective: {
				resources: [
					{ resource: "'self'", kind: "element" },
					{ resource: "'unsafe-inline'", kind: "attribute" },
				],
			},
			scriptDirective: {
				resources: [
					{ resource: "'self'", kind: "element" },
				],
				strictDynamic: true,
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
