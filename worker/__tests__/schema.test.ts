import { describe, expect, it } from "vitest";

import { isValidSlug } from "../content/collections.ts";
import { contentJsonSchema, validateFrontmatter } from "../content/schema.ts";

describe("content schema", () => {
	it("accepts a valid blog note", () => {
		const result = validateFrontmatter("blog", {
			title: "Hello",
			excerpt: "short",
			date: "2026-08-30",
			tags: ["workers"],
		});
		expect(result.ok).toBe(true);
	});

	it("requires date on blog", () => {
		const result = validateFrontmatter("blog", {
			title: "Hello",
			excerpt: "short",
		});
		expect(result.ok).toBe(false);
	});

	it("requires audio for music gallery pieces", () => {
		const result = validateFrontmatter("gallery", {
			title: "Song",
			excerpt: "demo",
			mediaType: "music",
		});
		expect(result.ok).toBe(false);
	});

	it("requires coverImage URL on books", () => {
		const result = validateFrontmatter("books", {
			title: "Book",
			excerpt: "notes",
			author: "Someone",
			status: "read",
		});
		expect(result.ok).toBe(false);
	});

	it("exposes json schema for the plugin", () => {
		const schema = contentJsonSchema();
		expect(schema.collections).toEqual(["blog", "gallery", "atelier", "books"]);
		expect(schema.slug.pattern).toBe("^[a-z0-9][a-z0-9-]{0,80}$");
		expect(schema.frontmatter.blog.required).toContain("date");
	});

	it("validates slugs", () => {
		expect(isValidSlug("hello-world")).toBe(true);
		expect(isValidSlug("Hello")).toBe(false);
		expect(isValidSlug("-leading")).toBe(false);
		expect(isValidSlug("a".repeat(82))).toBe(false);
	});
});
