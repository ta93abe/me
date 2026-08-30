import { expect, test } from "@playwright/test";

const sampleCopy = /サンプルブック|テスト投稿|最初のブログ投稿/;

test.describe("Published content", () => {
	test("header does not advertise Bookshelf", async ({ page }) => {
		await page.goto("/gallery");

		const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
		await expect(nav.getByRole("link", { name: "Gallery" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "Blog" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "Bookshelf" })).toHaveCount(0);
	});

	test("blog lists a real post without sample titles", async ({ page }) => {
		await page.goto("/blog");

		await expect(page.locator("h1").first()).toContainText("Blog");
		await expect(page.locator("body")).not.toContainText(sampleCopy);
		await expect(page.getByRole("link", { name: /dbt-jobs/ })).toBeVisible();
	});

	test("missing blog slug returns the 404 playground", async ({ page }) => {
		const response = await page.goto("/blog/does-not-exist");

		expect(response?.status()).toBe(404);
		await expect(page).toHaveTitle(/404/);
		await expect(page.locator("body")).not.toContainText(sampleCopy);
	});

	test("gallery keeps dbt-jobs with its own cover", async ({ page }) => {
		await page.goto("/gallery");

		await expect(page.locator("body")).not.toContainText(sampleCopy);
		await expect(page.getByRole("heading", { name: "dbt-jobs" })).toBeVisible();
		await expect(page.getByRole("heading", { name: "静かな枠" })).toHaveCount(0);
		await expect(page.getByRole("heading", { name: "夜の粒子" })).toHaveCount(0);

		const cover = page.locator(".gallery-piece img").first();
		await expect(cover).toBeVisible();
		await expect(cover).toHaveAttribute("alt", /dbt-jobs/i);
	});

	test("atelier and bookshelf stay empty without placeholders", async ({
		page,
	}) => {
		await page.goto("/atelier");
		await expect(page.locator("body")).not.toContainText(sampleCopy);
		await expect(page.getByRole("status")).toContainText(
			"まだ何も置いていません",
		);

		await page.goto("/bookshelf");
		await expect(page.locator("body")).not.toContainText(sampleCopy);
		await expect(page.getByRole("status")).toContainText(
			"まだ本を置いていません",
		);
	});
});
