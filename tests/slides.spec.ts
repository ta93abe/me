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

	test("listing exposes Open Graph, Twitter, and CollectionPage JSON-LD", async ({
		page,
	}) => {
		await page.goto("/slides");
		await expect(page).toHaveTitle("Slides | Takumi Abe");
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			"content",
			"https://ta93abe.com/og/slides.png",
		);
		await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
			"content",
			"summary_large_image",
		);
		const jsonLd = await page
			.locator('script[type="application/ld+json"]')
			.allTextContents();
		expect(jsonLd.some((text) => text.includes("CollectionPage"))).toBe(true);
		expect(jsonLd.some((text) => text.includes("/slides/showcase/"))).toBe(
			true,
		);
	});

	test("player exposes deck Open Graph, Twitter, and JSON-LD", async ({
		page,
	}) => {
		await page.goto("/slides/showcase/");
		await expect(page).toHaveTitle(
			"デザインシステム ショーケース | Slides | Takumi Abe",
		);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			"href",
			"https://ta93abe.com/slides/showcase/",
		);
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			"content",
			"https://ta93abe.com/og/slides/showcase.png",
		);
		await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
			"content",
			"summary_large_image",
		);
		await expect(page.locator('link[rel="alternate"]')).toHaveAttribute(
			"href",
			"/slides/showcase.pdf",
		);
		const jsonLd = await page
			.locator('script[type="application/ld+json"]')
			.textContent();
		expect(jsonLd).toContain("PresentationDigitalDocument");
		expect(jsonLd).toContain("/slides/showcase.pdf");
	});

	test("print page shows every slide and skips the player", async ({
		page,
	}) => {
		await page.goto("/slides/showcase/print/");
		await expect(page.locator("html")).toHaveAttribute("data-print-ready");
		await expect(page.locator(".slide")).toHaveCount(7);
		await expect(page.locator("html")).toHaveClass(/is-print/);
		await expect(page.locator(".player-ui")).toHaveCount(0);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			"noindex, nofollow",
		);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			"href",
			"https://ta93abe.com/slides/showcase/",
		);
		await expect(
			page.locator('script[type="application/ld+json"]'),
		).toHaveCount(0);
	});

	test("unknown slug is 404", async ({ page }) => {
		const response = await page.goto("/slides/no-such-deck/");
		expect(response?.status()).toBe(404);
	});
});
