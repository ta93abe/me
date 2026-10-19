import { describe, expect, it, vi } from "vitest";

vi.mock("@astrojs/cloudflare/handler", () => ({
	handle: vi.fn(
		async () =>
			new Response("<html>home</html>", {
				status: 200,
				headers: { "content-type": "text/html; charset=utf-8" },
			}),
	),
}));

import worker from "../index.ts";
import { createContentEnv } from "./memory-r2.ts";

const env = {
	...createContentEnv(),
	ASSETS: { fetch: async () => new Response("missing", { status: 404 }) },
	DEPLOY_HOOK_URL: "https://example.invalid/hook",
} as unknown as Env;

const ctx = {
	waitUntil() {},
	passThroughOnException() {},
	props: {},
} as unknown as ExecutionContext;

async function fetchUrl(
	url: string,
	init: RequestInit = {},
): Promise<Response> {
	return worker.fetch(
		new Request(url, init) as Parameters<NonNullable<typeof worker.fetch>>[0],
		env,
		ctx,
	);
}

describe("HTML filename canonical redirect", () => {
	it("301s .html and index.html GET/HEAD onto the slashed URL", async () => {
		const cases = [
			["/contact.html", "https://ta93abe.com/contact/"],
			["/about.html", "https://ta93abe.com/about/"],
			["/about/index.html", "https://ta93abe.com/about/"],
			["/index.html", "https://ta93abe.com/"],
			["/gadgets/mac-studio.html", "https://ta93abe.com/gadgets/mac-studio/"],
			["/blog/hello-world.html", "https://ta93abe.com/blog/hello-world/"],
			[
				"/slides/snowflake-dbt.html",
				"https://ta93abe.com/slides/snowflake-dbt/",
			],
		] as const;

		for (const [path, dest] of cases) {
			const get = await fetchUrl(`https://ta93abe.com${path}`);
			const head = await fetchUrl(`https://ta93abe.com${path}`, {
				method: "HEAD",
			});
			expect(get.status, path).toBe(301);
			expect(head.status, path).toBe(301);
			expect(get.headers.get("Location"), path).toBe(dest);
			expect(head.headers.get("Location"), path).toBe(dest);
		}
	});

	it("keeps query strings on the 301 Location", async () => {
		const response = await fetchUrl("https://ta93abe.com/contact.html?utm=1");
		expect(response.status).toBe(301);
		expect(response.headers.get("Location")).toBe(
			"https://ta93abe.com/contact/?utm=1",
		);
	});

	it("does not rewrite 404.html", async () => {
		const response = await fetchUrl("https://ta93abe.com/404.html");
		expect(response.status).not.toBe(301);
		expect(response.headers.get("Location")).toBeNull();
	});

	it("leaves already-canonical HTML and files alone", async () => {
		const about = await fetchUrl("https://ta93abe.com/about/");
		const rss = await fetchUrl("https://ta93abe.com/rss.xml");
		expect(about.status).toBe(200);
		expect(rss.status).toBe(200);
	});
});
