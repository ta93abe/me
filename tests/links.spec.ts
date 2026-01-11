import { expect, test } from "@playwright/test";

test.describe("Links Page", () => {
  test("should have correct title and heading", async ({ page }) => {
    await page.goto("/links");

    await expect(page).toHaveTitle(/Links/);
    await expect(page.locator("h1")).toContainText("Links");
  });

  test("should display SNS links section", async ({ page }) => {
    await page.goto("/links");

    await expect(
      page.locator("h2").filter({ hasText: "SNS・ソーシャルメディア" }),
    ).toBeVisible();
  });

  test("should display content timeline", async ({ page }) => {
    await page.goto("/links");

    await expect(
      page.locator("h2").filter({ hasText: "コンテンツタイムライン" }),
    ).toBeVisible();
  });

  test("should display statistics section", async ({ page }) => {
    await page.goto("/links");

    await expect(
      page.locator("h3").filter({ hasText: "統計情報" }),
    ).toBeVisible();
  });
});
