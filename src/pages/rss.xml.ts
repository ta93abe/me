export const prerender = false;

import type { APIRoute } from "astro";

import { getContentBucket } from "@/lib/content/bindings";
import { listBlogPosts, toFeedPost } from "@/lib/content/blog";
import { BLOG_HTML_CACHE_CONTROL } from "@/lib/content/cache";

import { buildBlogRssXml } from "../../worker/content/derived.ts";

export const GET: APIRoute = async ({ site }) => {
	const bucket = await getContentBucket();
	const posts = bucket ? (await listBlogPosts(bucket)).map(toFeedPost) : [];
	const origin = site?.origin ?? "https://ta93abe.com";

	return new Response(buildBlogRssXml(posts, origin), {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": BLOG_HTML_CACHE_CONTROL,
		},
	});
};
