import { z } from "zod";

import { CONTENT_COLLECTIONS, type ContentCollection } from "./collections.ts";
import type { FrontmatterValue } from "./frontmatter.ts";

const tagsSchema = z.array(z.string()).optional();
const urlString = z.string().min(1);

const creativeMediaTypeSchema = z.enum(["drawing", "photo", "music"]);
const galleryMediaTypeSchema = z.enum(["drawing", "photo", "music", "project"]);

type CreativeInput = {
	mediaType: "drawing" | "photo" | "music" | "project";
	coverImage?: string;
	audio?: string;
};

const refineCreativeMedia = (
	data: CreativeInput,
	ctx: z.RefinementCtx,
): void => {
	if (
		(data.mediaType === "drawing" ||
			data.mediaType === "photo" ||
			data.mediaType === "project") &&
		!data.coverImage
	) {
		ctx.addIssue({
			code: "custom",
			path: ["coverImage"],
			message: "coverImage is required for drawing, photo, and project pieces",
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

const dateLike = z.union([z.string().min(1), z.date()]).optional();

export const blogFrontmatterSchema = z.object({
	title: z.string().min(1),
	excerpt: z.string().min(1),
	date: z.union([z.string().min(1), z.date()]),
	updatedDate: dateLike,
	tags: tagsSchema,
});

export const galleryFrontmatterSchema = z
	.object({
		title: z.string().min(1),
		excerpt: z.string().min(1),
		mediaType: galleryMediaTypeSchema.default("drawing"),
		coverImage: urlString.optional(),
		audio: urlString.optional(),
		tags: tagsSchema,
		completedDate: dateLike,
	})
	.superRefine(refineCreativeMedia);

export const atelierFrontmatterSchema = z
	.object({
		title: z.string().min(1),
		excerpt: z.string().min(1),
		mediaType: creativeMediaTypeSchema.default("drawing"),
		coverImage: urlString.optional(),
		audio: urlString.optional(),
		tags: tagsSchema,
		status: z.enum(["wip", "practice", "sketch"]).default("wip"),
		date: dateLike,
	})
	.superRefine(refineCreativeMedia);

export const booksFrontmatterSchema = z.object({
	title: z.string().min(1),
	excerpt: z.string().min(1),
	author: z.string().min(1),
	coverImage: urlString,
	status: z.enum(["read", "reading", "stacked"]),
	finishedDate: dateLike,
	rating: z.number().min(1).max(5).optional(),
	category: z.string().optional(),
});

const collectionSchemas = {
	blog: blogFrontmatterSchema,
	gallery: galleryFrontmatterSchema,
	atelier: atelierFrontmatterSchema,
	books: booksFrontmatterSchema,
} as const;

export type ValidatedFrontmatter = {
	title: string;
	excerpt: string;
	[key: string]: unknown;
};

export function validateFrontmatter(
	collection: ContentCollection,
	frontmatter: Record<string, FrontmatterValue>,
):
	| { ok: true; data: ValidatedFrontmatter }
	| { ok: false; error: string; issues: string[] } {
	const parsed = collectionSchemas[collection].safeParse(frontmatter);
	if (!parsed.success) {
		const issues = parsed.error.issues.map((issue) => {
			const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
			return `${path}${issue.message}`;
		});
		return {
			ok: false,
			error: "frontmatter failed schema validation",
			issues,
		};
	}

	return { ok: true, data: parsed.data as ValidatedFrontmatter };
}

const stringProperty = { type: "string", minLength: 1 } as const;
const optionalStringArray = {
	type: "array",
	items: { type: "string" },
} as const;

function creativeProperties(mediaTypes: string[]) {
	return {
		title: stringProperty,
		excerpt: stringProperty,
		mediaType: { type: "string", enum: mediaTypes, default: "drawing" },
		coverImage: stringProperty,
		audio: stringProperty,
		tags: optionalStringArray,
	};
}

export function contentJsonSchema() {
	return {
		$schema: "https://json-schema.org/draft/2020-12/schema",
		title: "me content API",
		collections: CONTENT_COLLECTIONS,
		slug: {
			type: "string",
			pattern: "^[a-z0-9][a-z0-9-]{0,80}$",
		},
		frontmatter: {
			blog: {
				type: "object",
				additionalProperties: true,
				required: ["title", "excerpt", "date"],
				properties: {
					title: stringProperty,
					excerpt: stringProperty,
					date: stringProperty,
					updatedDate: stringProperty,
					tags: optionalStringArray,
				},
			},
			gallery: {
				type: "object",
				additionalProperties: true,
				required: ["title", "excerpt"],
				properties: {
					...creativeProperties(["drawing", "photo", "music", "project"]),
					completedDate: stringProperty,
				},
			},
			atelier: {
				type: "object",
				additionalProperties: true,
				required: ["title", "excerpt"],
				properties: {
					...creativeProperties(["drawing", "photo", "music"]),
					status: {
						type: "string",
						enum: ["wip", "practice", "sketch"],
						default: "wip",
					},
					date: stringProperty,
				},
			},
			books: {
				type: "object",
				additionalProperties: true,
				required: ["title", "excerpt", "author", "coverImage", "status"],
				properties: {
					title: stringProperty,
					excerpt: stringProperty,
					author: stringProperty,
					coverImage: stringProperty,
					status: { type: "string", enum: ["read", "reading", "stacked"] },
					finishedDate: stringProperty,
					rating: { type: "number", minimum: 1, maximum: 5 },
					category: { type: "string" },
				},
			},
		},
	};
}
