import { expect, test } from "@playwright/test";

const recoveryLinks = [
	{ href: "/about", label: "About" },
	{ href: "/contact", label: "Contact" },
	{ href: "/gallery", label: "Gallery" },
	{ href: "/blog", label: "Blog" },
] as const;

test.describe("404 recovery", () => {
	test("missing URLs expose About, Contact, Gallery, and Blog", async ({
		page,
	}) => {
		const response = await page.goto("/this-page-does-not-exist");

		expect(response?.status()).toBe(404);
		await expect(page.locator("h1")).toContainText("ページが街角で迷子です。");

		const index = page.getByRole("navigation", { name: "Main sections" });
		for (const link of recoveryLinks) {
			await expect(
				index.getByRole("link", { name: link.label }),
			).toHaveAttribute("href", link.href);
		}
	});

	test("returns to a human page from a missing URL", async ({ page }) => {
		await page.goto("/missing-folio");
		await page
			.getByRole("navigation", { name: "Main sections" })
			.getByRole("link", { name: "Gallery" })
			.click();

		await expect(page).toHaveURL(/\/gallery\/?$/);
		await expect(page.locator("h1").first()).toBeVisible();
	});

	test("does not redirect hiring-bot paths to About", async ({ page }) => {
		for (const path of ["/careers", "/jobs"]) {
			const response = await page.goto(path);

			expect(response?.status()).toBe(404);
			await expect(page).toHaveURL(new RegExp(`${path}/?$`));
			await expect(
				page
					.getByRole("navigation", { name: "Main sections" })
					.getByRole("link", { name: "About" }),
			).toHaveAttribute("href", "/about");
		}
	});

	test("does not send /contact to About", async ({ page }) => {
		await page.goto("/contact");
		await expect(page).not.toHaveURL(/\/about\/?$/);
	});
});
