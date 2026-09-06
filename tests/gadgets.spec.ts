import { expect, test } from "@playwright/test";

function isBundledGadgetSrc(src: string | null, slug: string): boolean {
	if (!src) {
		return false;
	}
	if (src.startsWith("/gadgets/") || src.startsWith("/things/")) {
		return false;
	}
	if (src.startsWith("data:image/svg+xml")) {
		return true;
	}
	return src.includes(slug) && /\.svg(?:\?.*)?$/.test(src);
}

test.describe("Gadgets page", () => {
	test("lists objects with thumbnails and stays out of the header", async ({
		page,
	}) => {
		await page.goto("/gadgets");

		await expect(page).toHaveTitle(/Gadgets/);
		await expect(page.locator("h1").first()).toContainText("Gadgets");
		await expect(
			page.getByRole("link", { name: "Tools" }).first(),
		).toHaveAttribute("href", "/tools");

		const macbook = page.getByRole("link", { name: "MacBook Pro" });
		await expect(macbook).toBeVisible();
		const thumb = macbook.locator("[data-gadget-thumb='macbook-pro']");
		await expect(thumb).toHaveCount(1);
		await expect(thumb).toBeVisible();

		const src = await thumb.getAttribute("src");
		expect(isBundledGadgetSrc(src, "macbook-pro")).toBe(true);
		expect(src?.startsWith("data:image/svg+xml")).toBe(true);

		await thumb.evaluate((el) => (el as HTMLImageElement).decode());
		const naturalWidth = await thumb.evaluate(
			(el) => (el as HTMLImageElement).naturalWidth,
		);
		expect(naturalWidth).toBeGreaterThan(0);

		const name = await thumb.evaluate(
			(el) => getComputedStyle(el).viewTransitionName,
		);
		expect(name).toBe("none");

		const header = page.getByRole("navigation", {
			name: "メインナビゲーション",
		});
		await expect(header.getByRole("link", { name: "Gadgets" })).toHaveCount(0);

		const footer = page.getByRole("contentinfo");
		await expect(
			footer
				.getByRole("navigation", { name: "二次ナビゲーション" })
				.getByRole("link", { name: "Gadgets" }),
		).toBeVisible();
	});

	test("opens an item with a shared thumbnail name and returns", async ({
		page,
	}) => {
		await page.goto("/gadgets");
		await page.getByRole("link", { name: "MacBook Pro" }).click();

		await expect(page).toHaveURL(/\/gadgets\/macbook-pro\/?$/);
		await expect(page).toHaveTitle(/MacBook Pro/);
		await expect(
			page.getByRole("heading", { level: 1, name: "MacBook Pro" }),
		).toBeVisible();
		await expect(page.getByText("Nix の土台")).toBeVisible();

		const thumb = page.locator("[data-gadget-thumb='macbook-pro']");
		expect(isBundledGadgetSrc(await thumb.getAttribute("src"), "macbook-pro")).toBe(
			true,
		);
		await expect(thumb).toBeVisible();
		await thumb.evaluate((el) => (el as HTMLImageElement).decode());
		expect(
			await thumb.evaluate((el) => (el as HTMLImageElement).naturalWidth),
		).toBeGreaterThan(0);

		await page.locator("main").getByRole("link", { name: "Gadgets" }).click();
		await expect(page).toHaveURL(/\/gadgets\/?$/);
		await expect(page.locator("h1").first()).toContainText("Gadgets");
	});

	test("old /things URLs send people to /gadgets", async ({ page }) => {
		await page.goto("/things");
		await expect(page).toHaveURL(/\/gadgets\/?$/);
		await expect(page.locator("h1").first()).toContainText("Gadgets");

		await page.goto("/things/macbook-pro");
		await expect(page).toHaveURL(/\/gadgets\/macbook-pro\/?$/);
		await expect(
			page.getByRole("heading", { level: 1, name: "MacBook Pro" }),
		).toBeVisible();
	});
});
