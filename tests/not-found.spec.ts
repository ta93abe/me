import { expect, test } from "@playwright/test";

test.describe("404 recovery", () => {
	test("unknown URL offers About, Contact, and Blog", async ({ page }) => {
		const response = await page.goto("/this-page-does-not-exist");
		expect(response?.status()).toBe(404);
		await expect(page).toHaveTitle(/404/);

		const index = page.getByRole("navigation", { name: "主要ページ" });
		await expect(index.getByRole("link", { name: "About" })).toHaveAttribute(
			"href",
			"/about",
		);
		await expect(index.getByRole("link", { name: "Blog" })).toHaveAttribute(
			"href",
			"/blog",
		);
		await expect(index.getByRole("link", { name: "Contact" })).toHaveAttribute(
			"href",
			"/contact",
		);
		await expect(index.getByRole("link", { name: "Gallery" })).toHaveCount(0);
		await expect(index.getByRole("link", { name: "Tools" })).toHaveCount(0);

		await index.getByRole("link", { name: "Contact" }).click();
		await expect(page).toHaveURL(/\/contact\/?$/);
		await expect(
			page.getByRole("heading", { level: 1, name: "Contact" }),
		).toBeVisible();
	});

	test("missing blog slug can return to About", async ({ page }) => {
		const response = await page.goto("/blog/does-not-exist");
		expect(response?.status()).toBe(404);

		const index = page.getByRole("navigation", { name: "主要ページ" });
		await index.getByRole("link", { name: "About" }).click();
		await expect(page).toHaveURL(/\/about\/?$/);
		await expect(
			page.getByRole("heading", { level: 1, name: "About" }),
		).toBeVisible();
	});

	test("unknown URL can return to Blog", async ({ page }) => {
		const response = await page.goto("/missing-folio");
		expect(response?.status()).toBe(404);

		const index = page.getByRole("navigation", { name: "主要ページ" });
		await index.getByRole("link", { name: "Blog" }).click();
		await expect(page).toHaveURL(/\/blog\/?$/);
		await expect(
			page.getByRole("heading", { level: 1, name: "Blog" }),
		).toBeVisible();
	});
});
