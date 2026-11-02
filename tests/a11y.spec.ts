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
