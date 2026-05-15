import { test, expect } from "@playwright/test";

test.describe("Fisz vs AI", () => {
  test("strona ładuje się z quizem", async ({ page }) => {
    await page.goto("/fisz-vs-ai");
    await expect(page.locator("text=Fisz czy AI")).toBeVisible();
  });

  test("przycisk Rozpocznij quiz startuje grę", async ({ page }) => {
    await page.goto("/fisz-vs-ai");
    await page.locator("text=Rozpocznij quiz").click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=Cytat 1")).toBeVisible({ timeout: 3000 });
  });

  test("można odpowiedzieć na wszystkie pytania", async ({ page }) => {
    await page.goto("/fisz-vs-ai");
    await page.locator("text=Rozpocznij quiz").click();
    await page.waitForTimeout(500);
    // Answer 10 questions
    for (let i = 0; i < 10; i++) {
      const fiszBtn = page.locator("button:has-text('Fisz')").first();
      const aiBtn = page.locator("button:has-text('AI')").first();
      if (await fiszBtn.count() > 0) {
        await fiszBtn.click();
      } else if (await aiBtn.count() > 0) {
        await aiBtn.click();
      }
      await page.waitForTimeout(300);
    }
    // Should see a ranking result
    await expect(page.locator("text=/ \\d+ \\/ 10/")).toBeVisible({ timeout: 5000 });
  });

  test("wynik pokazuje podsumowanie", async ({ page }) => {
    await page.goto("/fisz-vs-ai");
    await page.locator("text=Rozpocznij quiz").click();
    await page.waitForTimeout(500);
    for (let i = 0; i < 10; i++) {
      const fiszBtn = page.locator("button:has-text('Fisz')").first();
      if (await fiszBtn.count() > 0) {
        await fiszBtn.click();
        await page.waitForTimeout(300);
      }
    }
    await expect(page.locator("text=Podsumowanie")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Zagraj ponownie")).toBeVisible({ timeout: 3000 });
  });
});
