import { expect, test } from "@playwright/test";

test.describe("Works and Gallery split", () => {
	test("lists engineering work on /works and not in Gallery", async ({
		page,
	}) => {
		await page.goto("/works");

		await expect(page).toHaveTitle(/Works/);
		await expect(page.locator("h1").first()).toContainText("Works");
		await expect(page.getByRole("link", { name: "dbt-jobs" }).first()).toBeVisible();

		await page.goto("/gallery");
		await expect(page.locator("h1").first()).toContainText("ギャラリー");
		await expect(
			page.locator('a[href="/gallery/dbt-jobs"]'),
		).toHaveCount(0);
		await expect(page.getByRole("link", { name: "Works" }).first()).toBeVisible();
	});

	test("opens a work detail from the list", async ({ page }) => {
		await page.goto("/works");
		await page.getByRole("link", { name: "dbt-jobs" }).first().click();

		await expect(page).toHaveURL(/\/works\/dbt-jobs\/?$/);
		await expect(page.locator("h1")).toContainText("dbt-jobs");
		await expect(page.getByRole("link", { name: "リポジトリを見る" })).toBeVisible();
	});

	test("redirects old gallery project URL and /projects to Works", async ({
		page,
	}) => {
		await page.goto("/gallery/dbt-jobs");
		await expect(page).toHaveURL(/\/works\/dbt-jobs\/?$/);

		await page.goto("/projects");
		await expect(page).toHaveURL(/\/works\/?$/);
	});

	test("reaches a featured work from the homepage in one click", async ({
		page,
	}) => {
		await page.goto("/");

		await expect(page.getByRole("heading", { name: "Takumi Abe" })).toBeVisible();
		await expect(page.getByRole("navigation", { name: "代表作" })).toBeVisible();

		await page.locator("[data-featured-work]").first().click();
		await expect(page).toHaveURL(/\/works\/dbt-jobs\/?$/);
	});

	test("exposes Works in the header navigation", async ({ page }) => {
		await page.goto("/");
		const header = page.getByRole("navigation", { name: "メインナビゲーション" });
		await expect(header.getByRole("link", { name: "Works" })).toBeVisible();
	});
});
