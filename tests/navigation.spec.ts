import { expect, test } from "@playwright/test";

const primary = ["About", "Blog", "Contact"] as const;
const secondary = ["Links", "Tools", "Slides"] as const;
const hidden = ["Gallery", "Atelier", "Bookshelf"] as const;

test.describe("Navigation", () => {
	test("desktop header shows the primary axis only", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/blog");

		const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
		for (const name of primary) {
			await expect(nav.getByRole("link", { name })).toBeVisible();
		}
		for (const name of [...secondary, ...hidden]) {
			await expect(nav.getByRole("link", { name })).toHaveCount(0);
		}

		await nav.getByRole("link", { name: "About" }).click();
		await expect(page).toHaveURL(/\/about\/?$/);
	});

	test("footer keeps secondary pages reachable", async ({ page }) => {
		await page.goto("/blog");

		const footer = page.getByRole("contentinfo");
		const secondaryNav = footer.getByRole("navigation", {
			name: "二次ナビゲーション",
		});
		for (const name of secondary) {
			await expect(secondaryNav.getByRole("link", { name })).toBeVisible();
		}
		for (const name of [...primary, ...hidden]) {
			await expect(secondaryNav.getByRole("link", { name })).toHaveCount(0);
		}

		await secondaryNav.getByRole("link", { name: "Links" }).click();
		await expect(page).toHaveURL(/\/links\/?$/);
	});

	test("mobile menu shows the same primary axis", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/blog");

		await page.getByRole("button", { name: "メニューを開く" }).click();

		const menu = page.getByRole("navigation", {
			name: "モバイルナビゲーション",
		});
		for (const name of primary) {
			await expect(menu.getByRole("link", { name })).toBeVisible();
		}
		for (const name of [...secondary, ...hidden]) {
			await expect(menu.getByRole("link", { name })).toHaveCount(0);
		}

		await menu.getByRole("link", { name: "Contact" }).click();
		await expect(page).toHaveURL(/\/contact\/?$/);
	});
});
