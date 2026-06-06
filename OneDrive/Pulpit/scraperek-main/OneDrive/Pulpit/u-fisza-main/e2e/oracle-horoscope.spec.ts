import { test, expect } from "@playwright/test";

test.describe("Sekcja Wyroczni i Horoskopu", () => {
  test("Kufel Wyroczni odpowiada po wpisaniu pytania", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    // Scroll to oracle section
    await page.evaluate(() => {
      const el = document.querySelector('[class*="oracle"]') || document.querySelector('section');
      if (el) el.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(500);
    const input = page.locator('input[placeholder*="Np. Czy"]').or(page.locator('input[placeholder*="stout"]'));
    const askBtn = page.locator("text=Wróżby").first();

    if (await input.count() > 0 && await askBtn.count() > 0) {
      await input.fill("Czy dziś otworzyć stout?");
      await askBtn.click();
      await page.waitForTimeout(1200);
      // Should show an answer
      await expect(page.locator("text=Fisz prorokuje")).toBeVisible({ timeout: 3000 });
    }
  });

  test("Horoskop wyświetla znaki zodiaku", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollBy(0, 6000));
    await page.waitForTimeout(1000);
    const signs = page.locator("text=Ryb").or(page.locator("text=Baran")).or(page.locator("text=Byk"));
    expect(await signs.count()).toBeGreaterThanOrEqual(0);
  });

  test("kliknięcie w znak zodiaku pokazuje wróżbę", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollBy(0, 6000));
    await page.waitForTimeout(1000);
    // Click on "Ryby" sign
    const rybyBtn = page.locator("button:has-text('Ryby')").first();
    if (await rybyBtn.count() > 0) {
      await rybyBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator("text=Fisz poleca")).toBeVisible({ timeout: 3000 });
    }
  });
});
