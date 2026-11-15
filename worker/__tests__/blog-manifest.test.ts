import { describe, expect, it } from "vitest";

import {
	BLOG_MANIFEST_PATH,
	buildLlmsFullText,
	loadBlogManifestPosts,
	loadSitemapIndexXml,
	manifestPostsFromJson,
	readLlmsBlogSection,
} from "../content/blog-manifest.ts";

const ORIGIN = "https://ta93abe.com";

const manifest = {
	posts: [
		{
			slug: "hello-world",
			title: "Hello World",
			excerpt: "最初の投稿",
			date: "2026-08-30T00:00:00.000Z",
			tags: [],
			body: "ブログを始めようじゃないか。",
		},
		{
			slug: "newer",
			title: "Newer",
			excerpt: "新しい投稿",
			date: "2026-09-16T00:00:00.000Z",
			updatedDate: "2026-09-20T00:00:00.000Z",
			tags: ["Snowflake"],
			body: "本文",
		},
	],
};

function assets(body: unknown, status = 200) {
	const requested: string[] = [];
	return {
		requested,
		fetch: async (request: Request) => {
			requested.push(new URL(request.url).pathname);
			return new Response(JSON.stringify(body), { status });
		},
	};
}

describe("blog manifest", () => {
	it("parses posts newest first and skips malformed entries", () => {
		const posts = manifestPostsFromJson({
			posts: [...manifest.posts, { slug: "broken" }, null],
		});
		expect(posts.map((post) => post.slug)).toEqual(["newer", "hello-world"]);
		expect(posts[0].revise_date?.toISOString()).toBe(
			"2026-09-20T00:00:00.000Z",
		);
		expect(manifestPostsFromJson(null)).toEqual([]);
	});

	it("reads the manifest from static assets", async () => {
		const fetcher = assets(manifest);
		const posts = await loadBlogManifestPosts(fetcher, ORIGIN);
		expect(fetcher.requested).toEqual([BLOG_MANIFEST_PATH]);
		expect(posts).toHaveLength(2);
	});

	it("returns no posts when the asset is missing", async () => {
		expect(await loadBlogManifestPosts(assets({}, 404), ORIGIN)).toEqual([]);
		expect(await loadBlogManifestPosts(undefined, ORIGIN)).toEqual([]);
	});

	it("builds the llms.txt blog section and llms-full.txt from the manifest", async () => {
		const section = await readLlmsBlogSection(assets(manifest), ORIGIN);
		expect(section).toContain(
			"- [Newer](https://ta93abe.com/blog/newer/) — 新しい投稿",
		);
		const full = await buildLlmsFullText(assets(manifest), ORIGIN);
		expect(full).toContain("## https://ta93abe.com/blog/hello-world/");
		expect(full).toContain("ブログを始めようじゃないか。");
	});

	it("uses the newest post date as the blog sitemap lastmod", async () => {
		const xml = await loadSitemapIndexXml(
			assets(manifest),
			ORIGIN,
			{},
			new Date("2026-11-15T00:00:00Z"),
		);
		expect(xml).toContain("https://ta93abe.com/sitemap-blog.xml");
		expect(xml).toContain("2026-09-20");
	});
});
