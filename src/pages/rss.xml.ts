import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
	const blog = await getCollection("blog");
	const sortedPosts = blog.sort(
		(a, b) => b.data.date.getTime() - a.data.date.getTime(),
	);

	return rss({
		title: "ta93abe | Blog",
		description: "技術ブログ。日々の学びや開発の記録を共有しています。",
		site: context.site?.toString() ?? "http://localhost:4321",
		items: sortedPosts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.date,
			description: post.data.excerpt,
			link: `/blog/${post.id}/`,
		})),
		customData: "<language>ja</language>",
	});
}
