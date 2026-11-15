import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

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

export const collections = { blog };
