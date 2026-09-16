import { FEATURED_WORKS, SITE } from "../../src/config/site.ts";
import linksData from "../../src/data/links.json";
import { isValidSlug } from "./collections.ts";
import { publishDateValue, reviseDateValue, toDate } from "./dates.ts";
import { feedPostsFromEntries, sortFeedPosts } from "./derived.ts";
import { looksLikeMdx, parseMarkdownDocument } from "./frontmatter.ts";
import { readCollectionIndex } from "./index-store.ts";
import { markdownKey } from "./keys.ts";
import { validateFrontmatter } from "./schema.ts";

const DEFAULT_ORIGIN = SITE.url;

export type PageMarkdownResult =
	| { kind: "markdown"; body: string }
	| { kind: "not-found" }
	| { kind: "skip" };

const STATIC_MARKDOWN_PAGES = new Set([
	"/about",
	"/works",
	"/contact",
	"/links",
]);

export function acceptsMarkdown(request: Request): boolean {
	return (
		request.headers.get("Accept")?.toLowerCase().includes("text/markdown") ??
		false
	);
}

export function parseBlogPostSlug(pathname: string): string | null {
	const match = /^\/blog\/([^/]+)$/.exec(pathname);
	if (!match) {
		return null;
	}
	return isValidSlug(match[1]) ? match[1] : null;
}

export function isMarkdownNegotiablePath(pathname: string): boolean {
	if (pathname === "/" || pathname === "/blog") {
		return true;
	}
	if (STATIC_MARKDOWN_PAGES.has(pathname)) {
		return true;
	}
	return parseBlogPostSlug(pathname) !== null;
}

export function markdownTokenCount(markdown: string): number {
	return markdown.split(/\s+/).filter(Boolean).length;
}

function originBase(origin: string): string {
	return origin.replace(/\/+$/, "");
}

function yamlScalar(value: string): string {
	if (
		value === "" ||
		value !== value.trim() ||
		/[\n\r]/.test(value) ||
		/^[-?:]/.test(value) ||
		/[#:] /.test(value) ||
		/[{}[\],&*?|>!<@`'"]/.test(value)
	) {
		return JSON.stringify(value);
	}
	return value;
}

function yamlDate(value: unknown): string | undefined {
	if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
		return value.slice(0, 10);
	}
	return toDate(value)?.toISOString().slice(0, 10);
}

function withTitleHeading(title: string, body: string): string {
	const trimmed = body.trim();
	const heading = `# ${title}`;
	if (trimmed === heading || trimmed.startsWith(`${heading}\n`)) {
		return trimmed;
	}
	return trimmed.length > 0 ? `${heading}\n\n${trimmed}` : heading;
}

function snsMarkdown(): string {
	return linksData.links
		.map((link) => `- [${link.name}](${link.url})`)
		.join("\n");
}

function featuredWorksMarkdown(): string {
	return FEATURED_WORKS.map(
		(work) => `- [${work.title}](${work.href}) — ${work.excerpt}`,
	).join("\n");
}

function blogPostDocument(input: {
	title: string;
	excerpt: string;
	body: string;
	canonical: string;
	publishDate?: unknown;
	reviseDate?: unknown;
	tags: string[];
}): string {
	const lines = [
		`title: ${yamlScalar(input.title)}`,
		`description: ${yamlScalar(input.excerpt)}`,
		`canonical: ${yamlScalar(input.canonical)}`,
	];
	const published = yamlDate(input.publishDate);
	if (published) {
		lines.push(`publish_date: ${published}`);
	}
	const revised = yamlDate(input.reviseDate);
	if (revised) {
		lines.push(`revise_date: ${revised}`);
	}
	if (input.tags.length > 0) {
		lines.push("tags:");
		for (const tag of input.tags) {
			lines.push(`  - ${yamlScalar(tag)}`);
		}
	}

	return `---\n${lines.join("\n")}\n---\n\n${withTitleHeading(input.title, input.body)}\n`;
}

async function blogPostMarkdown(
	bucket: R2Bucket,
	slug: string,
	origin: string,
): Promise<string | null> {
	const object = await bucket.get(markdownKey("blog", slug));
	if (!object) {
		return null;
	}

	const markdown = await object.text();
	if (looksLikeMdx(markdown)) {
		return null;
	}

	try {
		const parsed = parseMarkdownDocument(markdown);
		const validated = validateFrontmatter("blog", parsed.frontmatter);
		if (!validated.ok) {
			return null;
		}

		const tags = Array.isArray(validated.data.tags)
			? validated.data.tags.filter(
					(tag): tag is string => typeof tag === "string",
				)
			: [];

		return blogPostDocument({
			title: validated.data.title,
			excerpt: validated.data.excerpt,
			body: parsed.body,
			canonical: `${originBase(origin)}/blog/${slug}/`,
			publishDate: publishDateValue(validated.data),
			reviseDate: reviseDateValue(validated.data),
			tags,
		});
	} catch {
		return null;
	}
}

async function blogIndexMarkdown(
	bucket: R2Bucket,
	origin: string,
): Promise<string> {
	const index = await readCollectionIndex(bucket, "blog");
	const posts = sortFeedPosts(feedPostsFromEntries(index.entries));
	const base = originBase(origin);
	const header = `# Blog\n\n技術ブログ。日々の学びや開発の記録を共有しています。\n`;
	if (posts.length === 0) {
		return `${header}\nまだ記事を置いていません。\n`;
	}

	const items = posts.map(
		(post) => `- [${post.title}](${base}/blog/${post.slug}/) — ${post.excerpt}`,
	);
	return `${header}\n${items.join("\n")}\n`;
}

function aboutMarkdown(origin: string): string {
	const base = originBase(origin);
	return `# About

${SITE.handle}

${SITE.name}

${SITE.tagline}

## 代表作

${featuredWorksMarkdown()}

[Works](${base}/works/)

## SNS

${snsMarkdown()}

連絡は [Contact](${base}/contact/) からどうぞ。
`;
}

function worksMarkdown(): string {
	return `# Works

GitHub に置いている代表作です。

${featuredWorksMarkdown()}
`;
}

function contactMarkdown(): string {
	return `# Contact

連絡は SNS からどうぞ。いちばん反応しやすいのは X（@ta93abe_）です。

## SNS

${snsMarkdown()}
`;
}

function linksMarkdown(): string {
	return `# Links

いま主に使っている場所です。コードは GitHub、記事は Zenn、日々の発信は X、ニュースレターは Substack。

${snsMarkdown()}
`;
}

export async function loadNegotiatedMarkdown(
	pathname: string,
	bucket: R2Bucket,
	origin: string = DEFAULT_ORIGIN,
): Promise<PageMarkdownResult> {
	if (pathname === "/blog") {
		return {
			kind: "markdown",
			body: await blogIndexMarkdown(bucket, origin),
		};
	}

	const slug = parseBlogPostSlug(pathname);
	if (slug) {
		const body = await blogPostMarkdown(bucket, slug, origin);
		return body ? { kind: "markdown", body } : { kind: "not-found" };
	}

	if (pathname === "/about") {
		return { kind: "markdown", body: aboutMarkdown(origin) };
	}
	if (pathname === "/works") {
		return { kind: "markdown", body: worksMarkdown() };
	}
	if (pathname === "/contact") {
		return { kind: "markdown", body: contactMarkdown() };
	}
	if (pathname === "/links") {
		return { kind: "markdown", body: linksMarkdown() };
	}

	return { kind: "skip" };
}
