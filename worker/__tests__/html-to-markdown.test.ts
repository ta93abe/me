import { describe, expect, it } from "vitest";

import { htmlToAgentMarkdown } from "../html-to-markdown.ts";

function pageHtml(options: {
	title: string;
	description: string;
	image?: string;
	jsonLd?: unknown[];
	main: string;
}): string {
	const image = options.image
		? `<meta property="og:image" content="${options.image}">`
		: "";
	const jsonLd = (options.jsonLd ?? [])
		.map(
			(value) =>
				`<script type="application/ld+json">${JSON.stringify(value)}</script>`,
		)
		.join("\n");
	return `<!doctype html>
<html lang="ja">
<head>
<title>${options.title}</title>
<meta name="description" content="${options.description}">
<meta property="og:title" content="og should not win">
<meta property="og:description" content="og description should not win">
${image}
${jsonLd}
</head>
<body>
<a class="skip-link" href="#main-content">コンテンツにスキップ</a>
<header>
<nav aria-label="メインナビゲーション">
<a href="/about">About</a>
</nav>
</header>
<div id="main-content">
${options.main}
</div>
<footer><p>site footer should be stripped</p></footer>
<script>window.tracker = true</script>
</body>
</html>`;
}

const homeHtml = pageHtml({
	title: "Takumi Abe (ta93abe) | Software Engineer",
	description:
		"データ基盤と CI を書くソフトウェアエンジニア、Takumi Abe (ta93abe) のポートフォリオ。絵と音楽も置く。",
	image: "https://ta93abe.com/og/default.png",
	jsonLd: [
		{
			"@context": "https://schema.org",
			"@type": "Person",
			name: "Takumi Abe",
		},
		{
			"@context": "https://schema.org",
			"@type": "WebSite",
			name: "Takumi Abe",
		},
	],
	main: `<main>
		<h1>Takumi Abe</h1>
		<nav aria-label="主なページ">
			<a href="/works">Works</a>
			<a href="/about">About</a>
			<a href="/blog">Blog</a>
			<a href="/contact">Contact</a>
		</nav>
	</main>`,
});

const aboutHtml = pageHtml({
	title: "About | Takumi Abe",
	description: "データ基盤と CI を書くソフトウェアエンジニア。絵と音楽も置く。",
	image: "https://ta93abe.com/og/about.png",
	jsonLd: [
		{
			"@context": "https://schema.org",
			"@type": "ProfilePage",
			name: "About",
			description: "about page",
		},
	],
	main: `<main>
		<h1>About</h1>
		<p>データ基盤と CI を書くソフトウェアエンジニア。</p>
		<h2>代表作</h2>
		<ul>
			<li>
				<a href="https://github.com/ta93abe/dbt-jobs">
					<span>dbt-jobs</span>
					<span>dbt の CI/CD パイプライン</span>
				</a>
			</li>
		</ul>
	</main>`,
});

const blogIndexHtml = pageHtml({
	title: "Blog | Takumi Abe",
	description: "技術ブログ。日々の学びや開発の記録を共有しています。",
	image: "https://ta93abe.com/og/blog.png",
	jsonLd: [
		{
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			name: "Blog",
		},
	],
	main: `<main>
		<h1>Blog</h1>
		<p>技術ブログ。日々の学びや開発の記録を共有しています。</p>
		<ul>
			<li><a href="/blog/hello/">Hello Workers</a></li>
		</ul>
	</main>`,
});

const blogPostHtml = pageHtml({
	title: "Hello Workers | Blog | Takumi Abe",
	description: "A short note from the edge.",
	image: "https://ta93abe.com/og/blog/hello.png",
	jsonLd: [
		{
			"@context": "https://schema.org",
			"@type": "BlogPosting",
			headline: "Hello Workers",
		},
	],
	main: `<main>
		<h1>Hello Workers</h1>
		<article>
			<p>Published from curl.</p>
			<pre><code class="language-ts">const n = 1;</code></pre>
		</article>
	</main>`,
});

const contactHtml = pageHtml({
	title: "Contact | Takumi Abe",
	description: "SNS から連絡できます。",
	image: "https://ta93abe.com/og/contact.png",
	jsonLd: [
		{
			"@context": "https://schema.org",
			"@type": "ContactPage",
			name: "Contact",
		},
	],
	main: `<main>
		<h1>Contact</h1>
		<p>連絡は SNS からどうぞ。</p>
		<ul>
			<li><a href="https://x.com/ta93abe_">X</a></li>
		</ul>
	</main>`,
});

const worksHtml = pageHtml({
	title: "Works | Takumi Abe",
	description: "代表作。dbt-jobs、dbt-intro、enbu。",
	image: "https://ta93abe.com/og/works.png",
	jsonLd: [
		{
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			name: "Works",
		},
	],
	main: `<main>
		<h1>Works</h1>
		<p>GitHub に置いている代表作です。</p>
		<ul>
			<li><a href="https://github.com/ta93abe/enbu">enbu</a></li>
		</ul>
	</main>`,
});

describe("htmlToAgentMarkdown", () => {
	it("keeps title, description, body, and JSON-LD for the homepage", () => {
		const { markdown } = htmlToAgentMarkdown(homeHtml);
		expect(markdown).toContain("title: ");
		expect(markdown).toContain("Takumi Abe (ta93abe) | Software Engineer");
		expect(markdown).toContain("description: ");
		expect(markdown).toContain("データ基盤と CI");
		expect(markdown).toContain("# Takumi Abe");
		expect(markdown).toContain("[About](/about)");
		expect(markdown).toContain("[Blog](/blog)");
		expect(markdown).toContain('"@type":"Person"');
		expect(markdown).toContain('"@type":"WebSite"');
		expect(markdown).not.toContain("og should not win");
		expect(markdown).not.toContain("site footer should be stripped");
		expect(markdown).not.toContain("メインナビゲーション");
	});

	it("keeps page-specific fields for about, blog, contact, and works", () => {
		const cases = [
			{
				html: aboutHtml,
				title: "About | Takumi Abe",
				heading: "# About",
				body: "データ基盤と CI を書くソフトウェアエンジニア。",
				type: "ProfilePage",
			},
			{
				html: blogIndexHtml,
				title: "Blog | Takumi Abe",
				heading: "# Blog",
				body: "技術ブログ",
				type: "CollectionPage",
			},
			{
				html: blogPostHtml,
				title: "Hello Workers | Blog | Takumi Abe",
				heading: "# Hello Workers",
				body: "Published from curl.",
				type: "BlogPosting",
			},
			{
				html: contactHtml,
				title: "Contact | Takumi Abe",
				heading: "# Contact",
				body: "連絡は SNS からどうぞ。",
				type: "ContactPage",
			},
			{
				html: worksHtml,
				title: "Works | Takumi Abe",
				heading: "# Works",
				body: "GitHub に置いている代表作です。",
				type: "CollectionPage",
			},
		];

		for (const entry of cases) {
			const { markdown } = htmlToAgentMarkdown(entry.html);
			expect(markdown).toContain(entry.title);
			expect(markdown).toContain(entry.heading);
			expect(markdown).toContain(entry.body);
			expect(markdown).toContain(`"@type":"${entry.type}"`);
			expect(markdown).toMatch(/^---\n/);
			expect(markdown).toContain("```json");
		}
	});

	it("prefers standard meta tags over Open Graph fallbacks", () => {
		const { markdown } = htmlToAgentMarkdown(aboutHtml);
		expect(markdown).toContain("title: ");
		expect(markdown).not.toContain("og should not win");
		expect(markdown).not.toContain("og description should not win");
		expect(markdown).toContain("https://ta93abe.com/og/about.png");
	});

	it("converts fenced code from Prism markup", () => {
		const { markdown } = htmlToAgentMarkdown(blogPostHtml);
		expect(markdown).toContain("```ts\nconst n = 1;\n```");

		const prismHtml = pageHtml({
			title: "Code",
			description: "highlighted",
			main: `<pre class="language-ts"><code class="language-ts"><span class="token">const</span> n = 1;</code></pre>`,
		});
		expect(htmlToAgentMarkdown(prismHtml).markdown).toContain(
			"```ts\nconst n = 1;\n```",
		);
	});

	it("omits frontmatter when no supported meta tags exist", () => {
		const { markdown } = htmlToAgentMarkdown(
			"<html><body><main><p>Hello</p></main></body></html>",
		);
		expect(markdown).not.toContain("---");
		expect(markdown).toContain("Hello");
	});
});
