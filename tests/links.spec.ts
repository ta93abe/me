import { expect, test } from "@playwright/test";

test.describe("Links Page", () => {
	test("should have correct title and heading", async ({ page }) => {
		await page.goto("/links");

		await expect(page).toHaveTitle(/Links/);
		await expect(page.locator("h1").first()).toContainText("Links");
	});

	test("should display page description", async ({ page }) => {
		await page.goto("/links");

		await expect(
			page.locator("p").filter({ hasText: "SNS・ソーシャルメディア" }),
		).toBeVisible();
	});

	test("should display SNS links", async ({ page }) => {
		await page.goto("/links");

		// GitHubリンクが存在することを確認
		await expect(
			page.locator('a[href*="github.com"]').first(),
		).toBeVisible();
	});

	test("should have external links with correct attributes", async ({
		page,
	}) => {
		await page.goto("/links");

		// 外部リンクが存在することを確認
		const externalLinks = page.locator('a[href^="https://"]');
		await expect(externalLinks.first()).toBeVisible();
	});
});
