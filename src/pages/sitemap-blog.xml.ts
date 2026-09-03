export const prerender = false;

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

import { getContentBucket } from "@/lib/content/bindings";
import {
	collectionEntryToListItem,
	listBlogPosts,
	mergeBlogLists,
	toFeedPost,
} from "@/lib/content/blog";
import { BLOG_HTML_CACHE_CONTROL } from "@/lib/content/cache";

import { buildBlogSitemapXml } from "../../worker/content/derived.ts";

export const GET: APIRoute = async ({ site }) => {
	const bucket = await getContentBucket();
	const r2Posts = bucket ? await listBlogPosts(bucket) : [];
	const leftover = (await getCollection("blog")).map(collectionEntryToListItem);
	const posts = mergeBlogLists(r2Posts, leftover).map(toFeedPost);
	const origin = site?.origin ?? "https://ta93abe.com";

	return new Response(buildBlogSitemapXml(posts, origin), {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": BLOG_HTML_CACHE_CONTROL,
		},
	});
};
