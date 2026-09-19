import { expect, test } from "@playwright/test";

test.describe("Talks", () => {
	test("lists recorded appearances with YouTube and extra links", async ({
		page,
	}) => {
		const response = await page.goto("/talks");
		expect(response?.status()).toBe(200);

		await expect(page).toHaveTitle(/Talks/);
		await expect(
			page.getByRole("heading", { level: 1, name: "Talks" }),
		).toBeVisible();
		await expect(page.getByText("登壇と配信に出た回です。")).toBeVisible();

		await expect(
			page.getByRole("heading", {
				level: 2,
				name: "Frosty Friday Live Challenge Vol.56",
			}),
		).toBeVisible();
		await expect(
			page.getByRole("heading", {
				level: 2,
				name: "Cloudflare で始める Data Platform",
			}),
		).toBeVisible();

		await expect(
			page.getByRole("link", {
				name: "Frosty Friday Live Challenge Vol.56を YouTube で見る",
			}),
		).toHaveAttribute("href", "https://www.youtube.com/watch?v=KLEApocYmww");
		await expect(
			page.getByRole("link", {
				name: "Cloudflare で始める Data Platformを YouTube で見る",
			}),
		).toHaveAttribute("href", "https://www.youtube.com/watch?v=7yvAfZ8vCDU");

		await expect(
			page.getByRole("link", { name: "再生リスト" }),
		).toHaveAttribute(
			"href",
			"https://www.youtube.com/playlist?list=PLVj4iIZgzTAq2FzaBBgqFOtZaJTcoG3JR",
		);
		await expect(page.getByRole("link", { name: "イベント" })).toHaveAttribute(
			"href",
			"https://datatech-jp.connpass.com/event/386885/",
		);
		await expect(page.getByRole("link", { name: "スライド" })).toHaveAttribute(
			"href",
			"https://speakerdeck.com/ta93abe/cloudflare-dehazimeru-data-platform",
		);
	});

	test("stays reachable from the footer", async ({ page }) => {
		await page.goto("/about");
		await page
			.getByRole("navigation", { name: "二次ナビゲーション" })
			.getByRole("link", { name: "Talks" })
			.click();
		await expect(page).toHaveURL(/\/talks\/?$/);
		await expect(
			page.getByRole("heading", { level: 1, name: "Talks" }),
		).toBeVisible();
	});
});
