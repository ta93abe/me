import {
	buildLlmsBlogSection,
	buildLlmsFullDocument,
	buildSitemapIndexXml,
	childSitemapLastmod,
	formatSitemapLastmod,
	lastmodFromFeedPosts,
	sortFeedPosts,
	type LlmsFullPost,
} from "./derived.ts";
import { loadSiteManifest } from "./site-manifest.ts";

/**
 * ビルド時に `src/pages/blog.json.ts` が出すブログ一覧（本文の正は `src/content/blog/*.mdx`）。
 * Worker は R2 ではなくこの静的アセットを読む（ADR-0003）。
 */
export const BLOG_MANIFEST_PATH = "/blog.json";

export type BlogManifestPost = {
	slug: string;
	title: string;
	excerpt: string;
	date: string;
	updatedDate?: string;
	tags: string[];
	body: string;
};

export type BlogManifest = {
	posts: BlogManifestPost[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function toDate(value: unknown): Date | undefined {
	if (typeof value !== "string" || value.length === 0) {
		return undefined;
	}
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

export function manifestPostsFromJson(value: unknown): LlmsFullPost[] {
	if (!isRecord(value) || !Array.isArray(value.posts)) {
		return [];
	}
	const posts: LlmsFullPost[] = [];
	for (const item of value.posts) {
		if (!isRecord(item)) {
			continue;
		}
		const publish_date = toDate(item.date);
		if (
			typeof item.slug !== "string" ||
			typeof item.title !== "string" ||
			!publish_date
		) {
			continue;
		}
		posts.push({
			slug: item.slug,
			title: item.title,
			excerpt: typeof item.excerpt === "string" ? item.excerpt : "",
			publish_date,
			revise_date: toDate(item.updatedDate),
			tags: Array.isArray(item.tags)
				? item.tags.filter((tag): tag is string => typeof tag === "string")
				: [],
			body: typeof item.body === "string" ? item.body : "",
		});
	}
	return sortFeedPosts(posts);
}

type AssetFetcher = { fetch: (request: Request) => Promise<Response> };

export async function loadBlogManifestPosts(
	assets: AssetFetcher | undefined,
	origin: string,
): Promise<LlmsFullPost[]> {
	if (!assets) {
		return [];
	}
	try {
		const response = await assets.fetch(
			new Request(new URL(BLOG_MANIFEST_PATH, origin)),
		);
		if (!response.ok) {
			return [];
		}
		return manifestPostsFromJson(await response.json());
	} catch {
		return [];
	}
}

export async function readLlmsBlogSection(
	assets: AssetFetcher | undefined,
	origin: string,
): Promise<string> {
	return buildLlmsBlogSection(
		await loadBlogManifestPosts(assets, origin),
		origin,
	);
}

export async function buildLlmsFullText(
	assets: AssetFetcher | undefined,
	origin: string,
): Promise<string> {
	const [posts, site] = await Promise.all([
		loadBlogManifestPosts(assets, origin),
		loadSiteManifest(assets, origin),
	]);
	return buildLlmsFullDocument(posts, origin, site);
}

export async function loadSitemapIndexXml(
	assets: AssetFetcher | undefined,
	origin: string,
	staticSitemap: { xml?: string; lastModified?: string | null } = {},
	now: Date = new Date(),
): Promise<string> {
	const posts = await loadBlogManifestPosts(assets, origin);
	return buildSitemapIndexXml(origin, {
		staticSitemap: childSitemapLastmod(
			staticSitemap.xml,
			staticSitemap.lastModified,
			now,
		),
		blogSitemap: lastmodFromFeedPosts(posts) ?? formatSitemapLastmod(now),
	});
}
