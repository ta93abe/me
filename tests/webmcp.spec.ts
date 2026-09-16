import { expect, test } from "@playwright/test";

test.describe("WebMCP site overview", () => {
	test("get_site_overview discovery includes the A2A agent card", async ({
		page,
	}) => {
		await page.addInitScript(() => {
			const tools: { name: string; execute?: () => Promise<unknown> }[] = [];
			Object.defineProperty(navigator, "modelContext", {
				configurable: true,
				value: {
					registerTool(tool: { name: string; execute?: () => Promise<unknown> }) {
						tools.push(tool);
					},
					provideContext(context: {
						tools: { name: string; execute?: () => Promise<unknown> }[];
					}) {
						tools.push(...context.tools);
					},
				},
			});
			(
				window as Window & {
					__webmcpTools?: { name: string; execute?: () => Promise<unknown> }[];
				}
			).__webmcpTools = tools;
		});

		await page.goto("/");

		const overview = await page.evaluate(async () => {
			const tools =
				(
					window as Window & {
						__webmcpTools?: {
							name: string;
							execute?: () => Promise<{
								discovery?: { agentCard?: string };
							}>;
						}[];
					}
				).__webmcpTools ?? [];
			const tool = tools.find((item) => item.name === "get_site_overview");
			return tool?.execute ? await tool.execute() : null;
		});

		expect(overview?.discovery?.agentCard).toBe(
			"https://ta93abe.com/.well-known/agent-card.json",
		);
	});
});
