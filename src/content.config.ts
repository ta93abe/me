import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

import { createRSSLoader, type RSSSource } from "./utils/rss-loader";

// =============================================================================
// Common Schema Parts - 共通スキーマパーツ
// =============================================================================

/** Tags schema - consistent across collections */
const tagsSchema = z.array(z.string()).optional();

/** Excerpt schema - short description */
const excerptSchema = z.string();

/** Creative media type - drawing / photo / music */
const mediaTypeSchema = z
	.enum(["drawing", "photo", "music"])
	.default("drawing");

/**
 * Validate creative media fields:
 * - drawing / photo require coverImage
 * - music requires audio
 */
const refineCreativeMedia = <
	T extends {
		mediaType: "drawing" | "photo" | "music";
		coverImage?: unknown;
		audio?: string;
	},
>(
	data: T,
	ctx: z.RefinementCtx,
) => {
	if (
		(data.mediaType === "drawing" || data.mediaType === "photo") &&
		!data.coverImage
	) {
		ctx.addIssue({
			code: "custom",
			path: ["coverImage"],
			message: "coverImage is required for drawing and photo pieces",
		});
	}
	if (data.mediaType === "music" && !data.audio) {
		ctx.addIssue({
			code: "custom",
			path: ["audio"],
			message: "audio is required for music pieces",
		});
	}
};

// =============================================================================
// Content Collections
// =============================================================================

// Worksコレクション（ポートフォリオ作品）
const works = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/works" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			coverImage: image(),
			tags: z.array(z.string()),
			excerpt: excerptSchema,
		}),
});

// Atelierコレクション（作業中・練習作品）
const atelier = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/atelier" }),
	schema: ({ image }) =>
		z
			.object({
				title: z.string(),
				mediaType: mediaTypeSchema,
				coverImage: image().optional(),
				audio: z.string().optional(),
				tags: tagsSchema,
				excerpt: excerptSchema,
				status: z.enum(["wip", "practice", "sketch"]).default("wip"),
				date: z.coerce.date().optional(),
			})
			.superRefine(refineCreativeMedia),
});

// Galleryコレクション（完成作品）
const gallery = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/gallery" }),
	schema: ({ image }) =>
		z
			.object({
				title: z.string(),
				mediaType: mediaTypeSchema,
				coverImage: image().optional(),
				audio: z.string().optional(),
				tags: tagsSchema,
				excerpt: excerptSchema,
				completedDate: z.coerce.date().optional(),
			})
			.superRefine(refineCreativeMedia),
});

// Booksコレクション（読書記録）
const books = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/books" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			author: z.string(),
			coverImage: image(),
			status: z.enum(["read", "reading", "stacked"]),
			finishedDate: z.coerce.date().optional(),
			rating: z.number().min(1).max(5).optional(),
			category: z.string().optional(),
			tags: z.array(z.string()), // Required for books
			excerpt: excerptSchema,
		}),
});

// Blogコレクション（MD/MDX対応）
const blog = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		excerpt: excerptSchema,
		tags: tagsSchema,
	}),
});

// Talksコレクション（登壇情報）
const talks = defineCollection({
	loader: glob({ pattern: "**/*.json", base: "./src/content/talks" }),
	schema: z.object({
		items: z.array(
			z.object({
				id: z.string(),
				url: z.string().url().optional(),
				date: z.coerce.date(),
				title: z.string(),
			}),
		),
	}),
});

// 外部記事の共通スキーマ
const externalArticleSchema = (source: RSSSource) =>
	z.object({
		title: z.string(),
		url: z.string().url(),
		publishedAt: z.date(),
		excerpt: z.string(),
		source: z.literal(source),
	});

// Zenn記事コレクション（RSS）
const zenn = defineCollection({
	loader: createRSSLoader("https://zenn.dev/ta93abe/feed", "Zenn", "zenn"),
	schema: externalArticleSchema("Zenn"),
});

// Note記事コレクション（RSS）
const note = defineCollection({
	loader: createRSSLoader("https://note.com/ta93abe/rss", "Note", "note"),
	schema: externalArticleSchema("Note"),
});

// ポッドキャストコレクション（RSS）
const podcast = defineCollection({
	loader: createRSSLoader(
		"https://anchor.fm/s/4dd661e8/podcast/rss",
		"Podcast",
		"podcast",
	),
	schema: externalArticleSchema("Podcast"),
});

export const collections = {
	works,
	atelier,
	gallery,
	books,
	blog,
	talks,
	zenn,
	note,
	podcast,
};
