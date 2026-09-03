import { expect, test } from "@playwright/test";

test.describe("Home", () => {
	test("shows who and what within the first viewport", async ({ page }) => {
		await page.goto("/");

		await expect(page).toHaveTitle(/Takumi Abe/);
		await expect(
			page.getByRole("heading", { level: 1, name: "Takumi Abe" }),
		).toBeVisible();
		await expect(
			page.getByText("ta93abe", { exact: true }).first(),
		).toBeVisible();
		await expect(
			page.getByText("データ基盤と CI を書くソフトウェアエンジニア"),
		).toBeVisible();

		const ctas = page.getByRole("navigation", { name: "主なページ" });
		await expect(ctas.getByRole("link", { name: "About" })).toHaveAttribute(
			"href",
			"/about",
		);
		await expect(ctas.getByRole("link", { name: "Blog" })).toHaveAttribute(
			"href",
			"/blog",
		);
		await expect(ctas.getByRole("link", { name: "Contact" })).toHaveAttribute(
			"href",
			"/contact",
		);
		await expect(ctas.getByRole("link", { name: "Gallery" })).toHaveCount(0);

		await expect(page.getByRole("link", { name: /dbt-jobs/ })).toHaveAttribute(
			"href",
			"https://github.com/ta93abe/dbt-jobs",
		);
	});

	test("keeps the intro readable on a mobile viewport", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/");

		const name = page.getByRole("heading", {
			level: 1,
			name: "Takumi Abe",
		});
		await expect(name).toBeVisible();

		const box = await name.boundingBox();
		expect(box).not.toBeNull();
		if (box) {
			expect(box.y).toBeGreaterThan(48);
			expect(box.y + box.height).toBeLessThan(844);
		}

		await expect(
			page.getByText("データ基盤と CI を書くソフトウェアエンジニア"),
		).toBeVisible();
	});

	test("keeps the intro readable with reduced motion", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");

		await expect(
			page.getByRole("heading", { level: 1, name: "Takumi Abe" }),
		).toBeVisible();
		await expect(
			page.getByText("データ基盤と CI を書くソフトウェアエンジニア"),
		).toBeVisible();
		await expect(
			page.getByRole("navigation", { name: "主なページ" }),
		).toBeVisible();
	});
});
