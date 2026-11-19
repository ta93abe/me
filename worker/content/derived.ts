import { FEATURED_WORKS, SITE } from "../../src/config/site.ts";
import linksData from "../../src/data/links.json";
import { blogCollectionDescription } from "../../src/utils/collection-description.ts";
import { toDate } from "./dates.ts";
import { sanitizeFeedHtml } from "./feed-html.ts";

export const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=yes";

const DEFAULT_ORIGIN = "https://ta93abe.com";

export type FeedPost = {
	slug: string;
	title: string;
	excerpt: string;
	publish_date: Date;
	revise_date?: Date;
	tags?: string[];
	contentHtml?: string;
};

export type LlmsFullPost = FeedPost & {
	body: string;
};

export type SitemapUrlEntry = {
	loc: string;
	lastmod?: string;
};

function originBase(origin: string): string {
	return origin.replace(/\/+$/, "");
}

function isLegalXmlChar(code: number): boolean {
	return (
		code === 0x9 ||
		code === 0xa ||
		code === 0xd ||
		(code >= 0x20 && code <= 0xd7ff) ||
		(code >= 0xe000 && code <= 0xfffd) ||
		(code >= 0x10000 && code <= 0x10ffff)
	);
}

function stripIllegalXmlChars(value: string): string {
	let result = "";
	for (const char of value) {
		if (isLegalXmlChar(char.codePointAt(0) ?? 0)) {
			result += char;
		}
	}
	return result;
}

function escapeXml(value: string): string {
	return stripIllegalXmlChars(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

function cdata(value: string): string {
	const safe = stripIllegalXmlChars(value).replaceAll("]]>", "]]]]><![CDATA[>");
	return `<![CDATA[${safe}]]>`;
}

export function sortFeedPosts<T extends FeedPost>(posts: T[]): T[] {
	return posts.toSorted(
		(left, right) =>
			right.publish_date.getTime() - left.publish_date.getTime() ||
			left.slug.localeCompare(right.slug),
	);
}

export function buildBlogRssXml(
	posts: FeedPost[],
	origin: string = DEFAULT_ORIGIN,
	builtAt?: Date,
): string {
	const base = originBase(origin);
	const sorted = sortFeedPosts(posts);
	const lastBuildDate = (
		builtAt ??
		sorted[0]?.publish_date ??
		new Date(0)
	).toUTCString();
	const items = sorted
		.map((post) => {
			const link = `${base}/blog/${post.slug}/`;
			const categories = (post.tags ?? [])
				.filter((tag) => tag.length > 0)
				.map((tag) => `      <category>${escapeXml(tag)}</category>`);
			const rawContent = post.contentHtml?.trim();
			const content = rawContent
				? `      <content:encoded>${cdata(sanitizeFeedHtml(rawContent))}</content:encoded>`
				: undefined;
			return [
				"    <item>",
				`      <title>${escapeXml(post.title)}</title>`,
				`      <link>${escapeXml(link)}</link>`,
				`      <guid>${escapeXml(link)}</guid>`,
				`      <pubDate>${post.publish_date.toUTCString()}</pubDate>`,
				`      <dc:creator>${escapeXml(SITE.author)}</dc:creator>`,
				`      <description>${escapeXml(post.excerpt)}</description>`,
				...categories,
				content,
				"    </item>",
			]
				.filter((line): line is string => line !== undefined)
				.join("\n");
		})
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>ta93abe | Blog</title>
    <link>${escapeXml(`${base}/blog/`)}</link>
    <description>${escapeXml(blogCollectionDescription(posts.map((post) => post.title)))}</description>
    <language>ja</language>
    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

function sitemapLastmod(post: FeedPost): string {
	return (post.revise_date ?? post.publish_date).toISOString().slice(0, 10);
}

/** Newest post lastmod as YYYY-MM-DD. Undefined when there are no posts. */
function latestSitemapLastmod(posts: FeedPost[]): string | undefined {
	let latest: string | undefined;
	for (const post of posts) {
		const lastmod = sitemapLastmod(post);
		if (latest === undefined || lastmod > latest) {
			latest = lastmod;
		}
	}
	return latest;
}

export function buildBlogSitemapXml(
	posts: FeedPost[],
	origin: string = DEFAULT_ORIGIN,
): string {
	const base = originBase(origin);
	const sorted = sortFeedPosts(posts);
	const blogIndexLastmod = latestSitemapLastmod(sorted);
	// 記事 0 件のときは /blog/ を出さない。この sitemap はリクエスト時生成なので
	// ビルド時刻を lastmod にすると毎回変わり、クロール差分のノイズになる。
	const urls: SitemapUrlEntry[] = [
		...(blogIndexLastmod
			? [{ loc: `${base}/blog/`, lastmod: blogIndexLastmod }]
			: []),
		...sorted.map((post) => ({
			loc: `${base}/blog/${post.slug}/`,
			lastmod: sitemapLastmod(post),
		})),
	];

	const body = urls
		.map((entry) => {
			const lastmod = entry.lastmod
				? `\n    <lastmod>${entry.lastmod}</lastmod>`
				: "";
			return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmod}\n  </url>`;
		})
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export type SitemapIndexLastmods = {
	staticSitemap?: string;
	blogSitemap?: string;
};

const LASTMOD_TAG = /<lastmod>\s*([^<]+?)\s*<\/lastmod>/gi;

export function formatSitemapLastmod(
	value: Date | string | undefined,
): string | undefined {
	const date = toDate(value);
	if (!date) {
		return undefined;
	}
	return date.toISOString().slice(0, 10);
}

export function maxSitemapLastmod(
	values: Array<Date | string | undefined>,
): string | undefined {
	let max: Date | undefined;
	for (const value of values) {
		const date = toDate(value);
		if (!date) {
			continue;
		}
		if (!max || date.getTime() > max.getTime()) {
			max = date;
		}
	}
	return formatSitemapLastmod(max);
}

export function lastmodFromSitemapXml(xml: string): string | undefined {
	const dates: string[] = [];
	for (const match of xml.matchAll(LASTMOD_TAG)) {
		dates.push(match[1]);
	}
	return maxSitemapLastmod(dates);
}

export function lastmodFromFeedPosts(posts: FeedPost[]): string | undefined {
	return maxSitemapLastmod(
		posts.map((post) => post.revise_date ?? post.publish_date),
	);
}

export function childSitemapLastmod(
	xml: string | undefined,
	httpLastModified: string | null | undefined,
	fallback: Date = new Date(),
): string {
	return (
		formatSitemapLastmod(httpLastModified ?? undefined) ??
		lastmodFromSitemapXml(xml ?? "") ??
		formatSitemapLastmod(fallback) ??
		"1970-01-01"
	);
}

function sitemapIndexEntry(loc: string, lastmod?: string): string {
	const lastmodXml = lastmod
		? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>`
		: "";
	return `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>${lastmodXml}\n  </sitemap>`;
}

export function buildSitemapIndexXml(
	origin: string = DEFAULT_ORIGIN,
	lastmods: SitemapIndexLastmods = {},
): string {
	const base = originBase(origin);
	return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapIndexEntry(`${base}/sitemap-0.xml`, lastmods.staticSitemap)}
${sitemapIndexEntry(`${base}/sitemap-blog.xml`, lastmods.blogSitemap)}
</sitemapindex>
`;
}

export function buildLlmsBlogSection(
	posts: FeedPost[],
	origin: string = DEFAULT_ORIGIN,
): string {
	const base = originBase(origin);
	if (posts.length === 0) {
		return "## Blog\n\nNo published posts yet.\n";
	}

	const lines = sortFeedPosts(posts).map(
		(post) => `- [${post.title}](${base}/blog/${post.slug}/) — ${post.excerpt}`,
	);
	return `## Blog\n\n${lines.join("\n")}\n`;
}

function featuredWorksMarkdown(): string {
	return FEATURED_WORKS.map(
		(work) => `- [${work.title}](${work.href}) — ${work.excerpt}`,
	).join("\n");
}

function snsMarkdown(): string {
	return linksData.links
		.map((link) => `- [${link.name}](${link.url})`)
		.join("\n");
}

export function buildAboutMarkdown(): string {
	return `# About

${SITE.handle}

${SITE.name}

${SITE.tagline}

## 代表作

${featuredWorksMarkdown()}

## SNS

${snsMarkdown()}

連絡は Contact からどうぞ。
`;
}

export function buildWorksMarkdown(): string {
	return `# Works

GitHub に置いている代表作です。

${featuredWorksMarkdown()}
`;
}

function originHost(origin: string): string {
	return new URL(originBase(origin)).host;
}

function llmsFullPage(url: string, markdown: string): string {
	return `## ${url}\n\n${markdown.trim()}\n`;
}

export function buildLlmsFullDocument(
	posts: LlmsFullPost[],
	origin: string = DEFAULT_ORIGIN,
): string {
	const base = originBase(origin);
	const pages = [
		llmsFullPage(`${base}/about/`, buildAboutMarkdown()),
		llmsFullPage(`${base}/works/`, buildWorksMarkdown()),
		...sortFeedPosts(posts).map((post) =>
			llmsFullPage(
				`${base}/blog/${post.slug}/`,
				`# ${post.title}\n\n${post.body.trim()}`,
			),
		),
	];

	return [
		`# ${originHost(origin)}, full content`,
		"",
		`Content-Signal: ${CONTENT_SIGNAL}`,
		"",
		pages.join("\n---\n\n"),
	].join("\n");
}
