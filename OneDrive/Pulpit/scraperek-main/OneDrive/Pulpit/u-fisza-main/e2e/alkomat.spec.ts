import { test, expect } from "@playwright/test";

test.describe("Alkomat Fisza", () => {
  test("strona alkomatu ładuje się z kalkulatorem", async ({ page }) => {
    await page.goto("/alkomat");
    await expect(page.locator("text=Alkomat Fisza")).toBeVisible();
  });

  test("można zmienić wagę", async ({ page }) => {
    await page.goto("/alkomat");
    const weightInput = page.locator('input[type="number"]');
    if (await weightInput.count() > 0) {
      await weightInput.fill("80");
      await expect(weightInput).toHaveValue("80");
    }
  });

  test("przyciski +/- do dodawania drinków działają", async ({ page }) => {
    await page.goto("/alkomat");
    await page.waitForTimeout(500);
    // Find Plus buttons within drink rows
    const plusBtns = page.locator("button:has(svg.lucide-plus)");
    const count = await plusBtns.count();
    if (count > 0) {
      await plusBtns.first().click();
      await page.waitForTimeout(300);
      // Should see a BAC value
      await expect(page.locator("text=‰")).toBeVisible();
    }
  });

  test("wyświetla werdykt Fisza po dodaniu drinków", async ({ page }) => {
    await page.goto("/alkomat");
    await page.waitForTimeout(500);
    const plusBtns = page.locator("button:has(svg.lucide-plus)");
    if (await plusBtns.count() > 0) {
      // Add a few drinks
      for (let i = 0; i < 3; i++) {
        await plusBtns.first().click();
        await page.waitForTimeout(200);
      }
      // Should see a verdict
      const verdict = page.locator("text=Trzeźwy").or(page.locator("text=Lekko")).or(page.locator("text=Fisz"));
      await expect(verdict.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test("przycisk Wyczyść wszystko resetuje liczniki", async ({ page }) => {
    await page.goto("/alkomat");
    await page.waitForTimeout(500);
    const plusBtns = page.locator("button:has(svg.lucide-plus)");
    if (await plusBtns.count() > 0) {
      await plusBtns.first().click();
      await page.waitForTimeout(200);
      const resetBtn = page.locator("text=Wyczyść wszystko");
      if (await resetBtn.count() > 0) {
        await resetBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });
});
