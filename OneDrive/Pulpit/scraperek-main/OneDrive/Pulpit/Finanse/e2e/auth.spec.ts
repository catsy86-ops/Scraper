import { test, expect } from "@playwright/test";

test.describe("Auth (/auth)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
  });

  test("loads without crash and shows login form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Zaloguj się do/ })).toBeVisible();
  });

  test("email and password inputs are present", async ({ page }) => {
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Hasło")).toBeVisible();
  });

  test("toggles between login and signup mode", async ({ page }) => {
    const signUpLink = page.getByText("Zarejestruj się");
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();
    await expect(page.getByText("Nie masz konta?")).toBeVisible();
  });

  test("login button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Zaloguj się/ })).toBeVisible();
  });

  test("Google login button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Kontynuuj z Google/ })).toBeVisible();
  });

  test("back link navigates to home", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /← Wróć/ });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("form is interactive — can type in fields", async ({ page }) => {
    const emailInput = page.getByLabel("E-mail");
    const passwordInput = page.getByLabel("Hasło");
    await emailInput.fill("test@example.com");
    await passwordInput.fill("password123");
    await expect(emailInput).toHaveValue("test@example.com");
    await expect(passwordInput).toHaveValue("password123");
  });
});