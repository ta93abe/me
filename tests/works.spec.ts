import { expect, test } from "@playwright/test";

const hiddenSections = ["Gallery", "Atelier", "Bookshelf"] as const;

test.describe("Works", () => {
	test("lists the three featured works from one source", async ({ page }) => {
		const response = await page.goto("/works");
		expect(response?.status()).toBe(200);

		await expect(page).toHaveTitle(/Works/);
		await expect(
			page.getByRole("heading", { level: 1, name: "Works" }),
		).toBeVisible();

		await expect(page.getByRole("link", { name: /dbt-jobs/ })).toHaveAttribute(
			"href",
			"https://github.com/ta93abe/dbt-jobs",
		);
		await expect(page.getByRole("link", { name: /dbt-intro/ })).toHaveAttribute(
			"href",
			"https://github.com/ta93abe/dbt-intro",
		);
		await expect(page.getByRole("link", { name: /enbu/ })).toHaveAttribute(
			"href",
			"https://github.com/ta93abe/enbu",
		);

		for (const name of hiddenSections) {
			await expect(page.getByRole("link", { name })).toHaveCount(0);
		}
	});

	test("stays reachable from the home entrance without listing works there", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page.getByRole("link", { name: /dbt-jobs/ })).toHaveCount(0);

		await page
			.getByRole("navigation", { name: "主なページ" })
			.getByRole("link", { name: "Works" })
			.click();
		await expect(page).toHaveURL(/\/works\/?$/);
		await expect(page.getByRole("link", { name: /dbt-jobs/ })).toBeVisible();
	});
});
