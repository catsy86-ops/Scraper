import { test, expect } from "@playwright/test";

test.describe("Pulpit (/)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads without crash and shows heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Twoje finanse/ })).toBeVisible();
  });

  test("shows stat cards", async ({ page }) => {
    await expect(page.getByText("Saldo", { exact: true })).toBeVisible();
    await expect(page.getByText("Wydatki w maju")).toBeVisible();
    await expect(page.getByText("Oszczędności", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Subskrypcje", { exact: true }).first()).toBeVisible();
  });

  test("nav links to /symulator", async ({ page }) => {
    const link = page.getByRole("link", { name: "Symulator" });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/symulator/);
  });

  test("login button navigates to /auth when logged out", async ({ page }) => {
    const loginBtn = page.getByRole("banner").getByRole("link", { name: /Zaloguj/i });
    await expect(loginBtn).toBeVisible();
    await loginBtn.click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test("logo links to home", async ({ page }) => {
    const logo = page.locator("header").getByRole("link").first();
    await logo.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("footer is present", async ({ page }) => {
    await expect(page.getByText(/© 2026 FISZU/)).toBeVisible();
  });
});