import { expect, test } from "@playwright/test";

test.describe("Contact Page", () => {
	test("returns 200 with SNS above the form", async ({ page }) => {
		const response = await page.goto("/contact");
		expect(response?.status()).toBe(200);

		await expect(page).toHaveTitle(/Contact/);
		await expect(page.locator("h1")).toHaveText("Contact");

		const sns = page.locator(".contact-sns");
		const formSection = page.locator(".contact-form-section");
		await expect(sns).toBeVisible();
		await expect(formSection).toBeVisible();
		await expect(sns.locator(".sns-links")).toBeVisible();
		await expect(formSection.locator("#contact-form")).toBeVisible();

		const snsBox = await sns.boundingBox();
		const formBox = await formSection.boundingBox();
		expect(snsBox && formBox && snsBox.y < formBox.y).toBe(true);
	});

	test("has name, email, message, and optional subject fields", async ({
		page,
	}) => {
		await page.goto("/contact");

		await expect(page.locator("#contact-name")).toHaveAttribute("required", "");
		await expect(page.locator("#contact-email")).toHaveAttribute("type", "email");
		await expect(page.locator("#contact-message")).toHaveAttribute(
			"required",
			"",
		);
		await expect(page.locator("#contact-subject")).not.toHaveAttribute(
			"required",
			"",
		);
	});

	test("shows Contact in the header navigation", async ({ page }) => {
		await page.goto("/contact");
		await expect(
			page.locator("header nav a[href='/contact']").first(),
		).toBeVisible();
	});

	test("shows success without waiting on delivery when the API accepts the form", async ({
		page,
	}) => {
		await page.route("**/api/contact", async (route) => {
			if (route.request().method() === "POST") {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ ok: true }),
				});
				return;
			}
			await route.continue();
		});

		await page.goto("/contact");
		await page.locator("#contact-name").fill("Abe");
		await page.locator("#contact-email").fill("visitor@example.com");
		await page.locator("#contact-message").fill("Hello from Playwright.");
		await page.locator("#contact-form button[type=submit]").click();

		await expect(page.locator("#contact-status")).toContainText("送信しました");
	});

	test("shows an error when the API rejects the submission", async ({
		page,
	}) => {
		await page.route("**/api/contact", async (route) => {
			if (route.request().method() === "POST") {
				await route.fulfill({
					status: 403,
					contentType: "application/json",
					body: JSON.stringify({
						ok: false,
						error: "turnstile_failed",
						message: "認証に失敗しました。もう一度お試しください。",
					}),
				});
				return;
			}
			await route.continue();
		});

		await page.goto("/contact");
		await page.locator("#contact-name").fill("Abe");
		await page.locator("#contact-email").fill("visitor@example.com");
		await page.locator("#contact-message").fill("Hello from Playwright.");
		await page.locator("#contact-form button[type=submit]").click();

		await expect(page.locator("#contact-status")).toContainText("認証に失敗");
	});
});
