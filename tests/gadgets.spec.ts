import { expect, test } from "@playwright/test";

function isBundledGadgetSrc(src: string | null, slug: string): boolean {
	if (!src) {
		return false;
	}
	if (src.startsWith("/gadgets/") || src.startsWith("/things/")) {
		return false;
	}
	if (src.startsWith("data:image/webp")) {
		return true;
	}
	const isRaster = /\.(webp|png|jpe?g)(?:\?.*)?$/i.test(src);
	return (
		isRaster &&
		(src.includes(slug) ||
			src.includes("/_astro/") ||
			src.includes("/src/assets/gadgets/") ||
			src.includes("/media/gadgets/"))
	);
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

		const studio = page.getByRole("link", { name: "Mac Studio M1 Max" });
		await expect(studio).toBeVisible();
		const thumb = studio.locator("[data-gadget-thumb='mac-studio']");
		await expect(thumb).toHaveCount(1);
		await expect(thumb).toBeVisible();

		const src = await thumb.getAttribute("src");
		expect(isBundledGadgetSrc(src, "mac-studio")).toBe(true);
		expect(src?.startsWith("data:image/webp")).toBe(true);

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
		await page.getByRole("link", { name: "Mac Studio M1 Max" }).click();

		await expect(page).toHaveURL(/\/gadgets\/mac-studio\/?$/);
		await expect(page).toHaveTitle(/Mac Studio M1 Max/);
		await expect(
			page.getByRole("heading", { level: 1, name: "Mac Studio M1 Max" }),
		).toBeVisible();
		await expect(page.getByText("Nix の土台")).toBeVisible();

		const thumb = page.locator("[data-gadget-thumb='mac-studio']");
		expect(isBundledGadgetSrc(await thumb.getAttribute("src"), "mac-studio")).toBe(
			true,
		);
		await expect(thumb).toBeVisible();
		await thumb.evaluate((el) => (el as HTMLImageElement).decode());
		expect(
			await thumb.evaluate((el) => (el as HTMLImageElement).naturalWidth),
		).toBeGreaterThan(0);

		const source = page.getByRole("link", {
			name: "Mac Studio M1 Max の画像出典",
		});
		await expect(source).toBeVisible();
		await expect(source).toHaveText("Yasu / CC BY-SA 3.0");
		await expect(source).toHaveAttribute(
			"href",
			"https://commons.wikimedia.org/wiki/File:Mac_Studio_(2022)_front.jpg",
		);

		await page.locator("main").getByRole("link", { name: "Gadgets" }).click();
		await expect(page).toHaveURL(/\/gadgets\/?$/);
		await expect(page.locator("h1").first()).toContainText("Gadgets");
	});
});
