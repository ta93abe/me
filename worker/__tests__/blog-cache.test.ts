import { describe, expect, it } from "vitest";

import {
	blogHtmlCacheUrls,
	blogSlugsFromMarkdownKeys,
} from "../content/blog-cache.ts";
import { handleContentQueue } from "../content/queue.ts";
import { createMemoryR2 } from "./memory-r2.ts";

describe("blog html cache", () => {
	it("lists index and slug URLs with and without trailing slash", () => {
		expect(blogHtmlCacheUrls("https://ta93abe.com/", ["hello"])).toEqual([
			"https://ta93abe.com/blog",
			"https://ta93abe.com/blog/",
			"https://ta93abe.com/blog/hello",
			"https://ta93abe.com/blog/hello/",
		]);
	});

	it("extracts blog slugs from markdown keys only", () => {
		expect(
			blogSlugsFromMarkdownKeys([
				"md/blog/hello.md",
				"md/gallery/piece.md",
				"index/blog.json",
			]),
		).toEqual(["hello"]);
	});

	it("purges blog HTML after a blog markdown notification", async () => {
		const bucket = createMemoryR2();
		await bucket.put(
			"md/blog/hello.md",
			`---
title: Hello
excerpt: note
date: 2026-08-30
---
body
`,
		);
		const purged: string[] = [];

		await handleContentQueue(
			{
				messages: [
					{
						id: "1",
						timestamp: new Date(),
						attempts: 1,
						body: { action: "PutObject", object: { key: "md/blog/hello.md" } },
						ack() {},
						retry() {},
					},
				],
			} as unknown as MessageBatch<unknown>,
			bucket,
			{
				origin: "https://ta93abe.com",
				purge: async (urls) => {
					purged.push(...urls);
				},
			},
		);

		expect(purged).toContain("https://ta93abe.com/blog");
		expect(purged).toContain("https://ta93abe.com/blog/hello");
	});
});
