import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import Parser from "rss-parser";

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

// Blogコレクション
const blog = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		excerpt: z.string(),
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

// Zenn記事コレクション（RSS）
const zenn = defineCollection({
	loader: async () => {
		try {
			const parser = new Parser();
			const feed = await parser.parseURL("https://zenn.dev/ta93abe/feed");

			if (!feed.items) {
				return [];
			}

			return feed.items
				.filter((item) => item.title && item.link)
				.map((item, index) => ({
					id: `zenn-${index}`,
					title: item.title!,
					url: item.link!,
					publishedAt: new Date(item.pubDate!),
					excerpt: item.contentSnippet || item.content || "",
					source: "Zenn" as const,
				}));
		} catch (error) {
			console.error("Error fetching Zenn feed:", error);
			return [];
		}
	},
	schema: z.object({
		title: z.string(),
		url: z.string().url(),
		publishedAt: z.date(),
		excerpt: z.string(),
		source: z.literal("Zenn"),
	}),
});

// Note記事コレクション（RSS）
const note = defineCollection({
	loader: async () => {
		try {
			const parser = new Parser();
			const feed = await parser.parseURL("https://note.com/ta93abe/rss");

			if (!feed.items) {
				return [];
			}

			return feed.items
				.filter((item) => item.title && item.link)
				.map((item, index) => ({
					id: `note-${index}`,
					title: item.title!,
					url: item.link!,
					publishedAt: new Date(item.pubDate!),
					excerpt: item.contentSnippet || item.content || "",
					source: "Note" as const,
				}));
		} catch (error) {
			console.error("Error fetching Note RSS:", error);
			return [];
		}
	},
	schema: z.object({
		title: z.string(),
		url: z.string().url(),
		publishedAt: z.date(),
		excerpt: z.string(),
		source: z.literal("Note"),
	}),
});

// ポッドキャストコレクション（RSS）
const podcast = defineCollection({
	loader: async () => {
		try {
			const parser = new Parser();
			const feed = await parser.parseURL(
				"https://anchor.fm/s/4dd661e8/podcast/rss",
			);

			if (!feed.items) {
				return [];
			}

			return feed.items
				.filter((item) => item.title && item.link)
				.map((item, index) => ({
					id: `podcast-${index}`,
					title: item.title!,
					url: item.link!,
					publishedAt: new Date(item.pubDate!),
					excerpt: item.contentSnippet || item.content || "",
					source: "Podcast" as const,
				}));
		} catch (error) {
			console.error("Error fetching Podcast RSS:", error);
			return [];
		}
	},
	schema: z.object({
		title: z.string(),
		url: z.string().url(),
		publishedAt: z.date(),
		excerpt: z.string(),
		source: z.literal("Podcast"),
	}),
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
