import { expect, test } from "@playwright/test";

const sampleCopy = /サンプルブック|テスト投稿|最初のブログ投稿/;
const hiddenSections = ["Gallery", "Atelier", "Bookshelf"] as const;

test.describe("Published content", () => {
	test("header only advertises live sections", async ({ page }) => {
		await page.goto("/blog");

		const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
		await expect(nav.getByRole("link", { name: "Blog" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "Links" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "Tools" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "Slides" })).toBeVisible();

		for (const name of hiddenSections) {
			await expect(nav.getByRole("link", { name })).toHaveCount(0);
		}
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
		await expect(page.getByRole("link", { name: "Gallery" })).toHaveCount(0);
	});

	test("retired collection URLs redirect home", async ({ page }) => {
		for (const path of [
			"/gallery",
			"/gallery/dbt-jobs",
			"/atelier",
			"/bookshelf",
			"/works",
		]) {
			const response = await page.goto(path);
			expect(response?.status(), path).toBe(200);
			expect(new URL(page.url()).pathname, path).toBe("/");
			await expect(page.locator("body")).not.toContainText(sampleCopy);
		}
	});
});
