import { expect, test } from "@playwright/test";

function isCrawlableGadgetSrc(src: string | null, slug: string): boolean {
	if (!src) {
		return false;
	}
	if (src.startsWith("data:")) {
		return false;
	}
	if (src.startsWith("/gadgets/") || src.startsWith("/things/")) {
		return false;
	}
	return (
		src === `/media/gadgets/${slug}.webp` ||
		src.endsWith(`/media/gadgets/${slug}.webp`)
	);
}

function jsonLdBlocks(html: string): unknown[] {
	return [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(
		([, json]) => JSON.parse(json ?? "{}") as unknown,
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
		expect(isCrawlableGadgetSrc(src, "mac-studio")).toBe(true);
		expect(await thumb.getAttribute("alt")).toBe("Mac Studio M1 Max");

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
		expect(
			isCrawlableGadgetSrc(await thumb.getAttribute("src"), "mac-studio"),
		).toBe(true);
		expect(await thumb.getAttribute("alt")).toBe("Mac Studio M1 Max");
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

	test("listing ItemList URLs match trailing-slash canonicals", async ({
		request,
	}) => {
		const html = await (await request.get("/gadgets/")).text();
		const itemList = jsonLdBlocks(html).find(
			(block) =>
				typeof block === "object" &&
				block !== null &&
				"@type" in block &&
				block["@type"] === "ItemList",
		) as
			| {
					itemListElement: Array<{ url: string }>;
			  }
			| undefined;

		expect(itemList).toBeDefined();
		const urls = itemList?.itemListElement.map((item) => item.url) ?? [];
		expect(urls).toEqual(
			expect.arrayContaining([
				"https://ta93abe.com/gadgets/oura-ring-5/",
				"https://ta93abe.com/gadgets/hhkb-type-s/",
				"https://ta93abe.com/gadgets/mac-studio/",
			]),
		);
		expect(urls.every((url) => url.endsWith("/"))).toBe(true);
		expect(urls.some((url) => url.endsWith("/gadgets/oura-ring-5"))).toBe(
			false,
		);
	});

	test("detail pages expose Product JSON-LD, crawlable images, and product OG", async ({
		request,
	}) => {
		const cases = [
			{
				path: "/gadgets/oura-ring-5/",
				name: "Oura Ring 5",
				note: "睡眠と回復を見る。朝いちばんに数字を見る。",
				brand: "Oura",
				image: "https://ta93abe.com/media/gadgets/oura-ring-5.webp",
			},
			{
				path: "/gadgets/hhkb-type-s/",
				name: "HHKB Type-S",
				note: "いちばん長く触っているもの。静かな打感が仕事のリズムになる。",
				brand: "HHKB",
				image: "https://ta93abe.com/media/gadgets/hhkb-type-s.webp",
			},
			{
				path: "/gadgets/mac-studio/",
				name: "Mac Studio M1 Max",
				note: "Nix の土台。据え置きのまま。CLI は全部入れ直せる。",
				brand: "Apple",
				image: "https://ta93abe.com/media/gadgets/mac-studio.webp",
			},
		] as const;

		for (const item of cases) {
			const html = await (await request.get(item.path)).text();
			const blocks = jsonLdBlocks(html);
			const types = blocks.flatMap((block) =>
				typeof block === "object" && block !== null && "@type" in block
					? [String(block["@type"])]
					: [],
			);
			expect(types, item.path).toEqual(
				expect.arrayContaining(["Product", "BreadcrumbList"]),
			);

			expect(html, item.path).toContain(`"name":"${item.name}"`);
			expect(html, item.path).toContain(`"description":"${item.note}"`);
			expect(html, item.path).toContain(`"image":"${item.image}"`);
			expect(html, item.path).toContain(
				`"url":"https://ta93abe.com${item.path}"`,
			);
			expect(html, item.path).toContain(`"name":"${item.brand}"`);
			expect(html, item.path).toContain('"@type":"BreadcrumbList"');
			expect(html, item.path).toContain("https://ta93abe.com/gadgets/");

			expect(html, item.path).toContain(`src="${item.image.replace("https://ta93abe.com", "")}"`);
			expect(html, item.path).toContain(`alt="${item.name}"`);
			expect(html, item.path).not.toContain("data:image/webp");

			expect(html, item.path).toContain('property="og:type" content="product"');
			expect(html, item.path).toContain(
				`property="og:image" content="${item.image}"`,
			);
			expect(html, item.path).not.toContain("/og/default.png");
		}
	});
});
