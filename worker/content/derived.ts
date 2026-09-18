import { SITE } from "../../src/config/site.ts";
import { publishDateValue, reviseDateValue, toDate } from "./dates.ts";
import { renderFeedHtml, sanitizeFeedHtml } from "./feed-html.ts";
import { looksLikeMdx, parseMarkdownDocument } from "./frontmatter.ts";
import { readCollectionIndex, type ContentIndexEntry } from "./index-store.ts";
import { markdownKey } from "./keys.ts";

export const BLOG_RSS_KEY = "derived/rss-blog.xml";
export const SITEMAP_URLS_KEY = "derived/sitemap-urls.json";
export const LLMS_BLOG_KEY = "derived/llms-blog.txt";

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

export type SitemapUrlEntry = {
	loc: string;
	lastmod?: string;
};

const STATIC_SECTION_PATHS = [
	"/about/",
	"/works/",
	"/contact/",
	"/links/",
	"/slides/",
	"/tools/",
	"/gadgets/",
] as const;

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

function tagsFrom(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter((tag): tag is string => typeof tag === "string");
}

function cdata(value: string): string {
	const safe = stripIllegalXmlChars(value).replaceAll("]]>", "]]]]><![CDATA[>");
	return `<![CDATA[${safe}]]>`;
}

export function sortFeedPosts(posts: FeedPost[]): FeedPost[] {
	return posts.toSorted(
		(left, right) =>
			right.publish_date.getTime() - left.publish_date.getTime() ||
			left.slug.localeCompare(right.slug),
	);
}

export function feedPostsFromEntries(entries: ContentIndexEntry[]): FeedPost[] {
	const posts: FeedPost[] = [];
	for (const entry of entries) {
		const publish_date = toDate(publishDateValue(entry.frontmatter));
		if (!publish_date) {
			continue;
		}
		posts.push({
			slug: entry.slug,
			title: entry.title,
			excerpt: entry.excerpt,
			publish_date,
			revise_date: toDate(reviseDateValue(entry.frontmatter)),
			tags: tagsFrom(entry.frontmatter.tags),
		});
	}
	return sortFeedPosts(posts);
}

async function readPostBodyHtml(
	bucket: R2Bucket,
	slug: string,
): Promise<string | undefined> {
	const object = await bucket.get(markdownKey("blog", slug));
	if (!object) {
		return undefined;
	}

	const markdown = await object.text();
	if (looksLikeMdx(markdown)) {
		return undefined;
	}

	try {
		const parsed = parseMarkdownDocument(markdown);
		return renderFeedHtml(parsed.body);
	} catch {
		return undefined;
	}
}

export async function withFeedContent(
	bucket: R2Bucket,
	posts: FeedPost[],
): Promise<FeedPost[]> {
	const result: FeedPost[] = [];
	for (const post of posts) {
		result.push({
			...post,
			contentHtml:
				post.contentHtml ?? (await readPostBodyHtml(bucket, post.slug)),
		});
	}
	return result;
}

export function buildBlogRssXml(
	posts: FeedPost[],
	origin: string = DEFAULT_ORIGIN,
): string {
	const base = originBase(origin);
	const items = sortFeedPosts(posts)
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
    <description>技術ブログ。日々の学びや開発の記録を共有しています。</description>
    <language>ja</language>
${items}
  </channel>
</rss>
`;
}

export function sitemapUrlEntries(
	posts: FeedPost[],
	origin: string = DEFAULT_ORIGIN,
): SitemapUrlEntry[] {
	const base = originBase(origin);
	const blogUrls = sortFeedPosts(posts).map((post) => ({
		loc: `${base}/blog/${post.slug}/`,
		lastmod: (post.revise_date ?? post.publish_date).toISOString().slice(0, 10),
	}));

	return [
		{ loc: `${base}/` },
		{ loc: `${base}/blog/` },
		...blogUrls,
		...STATIC_SECTION_PATHS.map((path) => ({ loc: `${base}${path}` })),
	];
}

export function buildBlogSitemapXml(
	posts: FeedPost[],
	origin: string = DEFAULT_ORIGIN,
): string {
	const base = originBase(origin);
	const urls: SitemapUrlEntry[] = [
		{ loc: `${base}/blog/` },
		...sortFeedPosts(posts).map((post) => ({
			loc: `${base}/blog/${post.slug}/`,
			lastmod: (post.revise_date ?? post.publish_date)
				.toISOString()
				.slice(0, 10),
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

export function buildSitemapIndexXml(origin: string = DEFAULT_ORIGIN): string {
	const base = originBase(origin);
	return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(`${base}/sitemap-0.xml`)}</loc>
  </sitemap>
  <sitemap>
    <loc>${escapeXml(`${base}/sitemap-blog.xml`)}</loc>
  </sitemap>
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

export function discoveryCacheUrls(
	origin: string,
	slugs: string[] = [],
): string[] {
	const base = originBase(origin);
	const urls = [
		`${base}/rss.xml`,
		`${base}/sitemap-index.xml`,
		`${base}/sitemap-blog.xml`,
		`${base}/llms.txt`,
		`${base}/llms-full.txt`,
	];
	for (const slug of slugs) {
		urls.push(`${base}/og/blog/${slug}.png`);
	}
	return urls;
}

export async function readLlmsBlogSection(
	bucket: R2Bucket,
	origin: string = DEFAULT_ORIGIN,
): Promise<string> {
	const stored = await bucket.get(LLMS_BLOG_KEY);
	if (stored) {
		return stored.text();
	}
	const index = await readCollectionIndex(bucket, "blog");
	return buildLlmsBlogSection(feedPostsFromEntries(index.entries), origin);
}

export async function writeDerivedDiscovery(
	bucket: R2Bucket,
	origin: string = DEFAULT_ORIGIN,
): Promise<void> {
	const index = await readCollectionIndex(bucket, "blog");
	const posts = await withFeedContent(
		bucket,
		feedPostsFromEntries(index.entries),
	);

	await bucket.put(BLOG_RSS_KEY, buildBlogRssXml(posts, origin), {
		httpMetadata: { contentType: "application/rss+xml; charset=utf-8" },
	});
	await bucket.put(
		SITEMAP_URLS_KEY,
		JSON.stringify(
			{
				generatedAt: index.generatedAt,
				urls: sitemapUrlEntries(posts, origin),
			},
			null,
			2,
		),
		{
			httpMetadata: { contentType: "application/json; charset=utf-8" },
		},
	);
	await bucket.put(LLMS_BLOG_KEY, buildLlmsBlogSection(posts, origin), {
		httpMetadata: { contentType: "text/plain; charset=utf-8" },
	});
}
