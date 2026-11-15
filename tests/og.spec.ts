import { expect, test } from "@playwright/test";

test.describe("Blog OG images (prerendered)", { tag: "@smoke" }, () => {
	test("known slug returns 200 image/png", async ({ request }) => {
		const response = await request.get("/og/blog/hello-world.png");
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toMatch(/image\/png/);
		const body = await response.body();
		expect(body[0]).toBe(0x89);
		expect(body[1]).toBe(0x50);
		expect(body[2]).toBe(0x4e);
		expect(body[3]).toBe(0x47);
	});
});
