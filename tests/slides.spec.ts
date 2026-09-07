import { expect, test } from "@playwright/test";

test.describe("Slides", () => {
	test("lists decks on the same origin and opens a player", async ({
		page,
	}) => {
		await page.goto("/slides");
		await expect(page.getByRole("heading", { name: "Slides", level: 1 })).toBeVisible();

		const showcase = page.getByRole("link", {
			name: /デザインシステム ショーケース/,
		});
		await expect(showcase).toHaveAttribute("href", "/slides/showcase/");
		await showcase.click();
		await expect(page).toHaveURL(/\/slides\/showcase\/?#/);

		await expect(page.locator(".deck")).toBeVisible();
		await expect(page.locator(".slide.is-active")).toHaveAttribute(
			"data-type",
			"cover",
		);
		await expect(page.getByRole("link", { name: "PDF" })).toHaveAttribute(
			"href",
			"/slides/showcase.pdf",
		);

		await page.goBack();
		await expect(page).toHaveURL(/\/slides\/?$/);
	});

	test("opens slide 2 from the hash", async ({ page }) => {
		await page.goto("/slides/showcase/#2");
		await expect(page.locator(".slide.is-active")).toHaveAttribute(
			"data-index",
			"2",
		);
		await expect(page.locator(".slide.is-active")).toHaveAttribute(
			"data-type",
			"section",
		);
	});

	test("print page shows every slide and skips the player", async ({
		page,
	}) => {
		await page.goto("/slides/showcase/print/");
		await expect(page.locator("html")).toHaveAttribute("data-print-ready");
		await expect(page.locator(".slide")).toHaveCount(7);
		await expect(page.locator("html")).toHaveClass(/is-print/);
		await expect(page.locator(".player-ui")).toHaveCount(0);
	});

	test("unknown slug is 404", async ({ page }) => {
		const response = await page.goto("/slides/no-such-deck/");
		expect(response?.status()).toBe(404);
	});
});
