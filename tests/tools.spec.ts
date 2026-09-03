import { expect, test } from "@playwright/test";

test.describe("Tools Page", () => {
	test("should have correct title and heading", async ({ page }) => {
		await page.goto("/tools");

		await expect(page).toHaveTitle(/Tools/);
		await expect(page.locator("h1").first()).toContainText("Tools");
	});

	test("should lead with Nix and the dotfiles repository", async ({ page }) => {
		await page.goto("/tools");

		await expect(
			page.locator("p").filter({ hasText: "Nix + Home Manager" }),
		).toBeVisible();
		await expect(page.getByRole("heading", { name: "なぜ Nix か" })).toBeVisible();

		const dotfiles = page.locator('a[href="https://github.com/ta93abe/dotfiles"]');
		await expect(dotfiles.first()).toBeVisible();
	});

	test("should omit encyclopedic and discontinued tools", async ({ page }) => {
		await page.goto("/tools");

		await expect(page.getByRole("heading", { name: "Spark AR Studio" })).toHaveCount(
			0,
		);
		await expect(page.getByRole("heading", { name: "Yaak" })).toHaveCount(0);
		await expect(page.getByRole("heading", { name: "Google Chrome" })).toHaveCount(
			0,
		);
		await expect(page.getByRole("heading", { name: "Slack" })).toHaveCount(0);
		await expect(page.getByRole("heading", { name: "Spotify" })).toHaveCount(0);
	});
});
