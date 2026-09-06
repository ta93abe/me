import { expect, test } from "@playwright/test";

test.describe("Contact Page", () => {
	test("returns 200 with SNS links and no form", async ({ page }) => {
		const response = await page.goto("/contact");
		expect(response?.status()).toBe(200);

		await expect(page).toHaveTitle(/Contact/);
		await expect(page.locator("h1")).toHaveText("Contact");
		await expect(page.locator(".contact-sns .sns-links")).toBeVisible();
		await expect(page.locator("#contact-form")).toHaveCount(0);
	});

	test("shows Contact in the header navigation", async ({ page }) => {
		await page.goto("/contact");
		const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
		await expect(nav.getByRole("link", { name: "Contact" })).toHaveAttribute(
			"href",
			"/contact",
		);
	});
});
