import type { APIRoute } from "astro";

import { getBlogEntries } from "@/lib/content/blog-collection";

import type { BlogManifest } from "../../worker/content/blog-manifest.ts";

// Worker の llms.txt / llms-full.txt / MCP / sitemap index が読むブログ一覧（ビルド時に生成）。
export const GET: APIRoute = async () => {
	const manifest: BlogManifest = {
		posts: (await getBlogEntries()).map((entry) => ({
			slug: entry.id,
			title: entry.data.title,
			excerpt: entry.data.excerpt,
			date: entry.data.date.toISOString(),
			...(entry.data.updatedDate
				? { updatedDate: entry.data.updatedDate.toISOString() }
				: {}),
			tags: entry.data.tags,
			body: entry.body ?? "",
		})),
	};

	return new Response(JSON.stringify(manifest), {
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
};
