import { expect, type Page, test } from "@playwright/test";

const HOME_CTA_NAMES = ["Works", "About", "Blog", "Contact"] as const;

async function expectHeroCtasReachable(page: Page) {
	const nav = page.getByRole("navigation", { name: "主なページ" });

	for (const name of HOME_CTA_NAMES) {
		const link = nav.getByRole("link", { name });
		await link.evaluate((el) => {
			el.scrollIntoView({ block: "center", inline: "nearest" });
		});

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

			const er = target.getBoundingClientRect();
			const hr = hero.getBoundingClientRect();
			const mr = main.getBoundingClientRect();
			const fr = footer.getBoundingClientRect();

			if (er.width === 0 || er.height === 0) {
				return { ok: false, reason: "zero-size" };
			}
			if (er.bottom > hr.bottom + 1.5 || er.top < hr.top - 1.5) {
				return { ok: false, reason: "clipped-by-hero" };
			}
			if (er.bottom <= mr.top + 1 || er.top >= mr.bottom - 1) {
				return { ok: false, reason: "outside-main" };
			}
			if (er.bottom > fr.top + 1.5) {
				return { ok: false, reason: "under-footer" };
			}
			return { ok: true, reason: "" };
		}, name);

		expect(state, name).toEqual({ ok: true, reason: "" });
	}
}

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
	});

	test("sets the name as a full-width poster on desktop", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/");

		const metrics = await page.locator(".hero-name").evaluate((el) => {
			const given = el.querySelector(".hero-name-given");
			const family = el.querySelector(".hero-name-family");
			if (!(given instanceof HTMLElement) || !(family instanceof HTMLElement)) {
				return { textWidth: 0, viewportWidth: window.innerWidth };
			}
			return {
				textWidth:
					given.getBoundingClientRect().width +
					family.getBoundingClientRect().width,
				viewportWidth: window.innerWidth,
			};
		});

		expect(metrics.textWidth).toBeGreaterThan(metrics.viewportWidth * 0.72);
	});

	test("stacks the name on two lines on a phone", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/");

		const stacked = await page.locator(".hero-name").evaluate((el) => {
			const given = el.querySelector(".hero-name-given");
			const family = el.querySelector(".hero-name-family");
			if (!(given instanceof HTMLElement) || !(family instanceof HTMLElement)) {
				return false;
			}
			const givenBox = given.getBoundingClientRect();
			const familyBox = family.getBoundingClientRect();
			return familyBox.top >= givenBox.bottom - 1;
		});

		expect(stacked).toBe(true);
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
		browserName,
	}) => {
		test.skip(browserName !== "chromium", "CSS zoom is Chromium-only");
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto("/");
		await page.evaluate(() => {
			document.documentElement.style.zoom = "2";
		});
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
