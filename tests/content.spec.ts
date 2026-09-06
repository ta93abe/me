import { expect, test } from "@playwright/test";

const sampleCopy = /サンプルブック|テスト投稿|最初のブログ投稿/;
const hiddenSections = ["Gallery", "Atelier", "Bookshelf"] as const;

test.describe("Published content", () => {
	test("header only advertises live sections", async ({ page }) => {
		await page.goto("/blog");

		const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
		await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "Blog" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "Contact" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "Links" })).toHaveCount(0);
		await expect(nav.getByRole("link", { name: "Tools" })).toHaveCount(0);
		await expect(nav.getByRole("link", { name: "Slides" })).toHaveCount(0);

		for (const name of hiddenSections) {
			await expect(nav.getByRole("link", { name })).toHaveCount(0);
		}
	});

	test("preview blog is R2-only and has no leftover Git posts", async ({
		page,
	}) => {
		await page.goto("/blog");

		await expect(page.locator("h1").first()).toContainText("Blog");
		await expect(page.locator("body")).not.toContainText(sampleCopy);
		await expect(page.getByRole("link", { name: /dbt-jobs/ })).toHaveCount(0);
		await expect(page.getByRole("status")).toContainText(
			"まだ記事を置いていません。",
		);
	});

	test("missing blog slug returns the 404 playground", async ({ page }) => {
		const response = await page.goto("/blog/does-not-exist");

		expect(response?.status()).toBe(404);
		await expect(page).toHaveTitle(/404/);
		await expect(page.locator("body")).not.toContainText(sampleCopy);
		await expect(page.getByRole("link", { name: "Gallery" })).toHaveCount(0);
	});

	test("rss and blog sitemap stay valid without leftover Git posts", async ({
		request,
	}) => {
		const rss = await request.get("/rss.xml");
		expect(rss.ok()).toBeTruthy();
		const rssBody = await rss.text();
		expect(rssBody).toContain("<language>ja</language>");
		expect(rssBody).not.toContain("dbt-jobs");

		const sitemap = await request.get("/sitemap-blog.xml");
		expect(sitemap.ok()).toBeTruthy();
		const sitemapBody = await sitemap.text();
		expect(sitemapBody).toContain("/blog/");
		expect(sitemapBody).not.toContain("dbt-jobs");
		expect(sitemapBody).not.toMatch(/gallery|atelier|bookshelf/);
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
