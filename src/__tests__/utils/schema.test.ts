import { describe, expect, it } from "vitest";

import { SITE, SITE_SAME_AS } from "@/config/site";
import {
	generatePersonSchema,
	generateWebSiteSchema,
	personId,
	personPageUrl,
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

	it("should include author information as Person with jobTitle and sameAs", () => {
		const schema = generateWebSiteSchema(siteUrl);

		expect(schema.author["@type"]).toBe("Person");
		expect(schema.author["@id"]).toBe(personId(siteUrl));
		expect(schema.author.url).toBe(personPageUrl(siteUrl));
		expect(schema.author.jobTitle).toBe(SITE.jobTitle);
		expect(schema.author.sameAs).toEqual([...SITE_SAME_AS]);
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
	it("should generate a top-level Person with jobTitle, sameAs, and url", () => {
		const schema = generatePersonSchema("https://example.com/");

		expect(schema["@context"]).toBe("https://schema.org");
		expect(schema["@type"]).toBe("Person");
		expect(schema.name).toBe(SITE.author);
		expect(schema.alternateName).toBe(SITE.alternateName);
		expect(schema.jobTitle).toBe("Software Engineer");
		expect(schema.url).toBe("https://example.com/about");
		expect(schema["@id"]).toBe("https://example.com/#person");
		expect(schema.sameAs).toEqual([
			"https://github.com/ta93abe",
			"https://x.com/ta93abe_",
			"https://linkedin.com/in/ta93abe",
		]);
		expect(schema.knowsAbout).toEqual([...SITE.interests]);
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
