import { expect, test } from "@playwright/test";

test.describe("Trailing slash canonicalization", () => {
	test("bare HTML paths 301 to the slashed URL", async ({ request }) => {
		const cases = [
			"/about",
			"/blog",
			"/contact",
			"/works",
			"/gadgets",
			"/blog/hello-world",
		] as const;

		for (const path of cases) {
			const res = await request.get(path, { maxRedirects: 0 });
			expect(res.status(), path).toBe(301);
			expect(res.headers().location, path).toMatch(new RegExp(`${path}/$`));
		}
	});

	test("root, files, and already-slashed HTML stay 200", async ({
		request,
	}) => {
		const root = await request.get("/", { maxRedirects: 0 });
		expect(root.status()).toBe(200);

		const about = await request.get("/about/", { maxRedirects: 0 });
		expect(about.status()).toBe(200);

		const rss = await request.get("/rss.xml", { maxRedirects: 0 });
		expect(rss.status()).toBe(200);
	});

	test("preserves query strings on the 301 Location", async ({ request }) => {
		const res = await request.get("/about?utm=1", { maxRedirects: 0 });
		expect(res.status()).toBe(301);
		expect(res.headers().location).toMatch(/\/about\/\?utm=1$/);
	});
});
