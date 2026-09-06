import { expect, test } from "@playwright/test";

test.describe("Things page", () => {
	test("lists objects with thumbnails and stays out of the header", async ({
		page,
	}) => {
		await page.goto("/things");

		await expect(page).toHaveTitle(/Things/);
		await expect(page.locator("h1").first()).toContainText("Things");
		await expect(page.getByRole("link", { name: "Tools" }).first()).toHaveAttribute(
			"href",
			"/tools",
		);

		const macbook = page.getByRole("link", { name: "MacBook Pro" });
		await expect(macbook).toBeVisible();
		await expect(macbook.locator("[data-thing-thumb='macbook-pro']")).toHaveCount(
			1,
		);

		const name = await macbook
			.locator("[data-thing-thumb='macbook-pro']")
			.evaluate((el) => getComputedStyle(el).viewTransitionName);
		expect(name).toBe("none");

		const header = page.getByRole("navigation", { name: "メインナビゲーション" });
		await expect(header.getByRole("link", { name: "Things" })).toHaveCount(0);

		const footer = page.getByRole("contentinfo");
		await expect(
			footer.getByRole("navigation", { name: "二次ナビゲーション" }).getByRole(
				"link",
				{ name: "Things" },
			),
		).toBeVisible();
	});

	test("opens an item with a shared thumbnail name and returns", async ({
		page,
	}) => {
		await page.goto("/things");
		await page.getByRole("link", { name: "MacBook Pro" }).click();

		await expect(page).toHaveURL(/\/things\/macbook-pro\/?$/);
		await expect(page).toHaveTitle(/MacBook Pro/);
		await expect(
			page.getByRole("heading", { level: 1, name: "MacBook Pro" }),
		).toBeVisible();
		await expect(page.getByText("Nix の土台")).toBeVisible();

		const thumb = page.locator("[data-thing-thumb='macbook-pro']");
		await expect(thumb).toHaveAttribute("src", "/things/macbook-pro.svg");
		await expect(thumb).toBeVisible();

		await page.locator("main").getByRole("link", { name: "Things" }).click();
		await expect(page).toHaveURL(/\/things\/?$/);
		await expect(page.locator("h1").first()).toContainText("Things");
	});
});
