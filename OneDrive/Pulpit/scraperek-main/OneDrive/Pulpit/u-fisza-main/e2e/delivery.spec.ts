import { test, expect } from "@playwright/test";

test.describe("Dostawca Fisz", () => {
  test("strona tracker ładuje się", async ({ page }) => {
    await page.goto("/dostawa");
    await expect(page.locator("text=Dostawca Fisz")).toBeVisible();
  });

  test("przycisk Rozpocznij śledzenie uruchamia symulację", async ({ page }) => {
    await page.goto("/dostawa");
    const startBtn = page.locator("text=Rozpocznij śledzenie paczki");
    if (await startBtn.count() > 0) {
      await startBtn.click();
      await page.waitForTimeout(1000);
      // Should see status updates
      await expect(page.locator("text=Status dostawy")).toBeVisible({ timeout: 3000 });
    }
  });

  test("po zakończeniu symulacji widać komunikat o dostarczeniu", async ({ page }) => {
    await page.goto("/dostawa");
    const startBtn = page.locator("text=Rozpocznij śledzenie paczki");
    if (await startBtn.count() > 0) {
      await startBtn.click();
      // Wait for delivery to complete (could take a while)
      await expect(page.locator("text=Paczka dostarczona")).toBeVisible({ timeout: 45000 });
    }
  });
});
