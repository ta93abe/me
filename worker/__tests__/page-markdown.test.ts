import { describe, expect, it } from "vitest";

import { rebuildContentIndexes } from "../content/index-store.ts";
import {
	acceptsMarkdown,
	isMarkdownNegotiablePath,
	loadNegotiatedMarkdown,
	parseBlogPostSlug,
} from "../content/page-markdown.ts";
import { createMemoryR2 } from "./memory-r2.ts";

const HELLO = `---
title: Hello World
excerpt: First post on the site.
publish_date: 2026-09-12
tags:
  - intro
---

サイトを公開しました。段落です。
`;

const SNOWFLAKE = `---
title: Snowflake World Tour Tokyo 2026
excerpt: Notes from the expo floor.
publish_date: 2026-09-13
---

シアターセッションを反復横跳びしていました。
`;

describe("acceptsMarkdown", () => {
	it("matches text/markdown in Accept", () => {
		expect(
			acceptsMarkdown(
				new Request("https://ta93abe.com/blog/hello-world/", {
					headers: { Accept: "text/markdown" },
				}),
			),
		).toBe(true);
		expect(
			acceptsMarkdown(
				new Request("https://ta93abe.com/blog/hello-world/", {
					headers: { Accept: "text/html, text/markdown;q=0.9" },
				}),
			),
		).toBe(true);
	});

	it("ignores HTML-only Accept", () => {
		expect(
			acceptsMarkdown(
				new Request("https://ta93abe.com/blog/hello-world/", {
					headers: { Accept: "text/html" },
				}),
			),
		).toBe(false);
		expect(
			acceptsMarkdown(new Request("https://ta93abe.com/blog/hello-world/")),
		).toBe(false);
	});
});

describe("markdown negotiable paths", () => {
	it("covers homepage, blog, and primary sections", () => {
		expect(isMarkdownNegotiablePath("/")).toBe(true);
		expect(isMarkdownNegotiablePath("/blog")).toBe(true);
		expect(isMarkdownNegotiablePath("/blog/hello-world")).toBe(true);
		expect(isMarkdownNegotiablePath("/about")).toBe(true);
		expect(isMarkdownNegotiablePath("/works")).toBe(true);
		expect(isMarkdownNegotiablePath("/contact")).toBe(true);
		expect(isMarkdownNegotiablePath("/links")).toBe(true);
	});

	it("skips assets and other sections", () => {
		expect(isMarkdownNegotiablePath("/tools")).toBe(false);
		expect(isMarkdownNegotiablePath("/favicon.png")).toBe(false);
		expect(parseBlogPostSlug("/blog/Not_Valid")).toBeNull();
	});
});

describe("loadNegotiatedMarkdown", () => {
	it("returns the article title and body without chrome", async () => {
		const bucket = createMemoryR2();
		await bucket.put("md/blog/hello-world.md", HELLO);

		const result = await loadNegotiatedMarkdown("/blog/hello-world", bucket);
		expect(result.kind).toBe("markdown");
		if (result.kind !== "markdown") {
			return;
		}

		expect(result.body).toContain("title: Hello World");
		expect(result.body).toContain("# Hello World");
		expect(result.body).toContain("サイトを公開しました。段落です。");
		expect(result.body).toContain(
			"canonical: https://ta93abe.com/blog/hello-world/",
		);
		expect(result.body).not.toContain("一覧へ戻る");
		expect(result.body).not.toContain("Newsletter");
		expect(result.body).not.toContain("関連記事");
	});

	it("lists published posts on /blog", async () => {
		const bucket = createMemoryR2();
		await bucket.put("md/blog/hello-world.md", HELLO);
		await bucket.put("md/blog/snowflake-world-tour-tokyo-2026.md", SNOWFLAKE);
		await rebuildContentIndexes(bucket);

		const result = await loadNegotiatedMarkdown("/blog", bucket);
		expect(result.kind).toBe("markdown");
		if (result.kind !== "markdown") {
			return;
		}

		expect(result.body).toContain("# Blog");
		expect(result.body).toContain("Hello World");
		expect(result.body).toContain(
			"https://ta93abe.com/blog/snowflake-world-tour-tokyo-2026/",
		);
		expect(result.body).not.toContain("Newsletter");
	});

	it("returns not-found for a missing blog slug", async () => {
		const result = await loadNegotiatedMarkdown(
			"/blog/missing-post",
			createMemoryR2(),
		);
		expect(result).toEqual({ kind: "not-found" });
	});

	it("skips paths without a markdown variant", async () => {
		const result = await loadNegotiatedMarkdown("/tools", createMemoryR2());
		expect(result).toEqual({ kind: "skip" });
	});

	it("renders about and works from site data", async () => {
		const about = await loadNegotiatedMarkdown("/about", createMemoryR2());
		expect(about.kind).toBe("markdown");
		if (about.kind === "markdown") {
			expect(about.body).toContain("# About");
			expect(about.body).toContain("Takumi Abe");
			expect(about.body).toContain("dbt-jobs");
			expect(about.body).toContain("https://github.com/ta93abe");
			expect(about.body).not.toContain("<nav");
		}

		const works = await loadNegotiatedMarkdown("/works", createMemoryR2());
		expect(works.kind).toBe("markdown");
		if (works.kind === "markdown") {
			expect(works.body).toContain("# Works");
			expect(works.body).toContain("enbu");
			expect(works.body).toContain("dbt-intro");
		}
	});

	it("renders contact and links without layout chrome", async () => {
		const contact = await loadNegotiatedMarkdown("/contact", createMemoryR2());
		expect(contact.kind).toBe("markdown");
		if (contact.kind === "markdown") {
			expect(contact.body).toContain("# Contact");
			expect(contact.body).toContain("https://x.com/ta93abe_");
		}

		const links = await loadNegotiatedMarkdown("/links", createMemoryR2());
		expect(links.kind).toBe("markdown");
		if (links.kind === "markdown") {
			expect(links.body).toContain("# Links");
			expect(links.body).toContain("https://zenn.dev/ta93abe");
		}
	});
});
