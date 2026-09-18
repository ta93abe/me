import { describe, expect, it } from "vitest";

import { SITE } from "@/config/site";
import { toDatetimeAttr } from "@/utils/date";
import {
	generateArticleItemListSchema,
	generateBlogCollectionSchema,
	generateBlogPostingSchema,
	generateBreadcrumbSchema,
	generateContactPageSchema,
	generateLinksCollectionSchema,
	generatePersonSchema,
	generateProfilePageSchema,
	generateSlideDeckSchema,
	generateSlidesCollectionSchema,
	generateToolsCollectionSchema,
	generateWebSiteSchema,
	generateWorksCollectionSchema,
	stringifySchema,
} from "@/utils/schema";

describe("generateWebSiteSchema", () => {
	const siteUrl = "https://example.com";

	it("should generate valid WebSite schema", () => {
		const schema = generateWebSiteSchema(siteUrl);

		expect(schema["@context"]).toBe("https://schema.org");
		expect(schema["@type"]).toBe("WebSite");
		expect(schema.url).toBe("https://example.com/");
	});

	it("should include author information", () => {
		const schema = generateWebSiteSchema(siteUrl);

		expect(schema.author["@type"]).toBe("Person");
		expect(schema.author.name).toBe("Takumi Abe");
		expect(schema.author.url).toBe(`${siteUrl}/about/`);
		expect(schema.author.jobTitle).toBe("Software Engineer");
		expect(schema.author.sameAs).toEqual(
			expect.arrayContaining([
				"https://github.com/ta93abe",
				"https://x.com/ta93abe_",
				"https://linkedin.com/in/ta93abe",
			]),
		);
	});

	it("should exclude search action by default", () => {
		const schema = generateWebSiteSchema(siteUrl);

		expect(schema.potentialAction).toBeUndefined();
	});

	it("should include search action when enabled", () => {
		const schema = generateWebSiteSchema(siteUrl, {
			includeSearchAction: true,
		});

		expect(schema.potentialAction).toBeDefined();
		expect(schema.potentialAction?.["@type"]).toBe("SearchAction");
	});
});

describe("generatePersonSchema", () => {
	it("includes Person fields and sameAs profiles", () => {
		const schema = generatePersonSchema("https://example.com/");

		expect(schema["@type"]).toBe("Person");
		expect(schema.name).toBe("Takumi Abe");
		expect(schema.url).toBe("https://example.com/about/");
		expect(schema.jobTitle).toBe("Software Engineer");
		expect(schema.description).toContain(
			"データ基盤と CI を書くソフトウェアエンジニア",
		);
		expect(schema.sameAs).toEqual(
			expect.arrayContaining([
				"https://github.com/ta93abe",
				"https://x.com/ta93abe_",
				"https://linkedin.com/in/ta93abe",
			]),
		);
	});
});

describe("generateSlidesCollectionSchema", () => {
	it("lists decks as PresentationDigitalDocument parts", () => {
		const schema = generateSlidesCollectionSchema("https://example.com/", [
			{
				slug: "showcase",
				title: "デザインシステム ショーケース",
				description: "全スライド型の見本。",
				date: "2026-09-06",
			},
		]);

		expect(schema["@type"]).toBe("CollectionPage");
		expect(schema.url).toBe("https://example.com/slides/");
		expect(schema.hasPart).toEqual([
			{
				"@type": "PresentationDigitalDocument",
				name: "デザインシステム ショーケース",
				description: "全スライド型の見本。",
				url: "https://example.com/slides/showcase/",
				datePublished: "2026-09-06",
			},
		]);
	});
});

describe("generateSlideDeckSchema", () => {
	it("points image and PDF encoding at the same-origin deck", () => {
		const schema = generateSlideDeckSchema("https://example.com/", {
			slug: "showcase",
			title: "デザインシステム ショーケース",
			description: "全スライド型の見本。",
			date: "2026-09-06",
		});

		expect(schema["@type"]).toBe("PresentationDigitalDocument");
		expect(schema.url).toBe("https://example.com/slides/showcase/");
		expect(schema.image).toBe("https://example.com/og/slides/showcase.png");
		expect(schema.author.name).toBe("Takumi Abe");
		expect(schema.isPartOf.url).toBe("https://example.com/slides/");
		expect(schema.encoding).toEqual({
			"@type": "MediaObject",
			encodingFormat: "application/pdf",
			contentUrl: "https://example.com/slides/showcase.pdf",
		});
	});
});

describe("generateProfilePageSchema", () => {
	it("wraps Person as the About main entity", () => {
		const schema = generateProfilePageSchema("https://example.com/");
		expect(schema["@type"]).toBe("ProfilePage");
		expect(schema.url).toBe("https://example.com/about/");
		expect(schema.mainEntity["@type"]).toBe("Person");
		expect(schema.mainEntity.url).toBe("https://example.com/about/");
	});
});

describe("generateContactPageSchema", () => {
	it("points Contact at the same Person", () => {
		const schema = generateContactPageSchema("https://example.com/");
		expect(schema["@type"]).toBe("ContactPage");
		expect(schema.url).toBe("https://example.com/contact/");
		expect(schema.mainEntity.name).toBe("Takumi Abe");
	});
});

describe("generateWorksCollectionSchema", () => {
	it("lists featured GitHub works as SoftwareSourceCode", () => {
		const schema = generateWorksCollectionSchema("https://example.com/");
		expect(schema["@type"]).toBe("CollectionPage");
		expect(schema.url).toBe("https://example.com/works/");
		expect(schema.hasPart.map((part) => part.name)).toEqual([
			"dbt-jobs",
			"dbt-intro",
			"enbu",
		]);
		expect(schema.hasPart[0]?.codeRepository).toContain("github.com");
	});
});

describe("generateLinksCollectionSchema", () => {
	it("lists curated profile URLs", () => {
		const schema = generateLinksCollectionSchema("https://example.com/");
		expect(schema.hasPart.map((part) => part.name)).toEqual(
			expect.arrayContaining(["GitHub", "Zenn", "X"]),
		);
	});
});

describe("generateToolsCollectionSchema", () => {
	it("lists tools as SoftwareApplication", () => {
		const schema = generateToolsCollectionSchema("https://example.com/", [
			{
				name: "Nix",
				description: "再現可能な開発環境",
				url: "https://nixos.org/",
			},
		]);
		expect(schema.hasPart).toEqual([
			{
				"@type": "SoftwareApplication",
				name: "Nix",
				description: "再現可能な開発環境",
				url: "https://nixos.org/",
			},
		]);
	});
});

describe("generateBlogCollectionSchema", () => {
	it("lists posts with trailing-slash URLs", () => {
		const schema = generateBlogCollectionSchema("https://example.com/", [
			{
				slug: "hello-world",
				title: "Hello",
				excerpt: "note",
				date: new Date("2026-08-30T00:00:00.000Z"),
			},
		]);
		expect(schema.url).toBe("https://example.com/blog/");
		expect(schema.hasPart[0]).toMatchObject({
			"@type": "BlogPosting",
			headline: "Hello",
			url: "https://example.com/blog/hello-world/",
			datePublished: "2026-08-30T00:00:00.000Z",
		});
	});
});

describe("generateBlogPostingSchema", () => {
	it("uses Person author and Blog collection", () => {
		const schema = generateBlogPostingSchema("https://example.com/", {
			slug: "hello-world",
			title: "Hello",
			excerpt: "note",
			date: new Date("2026-08-30T00:00:00.000Z"),
			image: "https://example.com/og/blog/hello-world.png",
			tags: ["ci"],
		});
		expect(schema["@type"]).toBe("BlogPosting");
		expect(schema.url).toBe("https://example.com/blog/hello-world/");
		expect(schema.author.url).toBe("https://example.com/about/");
		expect(schema.publisher.name).toBe("Takumi Abe");
		expect(schema.isPartOf.url).toBe("https://example.com/blog/");
		expect(schema.keywords).toBe("ci");
	});

	it("adds wordCount and articleBody from the markdown body", () => {
		const schema = generateBlogPostingSchema("https://example.com/", {
			slug: "hello-world",
			title: "Hello World",
			excerpt: "最初の Pubme 投稿",
			date: new Date("2026-08-30T00:00:00.000Z"),
			image: "https://example.com/og/blog/hello-world.png",
			body: "ブログを始めようじゃないか。",
		});
		expect(schema.wordCount).toBeGreaterThan(0);
		expect(Number.isInteger(schema.wordCount)).toBe(true);
		expect(schema.articleBody).toContain("ブログを始めようじゃないか");
		expect(schema.articleBody).not.toContain("Hello World");
	});

	it("keeps visible datetime and byline aligned with JSON-LD", () => {
		const date = new Date("2026-08-30T00:00:00.000Z");
		const updatedDate = new Date("2026-09-16T00:00:00.000Z");
		const schema = generateBlogPostingSchema("https://example.com/", {
			slug: "hello-world",
			title: "Hello",
			excerpt: "note",
			date,
			updatedDate,
			image: "https://example.com/og/blog/hello-world.png",
		});

		expect(schema.datePublished).toBe(toDatetimeAttr(date));
		expect(schema.dateModified).toBe(toDatetimeAttr(updatedDate));
		expect(schema.author.name).toBe(SITE.author);
		expect(schema.author.url).toBe(`https://example.com${SITE.authorPath}`);
	});

	it("falls dateModified back to datePublished when unrevised", () => {
		const schema = generateBlogPostingSchema("https://example.com/", {
			slug: "hello-world",
			title: "Hello",
			excerpt: "note",
			date: new Date("2026-08-30T00:00:00.000Z"),
			image: "https://example.com/og/blog/hello-world.png",
		});
		expect(schema.dateModified).toBe(schema.datePublished);
	});

	it("keeps section copy and tags for a wrap-up post", () => {
		const body = `9/12, 9/13 と 2 日間にわたって毎年恒例の Snowflake World Tour Tokyo が開催されました。

## Semantic Viewは“作るもの”から“育てるもの”へ

Semantic view は何となく作ってはみたもののになりがち。
`;
		const schema = generateBlogPostingSchema("https://example.com/", {
			slug: "snowflake-world-tour-tokyo-2026",
			title: "Snowflake World Tour Tokyo に行ってきたよー",
			excerpt: "いち参加者のラップアップ",
			date: new Date("2026-09-16T00:00:00.000Z"),
			image: "https://example.com/og/blog/snowflake.png",
			tags: ["Snowflake"],
			body,
		});
		expect(schema.wordCount).toBeGreaterThan(0);
		expect(schema.articleBody).toContain("9/12");
		expect(schema.articleBody).toContain("Semantic View");
		expect(schema.keywords).toBe("Snowflake");
		expect(generateArticleItemListSchema(body)).toBeUndefined();
	});
});

describe("generateArticleItemListSchema", () => {
	it("emits ItemList names for a paid-service bullet list", () => {
		const schema = generateArticleItemListSchema(`導入

- Claude Pro ($20)
- ChatGPT Plus (¥3,000)
- Cursor Pro+ ($60)
- Devin Pro ($20)
- OpenCode Go ($10)
- Google AI Pro (¥29,000 per year)
`);
		expect(schema?.["@type"]).toBe("ItemList");
		expect(schema?.itemListElement.map((item) => item.name)).toEqual([
			"Claude Pro",
			"ChatGPT Plus",
			"Cursor Pro+",
			"Devin Pro",
			"OpenCode Go",
			"Google AI Pro",
		]);
		expect(schema?.itemListElement[0]).toMatchObject({
			"@type": "ListItem",
			position: 1,
		});
	});

	it("returns undefined when the body has no product list", () => {
		expect(
			generateArticleItemListSchema("ブログを始めようじゃないか。"),
		).toBeUndefined();
	});
});

describe("generateBreadcrumbSchema", () => {
	it("starts at Home and trailing-slashes the rest", () => {
		const schema = generateBreadcrumbSchema("https://example.com/", [
			{ name: "Blog", path: "/blog" },
			{ name: "Hello", path: "/blog/hello-world" },
		]);
		expect(schema.itemListElement.map((item) => item.item)).toEqual([
			"https://example.com/",
			"https://example.com/blog/",
			"https://example.com/blog/hello-world/",
		]);
	});
});

describe("stringifySchema", () => {
	it("should stringify JSON correctly", () => {
		const schema = { "@type": "Test", name: "Example" };
		const result = stringifySchema(schema);

		expect(result).toBe('{"@type":"Test","name":"Example"}');
	});

	it("should escape < characters for XSS prevention", () => {
		const schema = { content: "<script>alert('xss')</script>" };
		const result = stringifySchema(schema);

		expect(result).not.toContain("<");
		expect(result).toContain("\\u003c");
	});
});
