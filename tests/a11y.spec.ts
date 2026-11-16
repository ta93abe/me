import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const rules = [
	"color-contrast",
	"label-content-name-mismatch",
	"aria-prohibited-attr",
	"button-name",
	"aria-progressbar-name",
	"page-has-heading-one",
] as const;

async function expectAxeClean(page: import("@playwright/test").Page) {
	const results = await new AxeBuilder({ page })
		.withRules([...rules])
		.analyze();
	expect(
		results.violations,
		JSON.stringify(results.violations, null, 2),
	).toEqual([]);
}

test.describe("Accessibility (TA-1482)", () => {
	test("home passes contrast, name, and ARIA checks", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("h1")).toHaveCount(1);
		await expect(page.locator("main")).toHaveCount(1);
		await expectAxeClean(page);
	});

	test("blog index passes contrast, name, and ARIA checks", async ({
		page,
	}) => {
		await page.goto("/blog/");
		await expect(page.locator("h1")).toHaveCount(1);
		await expect(page.locator("main")).toHaveCount(1);
		await expectAxeClean(page);
	});

	test("slide player has one h1, one main, and a named progressbar", async ({
		page,
	}) => {
		await page.goto("/slides/snowflake-observability/");
		await expect(page.locator("h1")).toHaveCount(1);
		await expect(page.locator("main")).toHaveCount(1);
		await expect(
			page.getByRole("progressbar", { name: "スライドの進捗" }),
		).toBeAttached();
		await expectAxeClean(page);
	});
});

test.describe("Accessibility (TA-2174)", () => {
	test(
		"tweet-heavy blog post has named links, contrast, and 24px targets",
		{ tag: "@smoke" },
		async ({ page }) => {
			const consoleErrors: string[] = [];
			page.on("console", (msg) => {
				if (msg.type() === "error") {
					consoleErrors.push(msg.text());
				}
			});
			const remoteOg: string[] = [];
			page.on("request", (request) => {
				if (request.url().includes("opengraph.githubassets.com")) {
					remoteOg.push(request.url());
				}
			});

			await page.goto("/blog/snowflake-world-tour-tokyo-2026/");
			await expect(page.locator("h1")).toHaveCount(1);
			await expect(page.locator(".tweet-embed")).not.toHaveCount(0);
			await expect(page.locator(".tweet-embed-follow")).toHaveCount(0);
			await expect(
				page.locator(".tweet-embed-identity:not([inert])"),
			).toHaveCount(0);

			const results = await new AxeBuilder({ page })
				.withRules(["link-name", "color-contrast", "target-size"])
				.analyze();
			expect(
				results.violations,
				JSON.stringify(results.violations, null, 2),
			).toEqual([]);

			expect(remoteOg, remoteOg.join("\n")).toEqual([]);
			expect(
				consoleErrors.filter((line) =>
					line.includes("opengraph.githubassets.com"),
				),
			).toEqual([]);
		},
	);
});

test.describe("Accessibility (TA-1542)", () => {
	test("gadgets listing has no redundant alt or color-only text links", async ({
		page,
	}) => {
		await page.goto("/gadgets/");
		const results = await new AxeBuilder({ page })
			.withRules([
				"image-redundant-alt",
				"link-in-text-block",
				"color-contrast",
			])
			.analyze();
		expect(
			results.violations,
			JSON.stringify(results.violations, null, 2),
		).toEqual([]);
	});
});
