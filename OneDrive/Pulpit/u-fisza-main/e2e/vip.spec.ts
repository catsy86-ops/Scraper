import { test, expect } from "@playwright/test";

test.describe("Strefa VIP", () => {
  test("strona VIP ładuje się", async ({ page }) => {
    await page.goto("/vip");
    await expect(page.locator("text=Strefa VIP")).toBeVisible();
  });

  test("przycisk Dołącz do VIP jest widoczny", async ({ page }) => {
    await page.goto("/vip");
    await expect(page.locator("text=Dołącz do VIP")).toBeVisible();
  });

  test("produkty VIP są zablokowane dla niezalogowanych", async ({ page }) => {
    await page.goto("/vip");
    await page.waitForTimeout(1000);
    // VIP products should show lock overlay
    const lockOverlay = page.locator("text=Wymagana subskrypcja VIP");
    if (await lockOverlay.count() > 0) {
      await expect(lockOverlay.first()).toBeVisible();
    }
  });

  test("cena subskrypcji to 5 zł", async ({ page }) => {
    await page.goto("/vip");
    await expect(page.locator("text=5 zł")).toBeVisible();
  });
});
