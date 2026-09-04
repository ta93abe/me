import {
	readCollectionIndex,
	type ContentIndexEntry,
} from "./index-store.ts";

export const BLOG_RSS_KEY = "derived/rss-blog.xml";
export const SITEMAP_URLS_KEY = "derived/sitemap-urls.json";
export const LLMS_BLOG_KEY = "derived/llms-blog.txt";

const DEFAULT_ORIGIN = "https://ta93abe.com";

export type FeedPost = {
	slug: string;
	title: string;
	excerpt: string;
	date: Date;
	updatedDate?: Date;
};

export type SitemapUrlEntry = {
	loc: string;
	lastmod?: string;
};

const STATIC_SECTION_PATHS = [
	"/about/",
	"/contact/",
	"/links/",
	"/slides/",
	"/tools/",
] as const;

function originBase(origin: string): string {
	return origin.replace(/\/+$/, "");
}

function toDate(value: unknown): Date | undefined {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value;
	}
	if (typeof value === "string" && value.length > 0) {
		const parsed = new Date(value);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed;
		}
	}
	return undefined;
}

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

export function sortFeedPosts(posts: FeedPost[]): FeedPost[] {
	return posts.toSorted(
		(left, right) =>
			right.date.getTime() - left.date.getTime() ||
			left.slug.localeCompare(right.slug),
	);
}

export function feedPostsFromEntries(
	entries: ContentIndexEntry[],
): FeedPost[] {
	const posts: FeedPost[] = [];
	for (const entry of entries) {
		const date = toDate(entry.frontmatter.date);
		if (!date) {
			continue;
		}
		posts.push({
			slug: entry.slug,
			title: entry.title,
			excerpt: entry.excerpt,
			date,
			updatedDate: toDate(entry.frontmatter.updatedDate),
		});
	}
	return sortFeedPosts(posts);
}

export function buildBlogRssXml(
	posts: FeedPost[],
	origin: string = DEFAULT_ORIGIN,
): string {
	const base = originBase(origin);
	const items = sortFeedPosts(posts)
		.map((post) => {
			const link = `${base}/blog/${post.slug}/`;
			return [
				"    <item>",
				`      <title>${escapeXml(post.title)}</title>`,
				`      <link>${escapeXml(link)}</link>`,
				`      <guid>${escapeXml(link)}</guid>`,
				`      <pubDate>${post.date.toUTCString()}</pubDate>`,
				`      <description>${escapeXml(post.excerpt)}</description>`,
				"    </item>",
			].join("\n");
		})
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
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
		lastmod: post.date.toISOString().slice(0, 10),
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
			lastmod: post.date.toISOString().slice(0, 10),
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

export function buildSitemapIndexXml(
	origin: string = DEFAULT_ORIGIN,
): string {
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
		(post) =>
			`- [${post.title}](${base}/blog/${post.slug}/) — ${post.excerpt}`,
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
	const posts = feedPostsFromEntries(index.entries);

	await bucket.put(BLOG_RSS_KEY, buildBlogRssXml(posts, origin), {
		httpMetadata: { contentType: "application/rss+xml; charset=utf-8" },
	});
	await bucket.put(
		SITEMAP_URLS_KEY,
		JSON.stringify(
			{ generatedAt: index.generatedAt, urls: sitemapUrlEntries(posts, origin) },
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
