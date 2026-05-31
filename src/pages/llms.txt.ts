import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { SITE } from "../config/site";

export async function GET(context: APIContext) {
	const base = context.site?.toString().replace(/\/$/, "") ?? SITE.url;

	const [blog, works, books] = await Promise.all([
		getCollection("blog"),
		getCollection("works"),
		getCollection("books"),
	]);

	const sortedBlog = blog.sort(
		(a, b) => b.data.date.getTime() - a.data.date.getTime(),
	);
	const sortedWorks = works.sort(
		(a, b) => b.data.startDate.getTime() - a.data.startDate.getTime(),
	);

	const lines: string[] = [
		`# ${SITE.author}`,
		`> ${SITE.description}`,
		`> Site: ${base}`,
		"",
		"## Pages",
		"",
		`- [Home](${base}/)`,
		`- [Works](${base}/works/)`,
		`- [Blog](${base}/blog/)`,
		`- [Bookshelf](${base}/bookshelf/)`,
		`- [Slides](${base}/slides/)`,
		`- [Links](${base}/links/)`,
		`- [Tools](${base}/tools/)`,
		"",
		"## Blog Posts",
		"",
		...sortedBlog.map(
			(post) =>
				`- [${post.data.title}](${base}/blog/${post.id}/) — ${post.data.excerpt ?? ""}`,
		),
		"",
		"## Works",
		"",
		...sortedWorks.map(
			(work) =>
				`- [${work.data.title}](${base}/works/${work.id}/) — ${work.data.excerpt ?? ""}`,
		),
		"",
		"## Bookshelf",
		"",
		...books.map(
			(book) =>
				`- [${book.data.title}](${base}/bookshelf/${book.id}/) — ${book.data.author}`,
		),
		"",
		"## Feeds",
		"",
		`- RSS: ${base}/rss.xml`,
		`- Sitemap: ${base}/sitemap-index.xml`,
		"",
		"## Notes for AI Agents",
		"",
		"- Request Markdown: append /index.md to any page URL",
		"- MCP Server Card: /.well-known/mcp.json",
	];

	return new Response(lines.join("\n"), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
