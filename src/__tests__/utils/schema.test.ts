import { describe, expect, it } from "vitest";
import {
	generateBreadcrumbSchema,
	generateWebSiteSchema,
	stringifySchema,
} from "../../utils/schema";

describe("generateBreadcrumbSchema", () => {
	const siteUrl = "https://example.com";

	it("should generate valid BreadcrumbList schema", () => {
		const items = [
			{ label: "Home", href: "/" },
			{ label: "Blog", href: "/blog" },
			{ label: "Post Title" },
		];

		const schema = generateBreadcrumbSchema(items, siteUrl);

		expect(schema["@context"]).toBe("https://schema.org");
		expect(schema["@type"]).toBe("BreadcrumbList");
		expect(schema.itemListElement).toHaveLength(3);
	});

	it("should set correct position for each item", () => {
		const items = [
			{ label: "Home", href: "/" },
			{ label: "Blog" },
		];

		const schema = generateBreadcrumbSchema(items, siteUrl);

		expect(schema.itemListElement[0].position).toBe(1);
		expect(schema.itemListElement[1].position).toBe(2);
	});

	it("should include item URL only when href is provided", () => {
		const items = [
			{ label: "Home", href: "/" },
			{ label: "Current Page" },
		];

		const schema = generateBreadcrumbSchema(items, siteUrl);

		expect(schema.itemListElement[0].item).toBe("https://example.com/");
		expect(schema.itemListElement[1].item).toBeUndefined();
	});

	it("should handle absolute URLs correctly", () => {
		const items = [{ label: "Blog", href: "/blog/post" }];

		const schema = generateBreadcrumbSchema(items, siteUrl);

		expect(schema.itemListElement[0].item).toBe(
			"https://example.com/blog/post",
		);
	});
});

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
		expect(schema.author.url).toBe(siteUrl);
	});

	it("should include search action by default", () => {
		const schema = generateWebSiteSchema(siteUrl);

		expect(schema.potentialAction).toBeDefined();
		expect(schema.potentialAction?.["@type"]).toBe("SearchAction");
	});

	it("should exclude search action when disabled", () => {
		const schema = generateWebSiteSchema(siteUrl, { includeSearchAction: false });

		expect(schema.potentialAction).toBeUndefined();
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
