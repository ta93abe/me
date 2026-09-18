import { expect, test } from "@playwright/test";

test.describe("WebMCP", () => {
	test("page scripts register get_site_overview at most once", async ({
		page,
	}) => {
		await page.addInitScript(() => {
			const tools: { name: string }[] = [];
			Object.defineProperty(navigator, "modelContext", {
				configurable: true,
				value: {
					registerTool(tool: { name: string }) {
						tools.push(tool);
					},
					provideContext(context: { tools: { name: string }[] }) {
						tools.push(...context.tools);
					},
				},
			});
			(
				window as Window & { __webmcpTools?: { name: string }[] }
			).__webmcpTools = tools;
		});

		await page.goto("/");

		const names = await page.evaluate(() =>
			(
				window as Window & { __webmcpTools?: { name: string }[] }
			).__webmcpTools?.map((tool) => tool.name),
		);

		expect(names ?? []).toEqual([]);
	});
});
