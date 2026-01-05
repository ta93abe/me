import Parser from "rss-parser";
import { describe, expect, it } from "vitest";

describe("RSS Loaders", () => {
	describe("Zenn RSS Feed", () => {
		it("should fetch and parse Zenn RSS feed", async () => {
			const parser = new Parser();
			const feed = await parser.parseURL("https://zenn.dev/ta93abe/feed");

			expect(feed).toBeDefined();
			expect(feed.items).toBeDefined();
			expect(Array.isArray(feed.items)).toBe(true);
		});

		it("should transform Zenn items to match schema", async () => {
			const parser = new Parser();
			const feed = await parser.parseURL("https://zenn.dev/ta93abe/feed");

			if (!feed.items || feed.items.length === 0) {
				console.warn("No items in Zenn feed");
				return;
			}

			const entries = feed.items
				.filter((item) => item.title && item.link)
				.map((item, index) => ({
					id: item.guid || `zenn-${index}`,
					data: {
						title: item.title!,
						url: item.link!,
						publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
						excerpt: item.contentSnippet || item.content || "",
						source: "Zenn" as const,
					},
				}));

			expect(entries.length).toBeGreaterThan(0);

			// Validate first entry structure
			const firstEntry = entries[0];
			expect(firstEntry).toHaveProperty("id");
			expect(firstEntry).toHaveProperty("data");
			expect(firstEntry.data).toHaveProperty("title");
			expect(firstEntry.data).toHaveProperty("url");
			expect(firstEntry.data).toHaveProperty("publishedAt");
			expect(firstEntry.data).toHaveProperty("excerpt");
			expect(firstEntry.data).toHaveProperty("source");

			// Validate types
			expect(typeof firstEntry.id).toBe("string");
			expect(typeof firstEntry.data.title).toBe("string");
			expect(typeof firstEntry.data.url).toBe("string");
			expect(firstEntry.data.publishedAt).toBeInstanceOf(Date);
			expect(typeof firstEntry.data.excerpt).toBe("string");
			expect(firstEntry.data.source).toBe("Zenn");

			// Validate URL format
			expect(firstEntry.data.url).toMatch(/^https?:\/\//);
		});
	});

	describe("Note RSS Feed", () => {
		it("should fetch and parse Note RSS feed", async () => {
			const parser = new Parser();
			const feed = await parser.parseURL("https://note.com/ta93abe/rss");

			expect(feed).toBeDefined();
			expect(feed.items).toBeDefined();
			expect(Array.isArray(feed.items)).toBe(true);
		});
	});

	describe("Podcast RSS Feed", () => {
		it("should fetch and parse Podcast RSS feed", async () => {
			const parser = new Parser();
			const feed = await parser.parseURL(
				"https://anchor.fm/s/4dd661e8/podcast/rss",
			);

			expect(feed).toBeDefined();
			expect(feed.items).toBeDefined();
			expect(Array.isArray(feed.items)).toBe(true);
		});
	});
});
