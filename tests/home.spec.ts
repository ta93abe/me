import { expect, type Page, test } from "@playwright/test";

const HOME_CTA_NAMES = ["Works", "About", "Blog", "Contact"] as const;

async function expectHeroCtasReachable(page: Page) {
	const clip = await page.evaluate(() => {
		const hero = document.querySelector(".hero");
		const main = document.getElementById("main-content");
		if (!(hero instanceof HTMLElement) || !main) {
			return { ok: false, reason: "missing" };
		}
		const overflowY = getComputedStyle(hero).overflowY;
		if (
			(overflowY === "hidden" || overflowY === "clip") &&
			hero.scrollHeight > hero.clientHeight + 1
		) {
			return { ok: false, reason: "hero-clips-content" };
		}
		if (
			hero.scrollHeight > main.clientHeight + 1 &&
			main.scrollHeight <= main.clientHeight + 1
		) {
			return { ok: false, reason: "main-cannot-scroll" };
		}
		return { ok: true, reason: "" };
	});
	expect(clip).toEqual({ ok: true, reason: "" });

	for (const name of HOME_CTA_NAMES) {
		const state = await page.evaluate((label) => {
			const main = document.getElementById("main-content");
			const footer = document.querySelector("footer");
			const hero = document.querySelector(".hero");
			const navEl = document.querySelector('nav[aria-label="主なページ"]');
			const target = [...(navEl?.querySelectorAll("a") ?? [])].find(
				(anchor) => anchor.textContent?.trim() === label,
			);

			if (
				!main ||
				!footer ||
				!(hero instanceof HTMLElement) ||
				!(target instanceof HTMLElement)
			) {
				return { ok: false, reason: "missing" };
			}

			const mainRect = () => main.getBoundingClientRect();
			const footerTop = () => footer.getBoundingClientRect().top;
			const visibleBottom = () => Math.min(mainRect().bottom, footerTop()) - 4;

			let rect = target.getBoundingClientRect();
			if (rect.bottom > visibleBottom()) {
				main.scrollTop += rect.bottom - visibleBottom();
			}
			rect = target.getBoundingClientRect();
			if (rect.top < mainRect().top) {
				main.scrollTop -= mainRect().top - rect.top;
			}

			rect = target.getBoundingClientRect();
			const heroRect = hero.getBoundingClientRect();
			const mainBox = mainRect();
			const bandBottom = visibleBottom();

			if (rect.width === 0 || rect.height === 0) {
				return { ok: false, reason: "zero-size" };
			}
			if (
				rect.bottom > heroRect.bottom + 1.5 ||
				rect.top < heroRect.top - 1.5
			) {
				return { ok: false, reason: "clipped-by-hero" };
			}
			if (rect.bottom <= mainBox.top + 1 || rect.top >= bandBottom) {
				return { ok: false, reason: "outside-main" };
			}
			if (rect.bottom > footerTop() + 1.5) {
				return { ok: false, reason: "under-footer" };
			}
			return { ok: true, reason: "" };
		}, name);

		expect(state, name).toEqual({ ok: true, reason: "" });
	}
}

test.describe("Home", () => {
	test("shows the name and CTAs without a poster or tagline", async ({
		page,
	}) => {
		await page.goto("/");

		await expect(page).toHaveTitle(/Takumi Abe/);
		await expect(
			page.getByRole("heading", { level: 1, name: "Takumi Abe" }),
		).toBeVisible();

		const ctas = page.getByRole("navigation", { name: "主なページ" });
		await expect(ctas.getByRole("link", { name: "Works" })).toHaveAttribute(
			"href",
			"/works",
		);
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
		await expect(page.getByRole("link", { name: "Atelier" })).toHaveCount(0);
		await expect(page.getByRole("link", { name: "Bookshelf" })).toHaveCount(0);

		await expect(page.getByRole("heading", { name: "代表作" })).toHaveCount(0);
		await expect(page.getByRole("link", { name: /dbt-jobs/ })).toHaveCount(0);
		await expect(page.locator("[data-hero-canvas]")).toHaveCount(0);
		await expect(
			page
				.locator("main")
				.getByText("データ基盤と CI を書くソフトウェアエンジニア"),
		).toHaveCount(0);
	});

	test("keeps the name at a quiet size", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/");

		const metrics = await page.locator(".hero-name").evaluate((el) => {
			const style = getComputedStyle(el);
			return {
				fontSize: Number.parseFloat(style.fontSize),
				width: el.getBoundingClientRect().width,
			};
		});

		expect(metrics.fontSize).toBeLessThanOrEqual(24);
		expect(metrics.width).toBeLessThan(320);
	});

	test("keeps home CTAs above the fixed footer on a narrow phone", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 320, height: 568 });
		await page.goto("/");

		const footer = page.getByRole("contentinfo");
		const footerBox = await footer.boundingBox();
		expect(footerBox).not.toBeNull();

		const reserved = await page
			.locator(".hero-copy")
			.evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingBottom));
		expect(reserved).toBeGreaterThanOrEqual(
			footerBox?.height ?? Number.POSITIVE_INFINITY,
		);

		await page.locator("#main-content").evaluate((el) => {
			el.scrollTop = el.scrollHeight;
		});
		const contact = page
			.getByRole("navigation", { name: "主なページ" })
			.getByRole("link", { name: "Contact" });
		const ctaBox = await contact.boundingBox();
		expect(ctaBox).not.toBeNull();
		if (ctaBox && footerBox) {
			expect(ctaBox.y + ctaBox.height).toBeLessThanOrEqual(footerBox.y);
		}
	});

	test("keeps all home CTAs reachable on a short landscape viewport", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 667, height: 360 });
		await page.goto("/");
		await expectHeroCtasReachable(page);
	});

	test("keeps all home CTAs reachable at 200% browser zoom", async ({
		page,
	}) => {
		// Chrome のページ拡大はレイアウトビューポートを縮める。
		// 1600x900 を 200% にした幅・高さ。
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

		const box = await name.boundingBox();
		expect(box).not.toBeNull();
		if (box) {
			expect(box.y).toBeGreaterThan(48);
			expect(box.y + box.height).toBeLessThan(844);
		}

		await expect(
			page
				.locator("main")
				.getByText("データ基盤と CI を書くソフトウェアエンジニア"),
		).toHaveCount(0);
	});

	test("keeps the intro readable with reduced motion", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");

		await expect(
			page.getByRole("heading", { level: 1, name: "Takumi Abe" }),
		).toBeVisible();
		await expect(
			page.getByRole("navigation", { name: "主なページ" }),
		).toBeVisible();
		await expect(
			page
				.locator("main")
				.getByText("データ基盤と CI を書くソフトウェアエンジニア"),
		).toHaveCount(0);
	});

	test("about, contact, and works pages return 200", async ({
		page,
		request,
	}) => {
		for (const path of ["/about", "/contact", "/works"] as const) {
			const res = await request.get(path);
			expect(res.status(), path).toBe(200);
		}

		await page.goto("/");
		await page
			.getByRole("navigation", { name: "主なページ" })
			.getByRole("link", { name: "About" })
			.click();
		await expect(page).toHaveURL(/\/about\/?$/);
		await expect(
			page.getByRole("heading", { level: 1, name: "About" }),
		).toBeVisible();

		await page.goto("/");
		await page
			.getByRole("navigation", { name: "主なページ" })
			.getByRole("link", { name: "Contact" })
			.click();
		await expect(page).toHaveURL(/\/contact\/?$/);
		await expect(
			page.getByRole("heading", { level: 1, name: "Contact" }),
		).toBeVisible();

		await page.goto("/");
		await page
			.getByRole("navigation", { name: "主なページ" })
			.getByRole("link", { name: "Works" })
			.click();
		await expect(page).toHaveURL(/\/works\/?$/);
		await expect(
			page.getByRole("heading", { level: 1, name: "Works" }),
		).toBeVisible();
	});
});
