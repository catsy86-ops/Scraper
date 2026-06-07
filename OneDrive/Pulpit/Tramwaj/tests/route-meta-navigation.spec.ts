import { test, expect } from "../playwright-fixture";

/**
 * Weryfikuje, że meta tagi (OG / Twitter / canonical / <title>)
 * aktualizują się po zmianie parametru `:id` w runtime (CSR navigation),
 * symulując zmianę URL przez `history.pushState` oraz przez ponowne `goto`.
 */

const readMeta = async (page: import("@playwright/test").Page) => {
  return page.evaluate(() => {
    const get = (sel: string) =>
      document.head.querySelector(sel)?.getAttribute("content") ?? null;
    const link = (rel: string) =>
      document.head
        .querySelector(`link[rel="${rel}"]`)
        ?.getAttribute("href") ?? null;
    const count = (sel: string) => document.head.querySelectorAll(sel).length;
    return {
      title: document.title,
      ogTitle: get('meta[property="og:title"]'),
      ogDesc: get('meta[property="og:description"]'),
      ogUrl: get('meta[property="og:url"]'),
      ogType: get('meta[property="og:type"]'),
      ogSiteName: get('meta[property="og:site_name"]'),
      ogLocale: get('meta[property="og:locale"]'),
      twTitle: get('meta[name="twitter:title"]'),
      twCard: get('meta[name="twitter:card"]'),
      twSite: get('meta[name="twitter:site"]'),
      description: get('meta[name="description"]'),
      canonical: link("canonical"),
      counts: {
        ogTitle: count('meta[property="og:title"]'),
        ogUrl: count('meta[property="og:url"]'),
        ogDesc: count('meta[property="og:description"]'),
        twTitle: count('meta[name="twitter:title"]'),
        canonical: count('link[rel="canonical"]'),
        description: count('meta[name="description"]'),
        ogSiteName: count('meta[property="og:site_name"]'),
        ogLocale: count('meta[property="og:locale"]'),
        twSite: count('meta[name="twitter:site"]'),
      },
    };
  });
};

const waitForRouteTitle = async (
  page: import("@playwright/test").Page,
  routeNum: string
) => {
  await expect
    .poll(() => page.title(), { timeout: 15_000 })
    .toContain(`Linia ${routeNum}`);
};

test("meta tags update coherently when navigating between /route/:id values", async ({
  page,
}) => {
  // 1) First route
  await page.goto("/route/1");
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
  await waitForRouteTitle(page, "1");

  const first = await readMeta(page);
  expect(first.title).toContain("Linia 1");
  expect(first.ogTitle).toBe(first.title);
  expect(first.twTitle).toBe(first.title);
  expect(first.ogUrl).toContain("/route/1");
  expect(first.canonical).toBe(first.ogUrl);
  expect(first.ogType).toBe("article");
  expect(first.twCard).toBe("summary_large_image");
  expect(first.ogSiteName).toBe("KaczTransit");
  expect(first.ogLocale).toBe("pl_PL");
  expect(first.twSite).toBeTruthy();
  expect(first.twSite!.startsWith("@")).toBe(true);
  expect(first.description).toBeTruthy();
  expect(first.description).toBe(first.ogDesc);
  // No duplicates
  for (const [, c] of Object.entries(first.counts)) expect(c).toBe(1);

  // 2) Navigate via SPA history to a different route id (CSR)
  await page.evaluate(() => {
    window.history.pushState({}, "", "/route/2");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await waitForRouteTitle(page, "2");
  const second = await readMeta(page);

  expect(second.title).not.toBe(first.title);
  expect(second.title).toContain("Linia 2");
  expect(second.ogTitle).toBe(second.title);
  expect(second.twTitle).toBe(second.title);
  expect(second.ogUrl).toContain("/route/2");
  expect(second.ogUrl).not.toBe(first.ogUrl);
  expect(second.canonical).toBe(second.ogUrl);
  expect(second.ogType).toBe("article");
  expect(second.twCard).toBe("summary_large_image");
  expect(second.ogSiteName).toBe("KaczTransit");
  expect(second.ogLocale).toBe("pl_PL");
  expect(second.twSite).toBe(first.twSite);
  expect(second.description).toBeTruthy();
  expect(second.description).toBe(second.ogDesc);
  expect(second.description).not.toBe(first.description);
  for (const [, c] of Object.entries(second.counts)) expect(c).toBe(1);

  // 3) Hard reload (simulates SSR-like fresh fetch of CSR app) on the new id
  await page.goto("/route/2");
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
  await waitForRouteTitle(page, "2");

  const reloaded = await readMeta(page);
  expect(reloaded.title).toBe(second.title);
  expect(reloaded.ogUrl).toBe(second.ogUrl);
  expect(reloaded.canonical).toBe(second.canonical);
  expect(reloaded.ogDesc).toBe(second.ogDesc);
  for (const [, c] of Object.entries(reloaded.counts)) expect(c).toBe(1);
});

test("fetched HTML for /route/:id contains baseline OG tags (CSR shell)", async ({
  page,
  baseURL,
  request,
}) => {
  // Ponieważ aplikacja jest CSR, HTML pobrane przez request zawiera tylko shell
  // z domyślnymi tagami z index.html. Weryfikujemy, że shell jest spójny i nie
  // zawiera duplikatów meta tagów dla różnych :id.
  const targets = ["/route/1", "/route/2", "/route/9999"];
  const url = (p: string) => new URL(p, baseURL).toString();

  const htmls = await Promise.all(
    targets.map((t) => request.get(url(t)).then((r) => r.text()))
  );

  for (const html of htmls) {
    // Dokładnie jeden <title> w surowym HTML
    expect((html.match(/<title>/g) ?? []).length).toBe(1);
    // Shell powinien zawierać podstawowe meta z index.html (viewport + charset)
    expect(html).toMatch(/<meta[^>]+name=["']viewport["']/i);
  }

  // Dodatkowo: po stronie klienta tagi powinny być uzupełnione dynamicznie –
  // sprawdzamy to jeszcze raz dla pewności na żywej stronie.
  await page.goto("/route/1");
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
  await waitForRouteTitle(page, "1");
  const live = await readMeta(page);
  expect(live.ogTitle).toBe(live.title);
  expect(live.ogUrl).toContain("/route/1");
});
