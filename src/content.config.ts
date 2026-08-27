import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

// =============================================================================
// Common Schema Parts - 共通スキーマパーツ
// =============================================================================

/** Tags schema - consistent across collections */
const tagsSchema = z.array(z.string()).optional();

/** Excerpt schema - short description */
const excerptSchema = z.string();

/** Atelier / Gallery media type - drawing / photo / music */
const creativeMediaTypeSchema = z
	.enum(["drawing", "photo", "music"])
	.default("drawing");

/**
 * Validate creative media fields:
 * - drawing / photo require coverImage
 * - music requires audio
 */
type CreativeRefinementCtx = {
	addIssue: (issue: {
		code: "custom";
		path: Array<string | number>;
		message: string;
	}) => void;
};

const refineCreativeMedia = <
	T extends {
		mediaType: "drawing" | "photo" | "music";
		coverImage?: unknown;
		audio?: string;
	},
>(
	data: T,
	ctx: CreativeRefinementCtx,
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

// Worksコレクション（エンジニアリングの代表作）
const works = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/works" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			coverImage: image(),
			tags: z.array(z.string()),
			excerpt: excerptSchema,
			completedDate: z.coerce.date().optional(),
			featured: z.boolean().optional(),
			repoUrl: z.string().url().optional(),
		}),
});

// Atelierコレクション（作業中・練習作品）
const atelier = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/atelier" }),
	schema: ({ image }) =>
		z
			.object({
				title: z.string(),
				mediaType: creativeMediaTypeSchema,
				coverImage: image().optional(),
				audio: z.string().optional(),
				tags: tagsSchema,
				excerpt: excerptSchema,
				status: z.enum(["wip", "practice", "sketch"]).default("wip"),
				date: z.coerce.date().optional(),
			})
			.superRefine(refineCreativeMedia),
});

// Galleryコレクション（創作の完成作品）
const gallery = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/gallery" }),
	schema: ({ image }) =>
		z
			.object({
				title: z.string(),
				mediaType: creativeMediaTypeSchema,
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

export const collections = {
	works,
	atelier,
	gallery,
	books,
	blog,
};
