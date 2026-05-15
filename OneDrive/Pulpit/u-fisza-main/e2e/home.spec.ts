import { test, expect } from "@playwright/test";
import { test as fixture } from "../playwright-fixture";

test.describe("Strona główna", () => {
  test("ładuje się poprawnie", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Fisza/i);
  });

  test("hero jest widoczny z logo i tytułem", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=U Fisza").first()).toBeVisible();
    const heroImg = page.locator('img[alt="U Fisza logo"]');
    await expect(heroImg.first()).toBeVisible();
  });

  test("przycisk Zobacz ofertę przewija do produktów", async ({ page }) => {
    await page.goto("/");
    await page.locator("text=Zobacz ofertę").first().click();
    await page.waitForURL("**/#produkty");
  });

  test("navbar ma wszystkie linki", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Produkty").first()).toBeVisible();
    await expect(page.locator("text=VIP").first()).toBeVisible();
  });
});

test.describe("Nawigacja między stronami", () => {
  test("przejście do Alkomatu", async ({ page }) => {
    await page.goto("/");
    await page.locator("text=Alkomat").first().click();
    await expect(page.locator("text=Alkomat Fisza")).toBeVisible();
  });

  test("przejście do Quizu", async ({ page }) => {
    await page.goto("/");
    await page.locator("text=Quiz").first().click();
    await expect(page.locator("text=Co by tu wypić")).toBeVisible();
  });

  test("przejście do Fisz vs AI", async ({ page }) => {
    await page.goto("/");
    await page.locator("text=Fisz vs AI").first().click();
    await expect(page.locator("text=Fisz czy AI")).toBeVisible();
  });

  test("przejście do Dostawy", async ({ page }) => {
    await page.goto("/");
    await page.locator("text=Dostawa").first().click();
    await expect(page.locator("text=Dostawca Fisz")).toBeVisible();
  });

  test("przejście do VIP", async ({ page }) => {
    await page.goto("/");
    await page.locator("text=VIP").first().click();
    await expect(page.locator("text=Strefa VIP")).toBeVisible();
  });

  test("strona 404 wyświetla się dla nieznanej ścieżki", async ({ page }) => {
    await page.goto("/ta-strona-nie-istnieje-na-99%");
    await expect(page.locator("text=404").or(page.locator("text=Nie znaleziono"))).toBeVisible({ timeout: 5000 });
  });
});
