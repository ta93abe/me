// on-demand のまま残す。全ページが prerender になると Astro は Worker のサーバービルドを出さず、
// worker/index.ts（agent エンドポイント・CSP ヘッダ昇格など）がデプロイされなくなる。
export const prerender = false;

import type { APIRoute } from "astro";

import {
	blogEntryToListItem,
	getBlogEntries,
} from "@/lib/content/blog-collection";
import { BLOG_HTML_CACHE_CONTROL } from "@/lib/content/cache";

import { buildBlogRssXml } from "../../worker/content/derived.ts";
import { renderFeedHtml } from "../../worker/content/feed-html.ts";

export const GET: APIRoute = async ({ site }) => {
	const origin = site?.origin ?? "https://ta93abe.com";
	const posts = (await getBlogEntries()).map((entry) => ({
		...blogEntryToListItem(entry),
		contentHtml: renderFeedHtml(entry.body ?? ""),
	}));

	return new Response(buildBlogRssXml(posts, origin), {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": BLOG_HTML_CACHE_CONTROL,
			"Content-Signal": "ai-train=no, search=yes, ai-input=yes",
			Link: '</llms.txt>; rel="describedby"; type="text/plain"',
		},
	});
};
