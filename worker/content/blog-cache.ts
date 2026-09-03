import { parseMarkdownKey } from "./keys.ts";

export const BLOG_HTML_CACHE_CONTROL =
	"public, s-maxage=300, stale-while-revalidate=86400";

export function blogHtmlCacheUrls(origin: string, slugs: string[] = []): string[] {
	const base = origin.replace(/\/+$/, "");
	const urls = new Set([`${base}/blog`, `${base}/blog/`]);
	for (const slug of slugs) {
		urls.add(`${base}/blog/${slug}`);
		urls.add(`${base}/blog/${slug}/`);
	}
	return [...urls];
}

export function blogSlugsFromMarkdownKeys(keys: string[]): string[] {
	const slugs: string[] = [];
	for (const key of keys) {
		const parsed = parseMarkdownKey(key);
		if (parsed?.collection === "blog") {
			slugs.push(parsed.slug);
		}
	}
	return slugs;
}
