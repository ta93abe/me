import { describe, expect, it } from "vitest";

import { isValidSlug } from "../content/collections.ts";
import { contentJsonSchema, validateFrontmatter } from "../content/schema.ts";

describe("content schema", () => {
	it("accepts a valid blog note", () => {
		const result = validateFrontmatter("blog", {
			title: "Hello",
			excerpt: "short",
			publish_date: "2026-08-30",
			tags: ["workers"],
		});
		expect(result.ok).toBe(true);
	});

	it("accepts date as an alias for publish_date", () => {
		const result = validateFrontmatter("blog", {
			title: "Hello",
			excerpt: "short",
			date: "2026-08-30",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.publish_date).toBe("2026-08-30");
		}
	});

	it("accepts updatedDate as an alias for revise_date", () => {
		const result = validateFrontmatter("blog", {
			title: "Hello",
			excerpt: "short",
			publish_date: "2026-08-30",
			updatedDate: "2026-09-01",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.revise_date).toBe("2026-09-01");
		}
	});

	it("prefers publish_date when both aliases are present", () => {
		const result = validateFrontmatter("blog", {
			title: "Hello",
			excerpt: "short",
			publish_date: "2026-09-07",
			date: "2026-08-30",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.publish_date).toBe("2026-09-07");
		}
	});

	it("requires publish_date on blog", () => {
		const result = validateFrontmatter("blog", {
			title: "Hello",
			excerpt: "short",
		});
		expect(result.ok).toBe(false);
	});

	it("requires publish_date on gallery", () => {
		const result = validateFrontmatter("gallery", {
			title: "Piece",
			excerpt: "demo",
			mediaType: "drawing",
			coverImage: "https://images.ta93abe.com/x.jpg",
		});
		expect(result.ok).toBe(false);
	});

	it("accepts date as an alias on atelier", () => {
		const result = validateFrontmatter("atelier", {
			title: "Sketch",
			excerpt: "demo",
			date: "2026-08-30",
			mediaType: "drawing",
			coverImage: "https://images.ta93abe.com/x.jpg",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.publish_date).toBe("2026-08-30");
		}
	});

	it("requires audio for music gallery pieces", () => {
		const result = validateFrontmatter("gallery", {
			title: "Song",
			excerpt: "demo",
			publish_date: "2026-08-30",
			mediaType: "music",
		});
		expect(result.ok).toBe(false);
	});

	it("requires coverImage URL on books", () => {
		const result = validateFrontmatter("books", {
			title: "Book",
			excerpt: "notes",
			publish_date: "2026-08-30",
			author: "Someone",
			status: "read",
		});
		expect(result.ok).toBe(false);
	});

	it("exposes json schema for the plugin", () => {
		const schema = contentJsonSchema();
		expect(schema.collections).toEqual(["blog", "gallery", "atelier", "books"]);
		expect(schema.slug.pattern).toBe("^[a-z0-9][a-z0-9-]{0,80}$");
		expect(schema.frontmatter.blog.required).toContain("publish_date");
		expect(schema.frontmatter.blog.required).not.toContain("date");
		expect(schema.frontmatter.gallery.required).toContain("publish_date");
		expect(schema.frontmatter.atelier.required).toContain("publish_date");
		expect(schema.frontmatter.books.required).toContain("publish_date");
		expect(schema.frontmatter.blog.properties).toHaveProperty("revise_date");
		expect(schema.frontmatter.blog.properties).toHaveProperty("date");
	});

	it("validates slugs", () => {
		expect(isValidSlug("hello-world")).toBe(true);
		expect(isValidSlug("Hello")).toBe(false);
		expect(isValidSlug("-leading")).toBe(false);
		expect(isValidSlug("a".repeat(82))).toBe(false);
	});
});
