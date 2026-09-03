import { describe, expect, it } from "vitest";

import { handleContentApi } from "../content/api.ts";
import { signContentRequest } from "../content/hmac.ts";
import { createContentEnv } from "./memory-r2.ts";

const secret = "test-hmac-secret";

const blogMarkdown = `---
title: Hello Workers
excerpt: A short note
date: 2026-08-30
tags:
  - r2
---

Published from curl.
`;

async function signedRequest(
	method: string,
	path: string,
	body: string | Uint8Array = "",
	extraHeaders: Record<string, string> = {},
): Promise<Request> {
	const timestamp = String(Math.floor(Date.now() / 1000));
	const signature = await signContentRequest(secret, timestamp, path, body);
	const headers = new Headers({
		"X-Content-Timestamp": timestamp,
		"X-Content-Signature": signature,
		...extraHeaders,
	});
	const requestBody =
		typeof body === "string"
			? body || undefined
			: (body.slice().buffer as ArrayBuffer);
	return new Request(`https://ta93abe.com${path}`, {
		method,
		headers,
		body: requestBody,
	});
}

describe("content api", () => {
	it("returns json schema without hmac", async () => {
		const env = createContentEnv();
		const response = await handleContentApi(
			new Request("https://ta93abe.com/api/content/schema"),
			env,
		);
		expect(response?.status).toBe(200);
		const json = (await response!.json()) as { collections: string[] };
		expect(json.collections).toContain("blog");
	});

	it("rejects an invalid slug before writing", async () => {
		const env = createContentEnv();
		const response = await handleContentApi(
			await signedRequest("PUT", "/api/content/blog/NOPE", blogMarkdown),
			env,
		);
		expect(response?.status).toBe(400);
		expect(await env.CONTENT.get("md/blog/NOPE.md")).toBeNull();
	});

	it("rejects unknown collections with 400", async () => {
		const env = createContentEnv();
		const response = await handleContentApi(
			await signedRequest("PUT", "/api/content/talks/hello", blogMarkdown),
			env,
		);
		expect(response?.status).toBe(400);
	});

	it("rejects unsigned puts", async () => {
		const env = createContentEnv();
		const response = await handleContentApi(
			new Request("https://ta93abe.com/api/content/blog/hello", {
				method: "PUT",
				body: blogMarkdown,
			}),
			env,
		);
		expect(response?.status).toBe(401);
	});

	it("puts, gets, lists index, then deletes", async () => {
		const env = createContentEnv({ CONTENT_HMAC_SECRET: secret });

		const put = await handleContentApi(
			await signedRequest("PUT", "/api/content/blog/hello", blogMarkdown),
			env,
		);
		expect(put?.status).toBe(200);

		const get = await handleContentApi(
			new Request("https://ta93abe.com/api/content/blog/hello"),
			env,
		);
		expect(get?.status).toBe(200);
		expect(await get!.text()).toContain("Published from curl.");

		const index = await handleContentApi(
			new Request("https://ta93abe.com/api/content/index/blog"),
			env,
		);
		expect(index?.status).toBe(200);
		const listed = (await index!.json()) as {
			entries: Array<{ slug: string; title: string }>;
		};
		expect(listed.entries).toEqual([
			expect.objectContaining({ slug: "hello", title: "Hello Workers" }),
		]);

		const all = await handleContentApi(
			new Request("https://ta93abe.com/api/content/index"),
			env,
		);
		const allJson = (await all!.json()) as {
			collections: { blog: Array<{ slug: string }> };
		};
		expect(allJson.collections.blog).toHaveLength(1);

		const del = await handleContentApi(
			await signedRequest("DELETE", "/api/content/blog/hello"),
			env,
		);
		expect(del?.status).toBe(200);
		expect(await env.CONTENT.get("md/blog/hello.md")).toBeNull();
	});

	it("rejects mdx bodies", async () => {
		const env = createContentEnv({ CONTENT_HMAC_SECRET: secret });
		const response = await handleContentApi(
			await signedRequest(
				"PUT",
				"/api/content/blog/mdx-note",
				"---\ntitle: x\nexcerpt: y\ndate: 2026-08-30\n---\n\n<Hero />\n",
			),
			env,
		);
		expect(response?.status).toBe(400);
	});

	it("uploads media to the public images prefix", async () => {
		const env = createContentEnv({ CONTENT_HMAC_SECRET: secret });
		const bytes = new TextEncoder().encode("jpeg-bytes");
		const response = await handleContentApi(
			await signedRequest("POST", "/api/content/gallery/sky/media", bytes, {
				"X-Filename": "cover.jpg",
				"Content-Type": "image/jpeg",
			}),
			env,
		);
		expect(response?.status).toBe(200);
		const json = (await response!.json()) as { url: string; key: string };
		expect(json.key).toBe("content/gallery/sky/cover.jpg");
		expect(json.url).toBe(
			"https://images.ta93abe.com/content/gallery/sky/cover.jpg",
		);
		expect(await env.IMAGES.get(json.key)).not.toBeNull();
	});

	it("writes derived discovery files on publish", async () => {
		const env = createContentEnv();
		const response = await handleContentApi(
			await signedRequest("PUT", "/api/content/blog/hello", blogMarkdown),
			env,
		);
		expect(response?.status).toBe(200);
		expect(await env.CONTENT.get("derived/rss-blog.xml")).not.toBeNull();
		expect(await env.CONTENT.get("derived/sitemap-urls.json")).not.toBeNull();
		expect(await env.CONTENT.get("derived/llms-blog.txt")).not.toBeNull();
	});

	it("leaves non-content routes to the site worker", async () => {
		const env = createContentEnv();
		const response = await handleContentApi(
			new Request("https://ta93abe.com/blog/hello"),
			env,
		);
		expect(response).toBeNull();
	});
});
