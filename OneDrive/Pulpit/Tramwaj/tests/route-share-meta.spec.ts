import { test, expect } from "../playwright-fixture";

test("route /route/1 sets coherent meta tags and share copies matching URL", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  // Force fallback path (clipboard) by removing navigator.share before app loads.
  await page.addInitScript(() => {
    // @ts-expect-error override
    delete (navigator as any).share;
    // @ts-expect-error override
    delete (navigator as any).canShare;
  });

  await page.goto("/route/1");

  // Wait until route is loaded (header shows the line number badge + name)
  const heading = page.locator("h1").first();
  await expect(heading).toBeVisible({ timeout: 15_000 });
  const routeName = (await heading.textContent())?.trim() ?? "";
  expect(routeName.length).toBeGreaterThan(0);

  // Verify <title> reflects line 1 and route name
  await expect.poll(() => page.title(), { timeout: 10_000 }).toContain("Linia 1");
  const title = await page.title();
  expect(title).toContain(routeName);
  expect(title).toContain("KaczTransit");

  // Helper to read meta content
  const meta = async (selector: string) =>
    page.locator(selector).first().getAttribute("content");

  const ogTitle = await meta('meta[property="og:title"]');
  const ogDesc = await meta('meta[property="og:description"]');
  const ogUrl = await meta('meta[property="og:url"]');
  const ogType = await meta('meta[property="og:type"]');
  const ogSiteName = await meta('meta[property="og:site_name"]');
  const ogLocale = await meta('meta[property="og:locale"]');
  const twCard = await meta('meta[name="twitter:card"]');
  const twTitle = await meta('meta[name="twitter:title"]');
  const twSite = await meta('meta[name="twitter:site"]');
  const description = await meta('meta[name="description"]');
  const canonical = await page
    .locator('link[rel="canonical"]')
    .first()
    .getAttribute("href");

  expect(ogTitle).toBe(title);
  expect(twTitle).toBe(title);
  expect(ogType).toBe("article");
  expect(twCard).toBe("summary_large_image");
  expect(ogSiteName).toBe("KaczTransit");
  expect(ogLocale).toBe("pl_PL");
  expect(twSite).toBeTruthy();
  expect(twSite!.startsWith("@")).toBe(true);
  expect(ogUrl).toContain("/route/1");
  expect(canonical).toContain("/route/1");
  expect(canonical).toBe(ogUrl);
  expect(description).toBeTruthy();
  expect(description).toBe(ogDesc);
  // Description should mention the line number and stop count phrasing
  expect(description!).toMatch(/Linia 1|linii 1/);
  expect(description!).toMatch(/przystank/i);

  // Trigger share – falls back to clipboard since we removed navigator.share
  await page.getByRole("button", { name: /Udostępnij/i }).click();

  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain("/route/1");
  expect(clipboard).toBe(ogUrl);
});
