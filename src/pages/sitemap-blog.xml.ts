export const prerender = false;

import type { APIRoute } from "astro";

import { getContentBucket } from "@/lib/content/bindings";
import { listBlogPosts, toFeedPost } from "@/lib/content/blog";
import { BLOG_HTML_CACHE_CONTROL } from "@/lib/content/cache";

import { buildBlogSitemapXml } from "../../worker/content/derived.ts";

export const GET: APIRoute = async ({ site }) => {
	const bucket = await getContentBucket();
	const posts = bucket ? (await listBlogPosts(bucket)).map(toFeedPost) : [];
	const origin = site?.origin ?? "https://ta93abe.com";

	return new Response(buildBlogSitemapXml(posts, origin), {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": BLOG_HTML_CACHE_CONTROL,
		},
	});
};
