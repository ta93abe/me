import { expect, test } from "@playwright/test";

test.describe("Agent catalog discovery", () => {
	test("public pages link to the ai-catalog and ARD manifests", async ({
		request,
	}) => {
		for (const path of ["/", "/about", "/works"]) {
			const html = await (await request.get(path)).text();
			expect(html, path).toContain('rel="ai-catalog"');
			expect(html, path).toContain(
				'href="https://ta93abe.com/.well-known/ai-catalog.json"',
			);
			expect(html, path).toContain('rel="ard"');
			expect(html, path).toContain(
				'href="https://ta93abe.com/.well-known/ard.json"',
			);
		}
	});
});
