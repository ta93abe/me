export const prerender = false;

import type { APIRoute } from "astro";

import { getContentBucket } from "@/lib/content/bindings";
import { BLOG_HTML_CACHE_CONTROL } from "@/lib/content/cache";

import {
	buildBlogRssXml,
	feedPostsFromEntries,
	withFeedContent,
} from "../../worker/content/derived.ts";
import { readCollectionIndex } from "../../worker/content/index-store.ts";

export const GET: APIRoute = async ({ site }) => {
	const bucket = await getContentBucket();
	const origin = site?.origin ?? "https://ta93abe.com";
	const index = bucket ? await readCollectionIndex(bucket, "blog") : null;
	const posts = index
		? await withFeedContent(bucket!, feedPostsFromEntries(index.entries))
		: [];
	const builtAt = index ? new Date(index.generatedAt) : new Date(0);

	return new Response(buildBlogRssXml(posts, origin, builtAt), {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": BLOG_HTML_CACHE_CONTROL,
			"Content-Signal": "ai-train=no, search=yes, ai-input=yes",
			Link: '</llms.txt>; rel="describedby"; type="text/plain"',
		},
	});
};
