import { defineMiddleware } from "astro:middleware";

import { BLOG_HTML_CACHE_CONTROL } from "@/lib/content/cache";

export const onRequest = defineMiddleware(async (context, next) => {
	const response = await next();
	const pathname = context.url.pathname.replace(/\/+$/, "") || "/";
	if (pathname === "/blog" || pathname.startsWith("/blog/")) {
		response.headers.set("Cache-Control", BLOG_HTML_CACHE_CONTROL);
	}
	return response;
});
