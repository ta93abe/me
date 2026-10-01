import { expect, test } from "@playwright/test";

test.describe("Slides", () => {
	test("lists decks on the same origin and opens a player", async ({
		page,
	}) => {
		await page.goto("/slides");
		await expect(
			page.getByRole("heading", { name: "Slides", level: 1 }),
		).toBeVisible();

		const snowflakeGroup = page.getByRole("region", {
			name: "Snowflake 運用シリーズ",
		});
		await expect(snowflakeGroup).toBeVisible();
		await expect(
			snowflakeGroup.getByRole("heading", {
				name: "SnowflakeとClickOpsの限界",
				level: 3,
			}),
		).toBeVisible();
		await expect(
			snowflakeGroup.getByRole("heading", {
				name: "Snowflake と dbt",
				level: 3,
			}),
		).toBeVisible();
		await expect(
			snowflakeGroup.getByRole("heading", {
				name: "Snowflake で何が起きているのかを把握する",
				level: 3,
			}),
		).toBeVisible();
		const snowflakeTitles = snowflakeGroup.locator(
			"h3.slide-deck-card-title a",
		);
		await expect(snowflakeTitles).toHaveCount(3);
		await expect(snowflakeTitles.nth(0)).toHaveAttribute(
			"href",
			"/slides/snowflake-clickops-limits/",
		);
		await expect(snowflakeTitles.nth(1)).toHaveAttribute(
			"href",
			"/slides/snowflake-dbt/",
		);
		await expect(snowflakeTitles.nth(2)).toHaveAttribute(
			"href",
			"/slides/snowflake-observability/",
		);

		const showcaseTitle = page.getByRole("link", {
			name: "デザインシステム ショーケース",
			exact: true,
		});
		await expect(showcaseTitle).toHaveAttribute("href", "/slides/showcase/");
		await expect(
			page.getByRole("navigation", {
				name: "デザインシステム ショーケース へのリンク",
			}),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: "Slides", exact: true }).first(),
		).toHaveAttribute("href", "/slides/showcase/");
		await expect(
			page.getByRole("link", { name: "PDF" }).first(),
		).toHaveAttribute("href", "/slides/showcase.pdf");
		await expect(page.getByRole("link", { name: "Talk" })).toHaveAttribute(
			"href",
			"/talks/#talk-frosty-friday-live-challenge-vol56",
		);
		await showcaseTitle.click();
		await expect(page).toHaveURL(/\/slides\/showcase\/?#/);

		await expect(page.locator(".deck")).toBeVisible();
		await expect(page.locator(".slide.is-active")).toHaveAttribute(
			"data-type",
			"cover",
		);
		await expect(page.getByRole("link", { name: "PDF" })).toHaveAttribute(
			"href",
			"/slides/showcase.pdf",
		);

		await page.goBack();
		await expect(page).toHaveURL(/\/slides\/?$/);
	});

	test("opens slide 2 from the hash", async ({ page }) => {
		await page.goto("/slides/showcase/#2");
		await expect(page.locator(".slide.is-active")).toHaveAttribute(
			"data-index",
			"2",
		);
		await expect(page.locator(".slide.is-active")).toHaveAttribute(
			"data-type",
			"section",
		);
	});

	test("listing exposes Open Graph, Twitter, and CollectionPage JSON-LD", async ({
		page,
	}) => {
		await page.goto("/slides");
		await expect(page).toHaveTitle("Slides | Takumi Abe");
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			"content",
			"https://ta93abe.com/og/slides.png",
		);
		await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
			"content",
			"summary_large_image",
		);
		const jsonLd = await page
			.locator('script[type="application/ld+json"]')
			.allTextContents();
		expect(jsonLd.some((text) => text.includes("CollectionPage"))).toBe(true);
		expect(jsonLd.some((text) => text.includes("/slides/showcase/"))).toBe(
			true,
		);
	});

	test("player exposes deck Open Graph, Twitter, and JSON-LD", async ({
		page,
	}) => {
		await page.goto("/slides/showcase/");
		await expect(page).toHaveTitle(
			"デザインシステム ショーケース | Slides | Takumi Abe",
		);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			"href",
			"https://ta93abe.com/slides/showcase/",
		);
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			"content",
			"https://ta93abe.com/og/slides/showcase.png",
		);
		await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
			"content",
			"summary_large_image",
		);
		await expect(page.locator('link[rel="alternate"]')).toHaveAttribute(
			"href",
			"/slides/showcase.pdf",
		);
		const jsonLd = await page
			.locator('script[type="application/ld+json"]')
			.textContent();
		expect(jsonLd).toContain("PresentationDigitalDocument");
		expect(jsonLd).toContain("/slides/showcase.pdf");
	});

	test("print page shows every slide and skips the player", async ({
		page,
	}) => {
		await page.goto("/slides/showcase/print/");
		await expect(page.locator("html")).toHaveAttribute("data-print-ready");
		await expect(page.locator(".slide")).toHaveCount(13);
		await expect(page.locator("html")).toHaveClass(/is-print/);
		await expect(page.locator(".player-ui")).toHaveCount(0);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			"noindex, nofollow",
		);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			"href",
			"https://ta93abe.com/slides/showcase/",
		);
		await expect(
			page.locator('script[type="application/ld+json"]'),
		).toHaveCount(0);
	});

	test("hides deck chrome after idle and restores on key", async ({ page }) => {
		test.setTimeout(15_000);
		await page.goto("/slides/showcase/");
		const chrome = page.locator(".player-ui");
		await expect(chrome).toBeVisible();
		await expect(chrome).not.toHaveClass(/is-chrome-idle/);

		await page.waitForTimeout(3_200);
		await expect(chrome).toHaveClass(/is-chrome-idle/);

		await page.keyboard.press("ArrowRight");
		await expect(chrome).not.toHaveClass(/is-chrome-idle/);
	});

	test("advances click fragments before the next slide", async ({ page }) => {
		await page.goto("/slides/showcase/");
		const index = await page
			.locator(".slide[data-clicks]:not([data-clicks='0'])")
			.first()
			.getAttribute("data-index");
		expect(index).toBeTruthy();
		await page.goto(`/slides/showcase/#${index}`);
		const fragment = page.locator(".slide.is-active .fragment").first();
		await expect(fragment).toHaveCount(1);
		await expect(fragment).not.toHaveClass(/is-visible/);
		await page.keyboard.press("ArrowRight");
		await expect(fragment).toHaveClass(/is-visible/);
		await expect(fragment).toContainText("矢印のあとに出ること");
		await expect(page).toHaveURL(new RegExp(`#${index}\\.1`));
	});

	test("opens presenter notes with p", async ({ page }) => {
		await page.goto("/slides/showcase/#5");
		await page.keyboard.press("p");
		const presenter = page.locator("[data-presenter]");
		await expect(presenter).toBeVisible();
		await expect(presenter.locator("[data-presenter-notes]")).toContainText(
			"引用は短く止めて",
		);
		await expect(
			presenter.locator("[data-presenter-next-title]"),
		).toContainText("フェンス");
		await expect(presenter.locator("[data-presenter-timer]")).toContainText(
			/^\d{2}:\d{2}$/,
		);
		await expect(page.locator("html")).toHaveClass(/is-presenter/);
		await expect(page.locator(".player-ui .counter")).toBeHidden();
	});

	test("unknown slug is 404", async ({ page }) => {
		const response = await page.goto("/slides/no-such-deck/");
		expect(response?.status()).toBe(404);
	});

	test("narrow viewport keeps deck within bounds and stacks split slides", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 320, height: 568 });
		await page.goto("/slides/showcase/#4");

		const deck = page.locator(".deck");
		await expect(deck).toBeVisible();
		const deckBox = await deck.boundingBox();
		expect(deckBox).not.toBeNull();
		if (deckBox) {
			expect(deckBox.width).toBeLessThanOrEqual(320.5);
			expect(deckBox.x).toBeGreaterThanOrEqual(-0.5);
			expect(deckBox.x + deckBox.width).toBeLessThanOrEqual(320.5);
		}

		const splitBody = page.locator(
			'.slide.is-active[data-type="split"] .slide-body',
		);
		await expect(splitBody).toBeVisible();
		const columns = await splitBody.evaluate((el) => {
			return window.getComputedStyle(el).gridTemplateColumns;
		});
		expect(columns).toMatch(/^[\d.]+px$/);

		const pdf = page.getByRole("link", { name: "PDF" });
		const counter = page.locator(".counter");
		const pdfBox = await pdf.boundingBox();
		const counterBox = await counter.boundingBox();
		expect(pdfBox).not.toBeNull();
		expect(counterBox).not.toBeNull();
		if (pdfBox && counterBox) {
			expect(pdfBox.x).toBeGreaterThanOrEqual(0);
			expect(counterBox.x + counterBox.width).toBeLessThanOrEqual(320.5);
		}
	});

	test("short horizontal tap does not change slide on touch", async ({
		browser,
	}) => {
		const context = await browser.newContext({
			viewport: { width: 390, height: 844 },
			hasTouch: true,
		});
		const page = await context.newPage();
		await page.goto("/slides/showcase/#4");

		const deck = page.locator(".deck");
		const box = await deck.boundingBox();
		expect(box).not.toBeNull();
		if (!box) {
			return;
		}

		const startX = box.x + box.width * 0.5;
		const startY = box.y + box.height * 0.55;

		const swipeDeck = async (endX: number) => {
			await page.evaluate(
				({ endX, startX, startY }) => {
					const deck = document.querySelector(".deck");
					if (!(deck instanceof HTMLElement)) {
						throw new Error("deck missing");
					}
					const touch = (x: number, y: number) =>
						new Touch({
							identifier: 1,
							target: deck,
							clientX: x,
							clientY: y,
						});
					deck.dispatchEvent(
						new TouchEvent("touchstart", {
							bubbles: true,
							changedTouches: [touch(startX, startY)],
						}),
					);
					deck.dispatchEvent(
						new TouchEvent("touchend", {
							bubbles: true,
							changedTouches: [touch(endX, startY)],
						}),
					);
				},
				{ endX, startX, startY },
			);
		};

		await swipeDeck(startX + 4);
		await expect(page).toHaveURL(/#4$/);

		await swipeDeck(startX - 120);
		await expect(page).toHaveURL(/#5$/);
		await context.close();
	});
});
