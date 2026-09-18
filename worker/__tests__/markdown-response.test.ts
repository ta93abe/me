import { describe, expect, it } from "vitest";

import {
	acceptsMarkdown,
	htmlOriginRequest,
	MARKDOWN_CONTENT_TYPE,
	negotiateHtmlMarkdown,
	withAcceptVary,
} from "../markdown-response.ts";

const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=yes";

const pages: Record<string, string> = {
	"/": `<!doctype html><html><head>
		<title>Takumi Abe (ta93abe) | Software Engineer</title>
		<meta name="description" content="homepage description">
		<script type="application/ld+json">{"@type":"Person","name":"Takumi Abe"}</script>
	</head><body><div id="main-content"><h1>Takumi Abe</h1><p>Works About Blog Contact</p></div></body></html>`,
	"/about/": `<!doctype html><html><head>
		<title>About | Takumi Abe</title>
		<meta name="description" content="about description">
		<script type="application/ld+json">{"@type":"ProfilePage","name":"About"}</script>
	</head><body><div id="main-content"><h1>About</h1><p>about body</p></div></body></html>`,
	"/blog/": `<!doctype html><html><head>
		<title>Blog | Takumi Abe</title>
		<meta name="description" content="blog description">
		<script type="application/ld+json">{"@type":"CollectionPage","name":"Blog"}</script>
	</head><body><div id="main-content"><h1>Blog</h1><p>blog index body</p></div></body></html>`,
	"/blog/hello/": `<!doctype html><html><head>
		<title>Hello Workers | Blog | Takumi Abe</title>
		<meta name="description" content="post description">
		<script type="application/ld+json">{"@type":"BlogPosting","headline":"Hello Workers"}</script>
	</head><body><div id="main-content"><h1>Hello Workers</h1><p>post body</p></div></body></html>`,
	"/contact/": `<!doctype html><html><head>
		<title>Contact | Takumi Abe</title>
		<meta name="description" content="contact description">
		<script type="application/ld+json">{"@type":"ContactPage","name":"Contact"}</script>
	</head><body><div id="main-content"><h1>Contact</h1><p>contact body</p></div></body></html>`,
	"/works/": `<!doctype html><html><head>
		<title>Works | Takumi Abe</title>
		<meta name="description" content="works description">
		<script type="application/ld+json">{"@type":"CollectionPage","name":"Works"}</script>
	</head><body><div id="main-content"><h1>Works</h1><p>works body</p></div></body></html>`,
};

const publicRoutes = [
	"/",
	"/about/",
	"/blog/",
	"/blog/hello/",
	"/contact/",
	"/works/",
] as const;

function markdownRequest(path: string): Request {
	return new Request(`https://ta93abe.com${path}`, {
		headers: { Accept: "text/markdown" },
	});
}

function htmlRequest(path: string): Request {
	return new Request(`https://ta93abe.com${path}`, {
		headers: { Accept: "text/html" },
	});
}

function htmlResponse(path: string): Response {
	return new Response(pages[path], {
		status: 200,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			ETag: '"html-1"',
			"Cache-Control": "public, s-maxage=300",
		},
	});
}

class UrlOnlyCache {
	private readonly store = new Map<string, Response>();

	async match(request: Request): Promise<Response | undefined> {
		const hit = this.store.get(request.url);
		return hit?.clone();
	}

	async put(request: Request, response: Response): Promise<void> {
		this.store.set(request.url, response.clone());
	}
}

async function fetchOriginHtml(
	request: Request,
	cache: UrlOnlyCache,
): Promise<Response> {
	const origin = htmlOriginRequest(request);
	const cached = await cache.match(origin);
	if (cached) {
		return cached;
	}
	const path = new URL(origin.url).pathname;
	const response = htmlResponse(path);
	await cache.put(origin, response.clone());
	return response;
}

async function handlePublicPage(
	request: Request,
	cache: UrlOnlyCache,
): Promise<Response> {
	const html = await fetchOriginHtml(request, cache);
	return negotiateHtmlMarkdown(request, html, {
		contentSignal: CONTENT_SIGNAL,
	});
}

describe("markdown content negotiation", () => {
	it("converts representative public HTML routes", async () => {
		for (const path of publicRoutes) {
			const response = await negotiateHtmlMarkdown(
				markdownRequest(path),
				htmlResponse(path),
				{ contentSignal: CONTENT_SIGNAL },
			);
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe(MARKDOWN_CONTENT_TYPE);
			expect(response.headers.get("Vary")).toMatch(/Accept/i);
			expect(response.headers.get("Content-Signal")).toBe(CONTENT_SIGNAL);
			expect(response.headers.get("ETag")).toBeNull();
			const markdown = await response.text();
			expect(markdown).toContain("title:");
			expect(markdown).toContain("description:");
			expect(markdown).toContain("```json");
			expect(markdown).toMatch(/^# /m);
		}
	});

	it("keeps ordinary HTML requests as text/html with Vary: Accept", async () => {
		const response = withAcceptVary(htmlResponse("/about/"));
		expect(response.headers.get("Content-Type")).toContain("text/html");
		expect(response.headers.get("Vary")).toMatch(/Accept/i);
		expect(await response.text()).toContain("<h1>About</h1>");
	});

	it("does not convert non-HTML responses", async () => {
		const xml = new Response("<rss />", {
			headers: { "Content-Type": "application/xml; charset=utf-8" },
		});
		const response = await negotiateHtmlMarkdown(
			markdownRequest("/rss.xml"),
			xml,
		);
		expect(response.headers.get("Content-Type")).toContain("application/xml");
	});

	it("omits the body for HEAD markdown requests", async () => {
		const request = new Request("https://ta93abe.com/about/", {
			method: "HEAD",
			headers: { Accept: "text/markdown" },
		});
		const response = await negotiateHtmlMarkdown(
			request,
			htmlResponse("/about/"),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(MARKDOWN_CONTENT_TYPE);
		expect(await response.text()).toBe("");
	});

	it("does not convert error HTML", async () => {
		const missing = new Response("<h1>Not Found</h1>", {
			status: 404,
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
		const response = await negotiateHtmlMarkdown(
			markdownRequest("/missing/"),
			missing,
		);
		expect(response.status).toBe(404);
		expect(response.headers.get("Content-Type")).toContain("text/html");
	});

	it("rewrites markdown Accept so origin/cache fetches stay HTML", () => {
		const origin = htmlOriginRequest(markdownRequest("/blog/"));
		expect(acceptsMarkdown(markdownRequest("/blog/"))).toBe(true);
		expect(acceptsMarkdown(origin)).toBe(false);
		expect(origin.headers.get("Accept")).toBe("text/html");
		expect(origin.method).toBe("GET");
		expect(origin.url).toBe("https://ta93abe.com/blog/");

		const headOrigin = htmlOriginRequest(
			new Request("https://ta93abe.com/about/", {
				method: "HEAD",
				headers: { Accept: "text/markdown" },
			}),
		);
		expect(headOrigin.method).toBe("GET");
		expect(headOrigin.headers.get("Accept")).toBe("text/html");
	});

	it("keeps HTML and Markdown variants isolated regardless of request order", async () => {
		const markdownFirst = new UrlOnlyCache();
		const htmlFirst = new UrlOnlyCache();

		const markdownThenHtml = [
			await handlePublicPage(markdownRequest("/about/"), markdownFirst),
			await handlePublicPage(htmlRequest("/about/"), markdownFirst),
		];
		const htmlThenMarkdown = [
			await handlePublicPage(htmlRequest("/about/"), htmlFirst),
			await handlePublicPage(markdownRequest("/about/"), htmlFirst),
		];

		for (const [markdown, html] of [
			markdownThenHtml,
			[htmlThenMarkdown[1], htmlThenMarkdown[0]],
		]) {
			expect(markdown?.headers.get("Content-Type")).toBe(MARKDOWN_CONTENT_TYPE);
			expect(markdown?.headers.get("Vary")).toMatch(/Accept/i);
			expect(await markdown?.clone().text()).toContain("# About");
			expect(await markdown?.clone().text()).not.toContain("<h1>");
			expect(html?.headers.get("Content-Type")).toContain("text/html");
			expect(html?.headers.get("Vary")).toMatch(/Accept/i);
			expect(await html?.clone().text()).toContain("<h1>About</h1>");
		}
	});
});
