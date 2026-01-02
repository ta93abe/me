import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

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

// Qiita APIレスポンスの型定義
interface QiitaArticle {
	id: string;
	title: string;
	url: string;
	created_at: string;
}

// Qiita記事コレクション（外部API）
const qiita = defineCollection({
	loader: async () => {
		try {
			const response = await fetch(
				"https://qiita.com/api/v2/users/ta93abe/items?per_page=5",
				{
					signal: AbortSignal.timeout(10000),
				},
			);

			if (!response.ok) {
				console.error("Failed to fetch Qiita articles");
				return [];
			}

			const articles: QiitaArticle[] = await response.json();

			return articles.map((article) => ({
				id: article.id,
				data: {
					title: article.title,
					url: article.url,
					createdAt: new Date(article.created_at),
				},
			}));
		} catch (error) {
			console.error("Error fetching Qiita articles:", error);
			return [];
		}
	},
	schema: z.object({
		title: z.string(),
		url: z.string().url(),
		createdAt: z.date(),
	}),
});

export const collections = {
	about,
	works,
	blog,
	talks,
	qiita,
};
