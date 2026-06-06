import { test, expect, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

async function runA11y(page: Page, pathToAxe: string, pagePath: string): Promise<{ violations: A11yViolation[]; errors: string[] }> {
  const violations: A11yViolation[] = [];
  const errors: string[] = [];

  await page.goto(pagePath);
  await page.waitForLoadState("networkidle");

  await page.addScriptTag({ path: pathToAxe });

  const results = await page.evaluate(() => {
    return new Promise<object>((resolve, reject) => {
      (window as unknown as { axe: { run: (opts: object, cb: (result: object) => void) => void } }).axe.run(
        {},
        (result: object) => resolve(result),
      );
      setTimeout(() => reject(new Error("axe-core timeout")), 15000);
    });
  }) as { violations: A11yViolation[] };

  for (const v of results.violations ?? []) {
    violations.push(v);
    errors.push(`[${v.impact}] ${v.help}`);
    for (const node of v.nodes.slice(0, 2)) {
      errors.push(`  ${(node.target as string[]).join(" ")}`);
    }
  }

  return { violations, errors };
}

interface A11yViolation {
  id: string;
  impact: string;
  help: string;
  description: string;
  nodes: { target: string[]; html: string }[];
}

const AXE_PATH = path.resolve(__dirname, "../node_modules/axe-core/axe.min.js");

const ROUTES = [
  { path: "/", name: "Pulpit" },
  { path: "/auth", name: "Auth" },
  { path: "/symulator", name: "Symulator" },
] as const;

for (const { path: routePath, name } of ROUTES) {
  test(`a11y — ${name} (${routePath})`, async ({ page }) => {
    const { violations, errors } = await runA11y(page, AXE_PATH, routePath);
    if (errors.length > 0) {
      console.error(`[a11y] ${name}:\n${errors.join("\n")}`);
    }
    expect.soft(violations, `${name}: ${errors.join("\n")}`).toHaveLength(0);
  });
}

test("symulator — no console errors on load", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("/symulator");
  await page.waitForLoadState("networkidle");
  expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
});

test("root — no console errors on load", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
});

test("root — auth page no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("/auth");
  await page.waitForLoadState("networkidle");
  expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
});