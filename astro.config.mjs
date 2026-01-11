// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";
import remarkGfm from "remark-gfm";

// https://astro.build/config
export default defineConfig({
	site: "https://ta93abe.com",
	integrations: [sitemap(), pagefind(), mdx()],
	build: {
		inlineStylesheets: "auto",
	},
	compressHTML: true,
	prefetch: {
		prefetchAll: false,
		defaultStrategy: "hover",
	},
	markdown: {
		remarkPlugins: [remarkGfm],
		shikiConfig: {
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
			wrap: true,
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
