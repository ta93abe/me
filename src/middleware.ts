import { defineMiddleware } from "astro:middleware";

import { pageAliasRedirect } from "@/config/redirects";
import { BLOG_HTML_CACHE_CONTROL } from "@/lib/content/cache";
import { isRetiredSitePath } from "@/lib/content/retired-paths";
import { isSitemapIndexDocument } from "@/lib/content/sitemap-aliases";
import { trailingSlashRedirectUrl } from "@/utils/canonical";

import { buildSitemapIndexXml } from "../worker/content/derived.ts";

export const onRequest = defineMiddleware(async (context, next) => {
	if (isRetiredSitePath(context.url.pathname)) {
		return context.redirect("/", 301);
	}

	const method = context.request.method.toUpperCase();
	if (
		isSitemapIndexDocument(context.url.pathname) &&
		(method === "GET" || method === "HEAD")
	) {
		const origin = context.site?.origin ?? "https://ta93abe.com";
		return new Response(
			method === "HEAD" ? null : buildSitemapIndexXml(origin),
			{
				headers: {
					"Content-Type": "application/xml; charset=utf-8",
					"Cache-Control": BLOG_HTML_CACHE_CONTROL,
				},
			},
		);
	}

	const alias = pageAliasRedirect(context.url.pathname);
	if (alias) {
		return context.redirect(alias, 301);
	}

	if (method === "GET" || method === "HEAD") {
		const location = trailingSlashRedirectUrl(context.url);
		if (location) {
			return context.redirect(`${location.pathname}${location.search}`, 301);
		}
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
