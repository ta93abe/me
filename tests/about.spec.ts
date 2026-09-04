import { expect, test } from "@playwright/test";

const recruiterPaths = ["/careers", "/jobs", "/recruit"] as const;

test.describe("About", () => {
	test("returns a readable intro with Person JSON-LD", async ({
		page,
		request,
	}) => {
		const res = await request.get("/about");
		expect(res.status()).toBe(200);
		const html = await res.text();
		expect(html).toContain('"@type":"Person"');
		expect(html).toContain('"jobTitle":"Software Engineer"');
		expect(html).toContain("https://github.com/ta93abe");

		await page.goto("/about");
		await expect(
			page.getByRole("heading", { level: 1, name: "About" }),
		).toBeVisible();
		await expect(
			page.getByText("データ基盤と CI を書くソフトウェアエンジニア"),
		).toBeVisible();
		await expect(page.getByRole("link", { name: /dbt-jobs/ })).toBeVisible();
		await expect(page.getByRole("link", { name: "GitHub" })).toBeVisible();
		await expect(page.getByRole("link", { name: "X" })).toBeVisible();
		await expect(page.getByRole("link", { name: "LinkedIn" })).toBeVisible();
		await expect(page.getByRole("link", { name: "Contact" })).toHaveAttribute(
			"href",
			"/contact",
		);

		const nav = page.getByRole("navigation", { name: "メインナビゲーション" });
		await expect(nav.getByRole("link", { name: "About" })).toHaveAttribute(
			"href",
			"/about",
		);
		await expect(nav.getByRole("link", { name: "Gallery" })).toHaveCount(0);
	});

	test("sends recruiter URLs to About and keeps Contact independent", async ({
		page,
		request,
	}) => {
		for (const path of recruiterPaths) {
			const res = await request.get(path, { maxRedirects: 0 });
			expect(res.status(), path).toBeGreaterThanOrEqual(300);
			expect(res.status(), path).toBeLessThan(400);
			expect(res.headers().location, path).toMatch(/\/about\/?$/);

			await page.goto(path);
			await expect(page, path).toHaveURL(/\/about\/?$/);
			await expect(
				page.getByRole("heading", { level: 1, name: "About" }),
			).toBeVisible();
		}

		const contact = await request.get("/contact", { maxRedirects: 0 });
		expect(contact.status()).toBe(200);
		await page.goto("/contact");
		await expect(page).toHaveURL(/\/contact\/?$/);
		await expect(
			page.getByRole("heading", { level: 1, name: "Contact" }),
		).toBeVisible();
	});
});
