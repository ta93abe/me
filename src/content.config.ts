import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

import {
	linkFrontmatterSchema,
	talkFrontmatterSchema,
	workFrontmatterSchema,
} from "./lib/content/site-data.ts";
import { deckFrontmatterSchema } from "./slides/mdx/deck-schema.ts";

/**
 * ブログ記事（ADR-0003）。公開本文の正は `src/content/blog/<slug>.mdx`。
 * ファイル名が slug で、URL は `/blog/<slug>/`。未知の frontmatter キーはビルド失敗にする。
 */
const blog = defineCollection({
	loader: glob({ pattern: "*.mdx", base: "./src/content/blog" }),
	schema: z
		.object({
			title: z.string().trim().min(1),
			excerpt: z.string().trim().min(1),
			tags: z.array(z.string().trim().min(1)).default([]),
			date: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
		})
		.strict(),
});

/**
 * スライドのデッキ（ADR-0002）。`src/slides/decks/<slug>.mdx`。ファイル名と frontmatter の slug は一致させる。
 */
const slides = defineCollection({
	loader: glob({ pattern: "*.mdx", base: "./src/slides/decks" }),
	schema: deckFrontmatterSchema,
});

/** 代表作（TA-2152）。`src/content/works/<slug>.mdx`。並び順は `order`。 */
const works = defineCollection({
	loader: glob({ pattern: "*.mdx", base: "./src/content/works" }),
	schema: workFrontmatterSchema,
});

/** 主に使っている場所（TA-2152）。`src/content/links/<slug>.mdx`。並び順は `order`。 */
const links = defineCollection({
	loader: glob({ pattern: "*.mdx", base: "./src/content/links" }),
	schema: linkFrontmatterSchema,
});

/** 登壇・配信（TA-2152）。`src/content/talks/<slug>.mdx`。並び順は `date` の新しい順。 */
const talks = defineCollection({
	loader: glob({ pattern: "*.mdx", base: "./src/content/talks" }),
	schema: talkFrontmatterSchema,
});

export const collections = { blog, slides, works, links, talks };
