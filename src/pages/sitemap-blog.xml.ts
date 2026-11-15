import type { APIRoute } from "astro";

import { toFeedPost } from "@/lib/content/blog";
import { getBlogList } from "@/lib/content/blog-collection";

import { buildBlogSitemapXml } from "../../worker/content/derived.ts";

export const GET: APIRoute = async ({ site }) => {
	const posts = (await getBlogList()).map(toFeedPost);
	const origin = site?.origin ?? "https://ta93abe.com";

	return new Response(buildBlogSitemapXml(posts, origin), {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
		},
	});
};
