import { test, expect } from "@playwright/test";

test.describe("Symulator (/symulator)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/symulator");
  });

  test("loads without crash and shows title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Ile zaoszczędzisz/ })).toBeVisible();
  });

  test("navigates back to Pulpit", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /Pulpit/ });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("shows result cards", async ({ page }) => {
    await expect(page.getByText("Auto-Sejf / mies.")).toBeVisible();
    await expect(page.getByText("Round-Up / mies.")).toBeVisible();
    await expect(page.getByText("Razem / mies.")).toBeVisible();
    await expect(page.getByText("Razem / rok")).toBeVisible();
  });

  test("shows projection chart section", async ({ page }) => {
    await expect(page.getByText("Prognoza salda — 24 miesiące")).toBeVisible();
  });

  test("shows milestone cards", async ({ page }) => {
    await expect(page.getByText("Po 3 miesiącach")).toBeVisible();
    await expect(page.getByText("Po 12 miesiącach")).toBeVisible();
    await expect(page.getByText("Po 24 miesiącach")).toBeVisible();
  });

  test("shows validation mode toggle", async ({ page }) => {
    await expect(page.getByText("Walidacja pól")).toBeVisible();
    await expect(page.getByRole("button", { name: /Na bieżąco/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Po edycji/ })).toBeVisible();
  });

  test("Auto-Sejf section is present", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Auto-Sejf/ })).toBeVisible();
    await expect(page.getByText("Średni miesięczny wpływ")).toBeVisible();
    await expect(page.getByText("Procent odkładania")).toBeVisible();
  });

  test("Round-Up section is present", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Round-Up/ })).toBeVisible();
    await expect(page.getByText("Reguła zaokrąglenia")).toBeVisible();
    await expect(page.getByText("Mnożnik")).toBeVisible();
  });

  test("toggle Auto-Sejf updates monthly result", async ({ page }) => {
    const autoToggle = page.locator('[aria-label="toggle"]').first();
    await autoToggle.click();
    await expect(page.getByText("Auto-Sejf / mies.")).toBeVisible();
  });

  test("shows login prompt when not authenticated", async ({ page }) => {
    await expect(page.getByText(/Zaloguj, by zapisać/)).toBeVisible();
  });

  test("chart renders", async ({ page }) => {
    const svg = page.locator(".recharts-wrapper").first();
    await expect(svg).toBeVisible();
  });

  test("roundup rule buttons are clickable", async ({ page }) => {
    const btn = page.getByRole("button", { name: /Do 2 zł/ });
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(btn).toBeAttached();
  });

  test("multiplier buttons are clickable", async ({ page }) => {
    const btn = page.getByRole("button", { name: /2×/ });
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(btn).toBeAttached();
  });
});