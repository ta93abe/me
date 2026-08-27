import { expect, test } from "@playwright/test";

test.describe("Contact page", () => {
	test("is reachable and lists primary contact profiles", async ({ page }) => {
		await page.goto("/contact");

		await expect(page).toHaveTitle(/Contact/);
		await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact");

		await expect(
			page.getByRole("link", { name: "GitHub", exact: true }),
		).toHaveAttribute("href", "https://github.com/ta93abe");
		await expect(
			page.getByRole("link", { name: "X", exact: true }),
		).toHaveAttribute("href", "https://x.com/ta93abe_");
		await expect(
			page.getByRole("link", { name: "LinkedIn", exact: true }),
		).toHaveAttribute("href", "https://linkedin.com/in/ta93abe");
	});
});
