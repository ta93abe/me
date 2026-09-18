import { defineMiddleware } from "astro:middleware";

import { BLOG_HTML_CACHE_CONTROL } from "@/lib/content/cache";
import { isRetiredSitePath } from "@/lib/content/retired-paths";
import {
	SITEMAP_INDEX_PATH,
	isSitemapIndexAlias,
} from "@/lib/content/sitemap-aliases";

export const onRequest = defineMiddleware(async (context, next) => {
	if (isRetiredSitePath(context.url.pathname)) {
		return context.redirect("/", 301);
	}

	if (isSitemapIndexAlias(context.url.pathname)) {
		return context.redirect(SITEMAP_INDEX_PATH, 301);
	}

	const response = await next();
	const pathname = context.url.pathname.replace(/\/+$/, "") || "/";
	if (
		response.ok &&
		(pathname === "/blog" ||
			pathname.startsWith("/blog/") ||
			pathname === "/rss.xml" ||
			pathname === "/sitemap-blog.xml")
	) {
		response.headers.set("Cache-Control", BLOG_HTML_CACHE_CONTROL);
	}
	return response;
});
