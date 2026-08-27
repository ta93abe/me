import { expect, test } from "@playwright/test";

const primary = [
	{ href: "/about", text: "About" },
	{ href: "/gallery", text: "Gallery" },
	{ href: "/blog", text: "Blog" },
	{ href: "/contact", text: "Contact" },
] as const;

const secondary = [
	{ href: "/atelier", text: "Atelier" },
	{ href: "/tools", text: "Tools" },
	{ href: "/slides", text: "Slides" },
	{ href: "/links", text: "Links" },
] as const;

test.describe("Primary navigation", () => {
	test("desktop header shows About / Gallery / Blog / Contact only", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/blog");

		const headerNav = page.getByRole("navigation", {
			name: "メインナビゲーション",
		});
		const headerLinks = headerNav.getByRole("list").getByRole("link");

		await expect(headerLinks).toHaveCount(primary.length);

		for (const link of primary) {
			await expect(
				headerNav.getByRole("link", { name: link.text, exact: true }),
			).toHaveAttribute("href", link.href);
		}

		for (const link of secondary) {
			await expect(
				headerNav.getByRole("link", { name: link.text, exact: true }),
			).toHaveCount(0);
		}
	});

	test("footer keeps secondary destinations", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/blog");

		const footerNav = page.getByRole("navigation", {
			name: "二次ナビゲーション",
		});

		for (const link of secondary) {
			await expect(
				footerNav.getByRole("link", { name: link.text, exact: true }),
			).toHaveAttribute("href", link.href);
		}

		for (const link of primary) {
			await expect(
				footerNav.getByRole("link", { name: link.text, exact: true }),
			).toHaveCount(0);
		}
	});

	test("header About and Contact links open real pages", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/blog");

		const headerNav = page.getByRole("navigation", {
			name: "メインナビゲーション",
		});

		await headerNav.getByRole("link", { name: "About", exact: true }).click();
		await expect(page).toHaveURL(/\/about\/?$/);
		await expect(page.getByRole("heading", { level: 1 })).toContainText(
			"Takumi Abe",
		);

		await page
			.getByRole("navigation", { name: "メインナビゲーション" })
			.getByRole("link", { name: "Contact", exact: true })
			.click();
		await expect(page).toHaveURL(/\/contact\/?$/);
		await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact");
	});

	test("mobile menu lists primary links first, then secondary", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/blog");

		await page.getByRole("button", { name: "メニューを開く" }).click();

		const mobileNav = page.getByRole("navigation", {
			name: "モバイルナビゲーション",
		});
		const hrefs = await mobileNav.getByRole("link").evaluateAll((anchors) =>
			anchors.map((anchor) => anchor.getAttribute("href")),
		);

		expect(hrefs).toEqual([
			...primary.map((link) => link.href),
			...secondary.map((link) => link.href),
		]);
	});
});
