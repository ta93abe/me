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

	test("mobile header keeps the primary axis in the menu markup", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/blog");

		const headerNav = page.getByRole("navigation", {
			name: "メインナビゲーション",
		});
		await expect(
			headerNav.getByRole("button", { name: "メニューを開く" }),
		).toBeVisible();
		for (const name of primary) {
			await expect(
				headerNav.getByRole("link", { name, exact: true }),
			).toHaveCount(0);
		}

		const dialog = page.locator("dialog[aria-label='メニュー']");
		for (const name of primary) {
			await expect(dialog.getByText(name, { exact: true })).toHaveCount(1);
		}
		for (const name of [...secondary, ...hidden]) {
			await expect(dialog.getByText(name, { exact: true })).toHaveCount(0);
		}

		const footerNav = page.getByRole("navigation", {
			name: "二次ナビゲーション",
		});
		for (const name of secondary) {
			await expect(footerNav.getByRole("link", { name, exact: true })).toBeVisible();
		}
	});
});
