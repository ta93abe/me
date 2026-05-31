import type { APIContext } from "astro";
import { SITE } from "../../config/site";

export async function GET(context: APIContext) {
	const base = context.site?.toString().replace(/\/$/, "") ?? SITE.url;

	const card = {
		$schema:
			"https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
		version: "1.0",
		serverInfo: {
			name: "ta93abe-site",
			title: `${SITE.author}'s Portfolio Site`,
			description: SITE.description,
			url: base,
		},
		transport: {
			type: "streamable-http",
			endpoint: `${base}/mcp`,
		},
		capabilities: {
			tools: true,
		},
		tools: [
			{
				name: "get_llms_txt",
				description:
					"Get the full content index of this site in llms.txt format. Use this first to discover all available pages and blog posts.",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
			{
				name: "get_page_markdown",
				description:
					"Get a specific page as Markdown by appending /index.md to its URL (e.g. /blog/my-post/index.md).",
				inputSchema: {
					type: "object",
					properties: {
						path: {
							type: "string",
							description:
								"Page path ending with /index.md (e.g. /blog/first-post/index.md)",
						},
					},
					required: ["path"],
				},
			},
		],
		feeds: {
			rss: `${base}/rss.xml`,
			sitemap: `${base}/sitemap-index.xml`,
		},
		llmsTxt: `${base}/llms.txt`,
	};

	return new Response(JSON.stringify(card, null, 2), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=3600",
			"Access-Control-Allow-Origin": "*",
		},
	});
}
