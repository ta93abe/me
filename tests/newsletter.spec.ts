import { expect, test } from "@playwright/test";

const subscribeUrl = "https://ta93abe.substack.com/subscribe";
const publicationUrl = "https://ta93abe.substack.com";

test.describe("Newsletter CTA (Substack)", () => {
	test("footer links to Substack subscribe", async ({ page }) => {
		await page.goto("/blog");

		const footerCta = page.locator(
			'footer a[data-newsletter-cta="footer"]',
		);
		await expect(footerCta).toBeVisible();
		await expect(footerCta).toHaveAttribute("href", subscribeUrl);
		await expect(footerCta).toHaveAttribute("target", "_blank");
		await expect(footerCta).toHaveAttribute("rel", /noopener/);
	});

	test("blog index has a subscribe block", async ({ page }) => {
		await page.goto("/blog");

		const block = page.locator("[data-newsletter-cta-block]");
		await expect(block).toBeVisible();
		await expect(block.getByRole("heading", { name: "Newsletter" })).toBeVisible();
		await expect(
			block.locator('a[data-newsletter-cta="blog-index"]'),
		).toHaveAttribute("href", subscribeUrl);
	});

	test("blog post has a subscribe block", async ({ page }) => {
		await page.goto("/blog/first-post");

		const block = page.locator("[data-newsletter-cta-block]");
		await expect(block).toBeVisible();
		await expect(
			block.locator('a[data-newsletter-cta="blog-post"]'),
		).toHaveAttribute("href", subscribeUrl);
	});

	test("Links keeps the Substack entry", async ({ page }) => {
		await page.goto("/links");

		const substack = page.locator(`a[href="${publicationUrl}"]`);
		await expect(substack.first()).toBeVisible();
		await expect(substack.first()).toHaveAttribute("aria-label", "Substack");
	});

	test("does not embed a Substack widget", async ({ page }) => {
		await page.goto("/blog");

		await expect(page.locator("iframe[src*='substack']")).toHaveCount(0);
		await expect(page.locator("script[src*='substack']")).toHaveCount(0);
	});
});
