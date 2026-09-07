import { describe, expect, it } from "vitest";

import {
	generatePersonSchema,
	generateSlideDeckSchema,
	generateSlidesCollectionSchema,
	generateWebSiteSchema,
	stringifySchema,
} from "@/utils/schema";

describe("generateWebSiteSchema", () => {
	const siteUrl = "https://example.com";

	it("should generate valid WebSite schema", () => {
		const schema = generateWebSiteSchema(siteUrl);

		expect(schema["@context"]).toBe("https://schema.org");
		expect(schema["@type"]).toBe("WebSite");
		expect(schema.url).toBe(siteUrl);
	});

	it("should include author information", () => {
		const schema = generateWebSiteSchema(siteUrl);

		expect(schema.author["@type"]).toBe("Person");
		expect(schema.author.name).toBe("Takumi Abe");
		expect(schema.author.url).toBe(`${siteUrl}/about`);
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
		expect(schema.url).toBe("https://example.com/about");
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
