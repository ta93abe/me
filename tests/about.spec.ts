import { expect, test } from "@playwright/test";

test.describe("About Page", () => {
	test("should return 200 with a readable introduction", async ({ page }) => {
		const response = await page.goto("/about");

		expect(response?.status()).toBe(200);
		await expect(page).toHaveTitle(/About/);
		await expect(page.locator("h1").first()).toContainText("Takumi Abe");
		await expect(page.getByText("Software Engineer").first()).toBeVisible();
		await expect(
			page.getByText("データ基盤と CI を書くソフトウェアエンジニア"),
		).toBeVisible();
	});

	test("should link to GitHub, X, LinkedIn, featured work, and contact", async ({
		page,
	}) => {
		await page.goto("/about");

		await expect(
			page.locator('a[href="https://github.com/ta93abe"]'),
		).toBeVisible();
		await expect(
			page.locator('a[href="https://x.com/ta93abe_"]'),
		).toBeVisible();
		await expect(
			page.locator('a[href="https://linkedin.com/in/ta93abe"]'),
		).toBeVisible();
		await expect(page.locator('a[href="/contact"]')).toBeVisible();
		await expect(page.locator('a[href="/gallery"]').first()).toBeVisible();
	});

	test("should expose a Person JSON-LD with jobTitle, sameAs, and url", async ({
		page,
	}) => {
		await page.goto("/about");

		const jsonLdBlocks = await page
			.locator('script[type="application/ld+json"]')
			.allTextContents();
		const schemas = jsonLdBlocks.map((block) => JSON.parse(block) as unknown);
		const person = schemas.find(
			(schema) =>
				typeof schema === "object" &&
				schema !== null &&
				(schema as { "@type"?: string })["@type"] === "Person",
		) as {
			jobTitle?: string;
			url?: string;
			sameAs?: string[];
		};

		expect(person).toBeDefined();
		expect(person.jobTitle).toBe("Software Engineer");
		expect(person.url).toMatch(/\/about\/?$/);
		expect(person.sameAs).toEqual(
			expect.arrayContaining([
				"https://github.com/ta93abe",
				"https://x.com/ta93abe_",
				"https://linkedin.com/in/ta93abe",
			]),
		);
	});

	test("should include About in the main navigation", async ({ page }) => {
		await page.goto("/about");

		await expect(
			page.getByRole("navigation", { name: "メインナビゲーション" }).getByRole(
				"link",
				{ name: "About" },
			),
		).toBeVisible();
	});
});
