import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { createRSSLoader, type RSSSource } from "./utils/rss-loader";

// Aboutコレクション
const about = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/about" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			summary: z.array(z.string()),
			image: image().optional(),
			heading: z.string().optional(),
		}),
});

// Worksコレクション（ポートフォリオ作品）
const works = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/works" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			coverImage: image(),
			keywords: z.array(z.string()),
			startDate: z.coerce.date(),
			endDate: z.coerce.date().optional(),
			excerpt: z.string(),
		}),
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
			tags: z.array(z.string()),
			excerpt: z.string(),
		}),
});

// Blogコレクション（MD/MDX対応）
const blog = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		excerpt: z.string(),
		tags: z.array(z.string()).optional(),
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
	about,
	works,
	books,
	blog,
	talks,
	zenn,
	note,
	podcast,
};
