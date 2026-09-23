import { expect, type Page, test } from "@playwright/test";

const HOME_CTA_NAMES = ["Works", "About", "Blog", "Contact"] as const;
const HOME_TAGLINE =
	"データ基盤と CI を書くソフトウェアエンジニア。絵と音楽も置く。";

async function expectHeroCtasReachable(page: Page) {
	const nav = page
		.locator("section#hero")
		.getByRole("navigation", { name: "主なページ" });

	for (const name of HOME_CTA_NAMES) {
		const link = nav.getByRole("link", { name });
		await link.scrollIntoViewIfNeeded();
		await expect(link).toBeVisible();
		const box = await link.boundingBox();
		expect(box).not.toBeNull();
		if (box) {
			expect(box.width).toBeGreaterThan(0);
			expect(box.height).toBeGreaterThan(0);
		}
	}
}

test.describe("Home", () => {
	test(
		"shows the scroll-story hero with name, tagline, and CTAs",
		{
			tag: "@smoke",
		},
		async ({ page }) => {
			await page.goto("/");

			await expect(page).toHaveTitle(/Takumi Abe/);
			await expect(page.locator("body")).toHaveAttribute("data-theme", "home");
			await expect(
				page.getByRole("heading", { level: 1, name: "Takumi Abe" }),
			).toBeVisible();
			await expect(page.locator(".home-hero-tagline")).toHaveText(HOME_TAGLINE);

			const ctas = page
				.locator("section#hero")
				.getByRole("navigation", { name: "主なページ" });
			await expect(ctas.getByRole("link", { name: "Works" })).toHaveAttribute(
				"href",
				"/works/",
			);
			await expect(ctas.getByRole("link", { name: "About" })).toHaveAttribute(
				"href",
				"/about/",
			);
			await expect(ctas.getByRole("link", { name: "Blog" })).toHaveAttribute(
				"href",
				"/blog/",
			);
			await expect(ctas.getByRole("link", { name: "Contact" })).toHaveAttribute(
				"href",
				"/contact/",
			);
			await expect(ctas.getByRole("link", { name: "Gallery" })).toHaveCount(0);
			await expect(page.getByRole("link", { name: "Atelier" })).toHaveCount(0);
			await expect(page.getByRole("link", { name: "Bookshelf" })).toHaveCount(
				0,
			);

			await expect(page.getByRole("heading", { name: "代表作" })).toHaveCount(
				0,
			);
			await expect(page.getByRole("link", { name: /dbt-jobs/ })).toHaveCount(0);
			await expect(page.locator("[data-hero-canvas]")).toHaveCount(0);
			await expect(page.locator(".home-stage")).toBeAttached();
			await expect(
				page.getByRole("heading", { name: "入口として" }),
			).toBeVisible();
		},
	);

	test("uses a large display name without a lock-viewport poster", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/");

		const metrics = await page.locator(".home-hero-name").evaluate((el) => {
			const style = getComputedStyle(el);
			return {
				fontSize: Number.parseFloat(style.fontSize),
				width: el.getBoundingClientRect().width,
			};
		});

		expect(metrics.fontSize).toBeGreaterThanOrEqual(32);
		expect(metrics.width).toBeLessThan(640);
		await expect(page.locator("body")).not.toHaveClass(/lock-viewport/);
	});

	test("keeps the closed mobile menu out of layout on a phone", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/");

		const dialog = page.locator("dialog[aria-label='メニュー']");
		await expect(dialog).toBeAttached();
		expect(await dialog.boundingBox()).toBeNull();
	});

	test("keeps home CTAs reachable on a short landscape viewport", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 667, height: 360 });
		await page.goto("/");
		await expectHeroCtasReachable(page);
	});

	test("keeps all home CTAs reachable at 200% browser zoom", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 800, height: 450 });
		await page.goto("/");
		await expectHeroCtasReachable(page);
	});

	test("keeps the intro readable on a mobile viewport", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/");

		const name = page.getByRole("heading", {
			level: 1,
			name: "Takumi Abe",
		});
		await expect(name).toBeVisible();
		await expect(page.locator(".home-hero-tagline")).toBeVisible();

		const box = await name.boundingBox();
		expect(box).not.toBeNull();
		if (box) {
			expect(box.y).toBeGreaterThan(48);
			expect(box.y + box.height).toBeLessThan(844);
		}
	});

	test("keeps the intro readable with reduced motion", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");

		await expect(
			page.getByRole("heading", { level: 1, name: "Takumi Abe" }),
		).toBeVisible();
		await expect(page.locator(".home-hero-tagline")).toBeVisible();
		await expect(
			page
				.locator("section#hero")
				.getByRole("navigation", { name: "主なページ" }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "入口として" }),
		).toBeVisible();
	});

	test(
		"about, contact, and works pages return 200",
		{
			tag: "@smoke",
		},
		async ({ page, request }) => {
			for (const path of ["/about", "/contact", "/works"] as const) {
				const res = await request.get(path);
				expect(res.status(), path).toBe(200);
			}

			await page.goto("/");
			await page
				.locator("section#hero")
				.getByRole("navigation", { name: "主なページ" })
				.getByRole("link", { name: "About" })
				.click();
			await expect(page).toHaveURL(/\/about\/?$/);
			await expect(
				page.getByRole("heading", { level: 1, name: "About" }),
			).toBeVisible();

			await page.goto("/");
			await page
				.locator("section#hero")
				.getByRole("navigation", { name: "主なページ" })
				.getByRole("link", { name: "Contact" })
				.click();
			await expect(page).toHaveURL(/\/contact\/?$/);
			await expect(
				page.getByRole("heading", { level: 1, name: "Contact" }),
			).toBeVisible();

			await page.goto("/");
			await page
				.locator("section#hero")
				.getByRole("navigation", { name: "主なページ" })
				.getByRole("link", { name: "Works" })
				.click();
			await expect(page).toHaveURL(/\/works\/?$/);
			await expect(
				page.getByRole("heading", { level: 1, name: "Works" }),
			).toBeVisible();
		},
	);
});
