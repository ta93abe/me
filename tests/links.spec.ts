import { expect, test } from "@playwright/test";

test.describe("Links Page", () => {
	test("should have correct title and heading", async ({ page }) => {
		await page.goto("/links");

		await expect(page).toHaveTitle(/Links/);
		await expect(page.locator("h1").first()).toContainText("Links");
	});

	test("should explain the curated profiles", async ({ page }) => {
		await page.goto("/links");

		await expect(
			page.locator("p").filter({ hasText: "いま主に使っている場所" }),
		).toBeVisible();
	});

	test("should list the active profiles and omit placeholders", async ({
		page,
	}) => {
		await page.goto("/links");

		const names = page.locator(".sns-row-name");
		await expect(names).toHaveText([
			"GitHub",
			"Zenn",
			"X",
			"LinkedIn",
			"Speaker Deck",
			"connpass",
			"Substack",
		]);

		await expect(page.getByText("WhatsApp")).toHaveCount(0);
		await expect(page.getByText("TikTok")).toHaveCount(0);
		await expect(page.getByText("Product Hunt")).toHaveCount(0);
	});

	test("should have external links with correct attributes", async ({
		page,
	}) => {
		await page.goto("/links");

		const github = page.locator('a[href*="github.com"]').first();
		await expect(github).toBeVisible();
		await expect(github).toHaveAttribute("target", "_blank");
		await expect(github).toHaveAttribute("rel", /noopener/);
	});
});
