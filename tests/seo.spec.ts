import { expect, test } from "@playwright/test";

async function pageHtml(
	request: {
		get: (url: string) => Promise<{ text: () => Promise<string> }>;
	},
	path: string,
) {
	return (await request.get(path)).text();
}

const AGENT_DISCOVERY_SNIPPETS = [
	'rel="describedby" href="https://ta93abe.com/llms.txt" type="text/plain"',
	'rel="describedby" href="https://ta93abe.com/llms-full.txt" type="text/plain"',
	'rel="api-catalog" href="https://ta93abe.com/.well-known/api-catalog" type="application/linkset+json"',
	'rel="service-desc" href="https://ta93abe.com/.well-known/mcp/server-card.json" type="application/json"',
	'rel="describedby" href="https://ta93abe.com/.well-known/agent-skills/index.json" type="application/json"',
	'rel="describedby" href="https://ta93abe.com/.well-known/agent-card.json" type="application/json"',
	'rel="describedby" href="https://ta93abe.com/auth.md" type="text/markdown"',
	'rel="alternate" href="https://ta93abe.com/rss.xml" type="application/rss+xml"',
] as const;

test.describe("Sitewide SEO", () => {
	test("home, about, and blog HTML advertise agent discovery links", async ({
		request,
	}) => {
		for (const path of ["/", "/about", "/blog", "/blog/hello-world"]) {
			const html = await pageHtml(request, path);
			for (const snippet of AGENT_DISCOVERY_SNIPPETS) {
				expect(html, `${path} missing ${snippet}`).toContain(snippet);
			}
		}
	});

	test("home advertises the ARD capability catalog", async ({ request }) => {
		const html = await pageHtml(request, "/");
		expect(html).toContain('rel="ai-catalog"');
		expect(html).toContain("https://ta93abe.com/.well-known/ai-catalog.json");
		expect(html).toContain('rel="ard"');
		expect(html).toContain("https://ta93abe.com/.well-known/ard.json");
	});

	test("public HTML advertises a markdown alternate of the same URL", async ({
		request,
	}) => {
		const cases = [
			["/", "https://ta93abe.com/"],
			["/about", "https://ta93abe.com/about/"],
			["/blog", "https://ta93abe.com/blog/"],
			["/blog/hello-world", "https://ta93abe.com/blog/hello-world/"],
		] as const;

		for (const [path, href] of cases) {
			const html = await pageHtml(request, path);
			expect(html, path).toContain(
				`rel="alternate" type="text/markdown" href="${href}"`,
			);
			expect(html, path).not.toContain(`${href}.md`);
		}
	});

	test("home has WebSite, Person, and the default OG image", async ({
		request,
	}) => {
		const html = await pageHtml(request, "/");
		expect(html).toContain('"@type":"WebSite"');
		expect(html).toContain('"@type":"Person"');
		expect(html).toContain('"image":"https://ta93abe.com/og/about.png"');
		expect(html).toContain("/og/default.png");
		expect(html).toContain("summary_large_image");
		expect(html).toContain('href="https://ta93abe.com/"');
		expect(html).toContain('property="og:image:type" content="image/png"');
	});

	test("pages advertise a small PNG favicon and a separate apple-touch-icon", async ({
		request,
	}) => {
		for (const path of ["/", "/about"]) {
			const html = await pageHtml(request, path);
			expect(html, path).toContain('rel="icon" type="image/png"');
			expect(html, path).toContain('href="/favicon.png"');
			expect(html, path).toContain('rel="apple-touch-icon"');
			expect(html, path).toContain('href="/apple-touch-icon.png"');
		}

		const favicon = await request.get("/favicon.png");
		const apple = await request.get("/apple-touch-icon.png");
		expect(favicon.ok()).toBe(true);
		expect(apple.ok()).toBe(true);
		expect((await favicon.body()).byteLength).toBeLessThanOrEqual(8 * 1024);
		expect((await apple.body()).byteLength).toBeLessThanOrEqual(32 * 1024);
	});

	test("section pages have dedicated OG images and page JSON-LD", async ({
		request,
	}) => {
		const cases = [
			{
				path: "/about",
				og: "https://ta93abe.com/og/about.png",
				type: "ProfilePage",
				canonical: "https://ta93abe.com/about/",
			},
			{
				path: "/works",
				og: "https://ta93abe.com/og/works.png",
				type: "SoftwareSourceCode",
				canonical: "https://ta93abe.com/works/",
			},
			{
				path: "/talks",
				og: "https://ta93abe.com/og/talks.png",
				type: "Event",
				canonical: "https://ta93abe.com/talks/",
			},
			{
				path: "/blog",
				og: "https://ta93abe.com/og/blog.png",
				type: "CollectionPage",
				canonical: "https://ta93abe.com/blog/",
			},
			{
				path: "/contact",
				og: "https://ta93abe.com/og/contact.png",
				type: "ContactPage",
				canonical: "https://ta93abe.com/contact/",
			},
			{
				path: "/links",
				og: "https://ta93abe.com/og/links.png",
				type: "CollectionPage",
				canonical: "https://ta93abe.com/links/",
			},
			{
				path: "/tools",
				og: "https://ta93abe.com/og/tools.png",
				type: "SoftwareApplication",
				canonical: "https://ta93abe.com/tools/",
			},
		] as const;

		for (const item of cases) {
			const html = await pageHtml(request, item.path);
			expect(html, item.path).toContain(item.og);
			expect(html, item.path).toContain(`"@type":"${item.type}"`);
			expect(html, item.path).toContain('"@type":"BreadcrumbList"');
			expect(html, item.path).toContain(item.canonical);
			expect(html, item.path).toContain("summary_large_image");
			expect(html, item.path).toContain(
				'property="og:image:type" content="image/png"',
			);
		}
	});

	test("404 is noindex and has no JSON-LD", async ({ request }) => {
		const html = await pageHtml(request, "/blog/does-not-exist");
		expect(html).toContain('name="robots" content="noindex, nofollow"');
		expect(html).not.toContain("application/ld+json");
	});

	test("SNS profile links advertise rel=me", async ({ page }) => {
		await page.goto("/links");
		await expect(
			page.locator('.sns-links a[href*="github.com"]').first(),
		).toHaveAttribute("rel", /me/);
	});

	test("robots.txt allows search bots and disallows training-only UAs", async ({
		request,
	}) => {
		const response = await request.get("/robots.txt");
		expect(response.ok()).toBeTruthy();
		expect(response.headers()["content-signal"]).toBe(
			"ai-train=no, search=yes, ai-input=yes",
		);
		const body = await response.text();
		expect(body).toContain(
			"Content-Signal: ai-train=no, search=yes, ai-input=yes",
		);
		expect(body).toContain("Sitemap: https://ta93abe.com/sitemap.xml");
		expect(body).toMatch(/User-agent:\s*Applebot-Extended\s*\nDisallow:\s*\//i);
		expect(body).toMatch(
			/User-agent:\s*Meta-ExternalAgent\s*\nDisallow:\s*\//i,
		);
		expect(body).toMatch(/User-agent:\s*anthropic-ai\s*\nDisallow:\s*\//i);
		expect(body).toMatch(/User-agent:\s*Meta-ExternalFetcher\s*\nAllow:\s*\//i);
		expect(body).toMatch(/User-agent:\s*GPTBot\s*\nAllow:\s*\//i);
	});
});
