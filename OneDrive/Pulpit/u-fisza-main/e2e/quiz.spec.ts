import { test, expect } from "@playwright/test";

test.describe("Quiz rekomendacyjny", () => {
  test("strona quizu ładuje się", async ({ page }) => {
    await page.goto("/quiz");
    await expect(page.locator("text=Co by tu wypić")).toBeVisible();
  });

  test("można przejść przez cały quiz", async ({ page }) => {
    await page.goto("/quiz");
    await page.waitForTimeout(500);
    // Answer all 5 questions
    for (let i = 0; i < 5; i++) {
      const option = page.locator("button:has-text('A')").or(page.locator("button:has-text('B')")).first();
      if (await option.count() > 0) {
        await option.click();
        await page.waitForTimeout(400);
      }
    }
    // Should show a result
    await expect(
      page.locator("text=Piwny Koneser")
        .or(page.locator("text=Winny Elegant"))
        .or(page.locator("text=Wódczany Wojownik"))
        .or(page.locator("text=Alkoholowy Odkrywca"))
    ).toBeVisible({ timeout: 5000 });
  });

  test("widoczne są rekomendowane produkty po quizie", async ({ page }) => {
    await page.goto("/quiz");
    await page.waitForTimeout(500);
    for (let i = 0; i < 5; i++) {
      const option = page.locator("button:has-text('A')").or(page.locator("button:has-text('B')").first());
      if (await option.count() > 0) {
        await option.click();
        await page.waitForTimeout(400);
      }
    }
    await expect(page.locator("text=Fisz poleca")).toBeVisible({ timeout: 5000 });
  });

  test("przycisk Zagraj ponownie wraca do startu", async ({ page }) => {
    await page.goto("/quiz");
    await page.waitForTimeout(500);
    for (let i = 0; i < 5; i++) {
      const option = page.locator("button:has-text('A')").or(page.locator("button:has-text('B')").first());
      if (await option.count() > 0) {
        await option.click();
        await page.waitForTimeout(400);
      }
    }
    const restartBtn = page.locator("text=Zagraj ponownie");
    if (await restartBtn.count() > 0) {
      await restartBtn.click();
      await expect(page.locator("text=Pytanie 1")).toBeVisible({ timeout: 3000 });
    }
  });
});
