import { test, type Page, type Locator, type ConsoleMessage } from "@playwright/test";

export async function expectNoA11yViolations(page: Page, url: string) {
  const errors: string[] = [];
  const result = await page.evaluate(async (pageUrl) => {
    const { default: axe } = await import("axe-core");
    await page.goto(pageUrl);
    return axe.run();
  }, url);

  if (result.violations.length > 0) {
    for (const v of result.violations) {
      errors.push(
        `[${v.impact}] ${v.help}: ${v.description} (${v.nodes.length} nodes)`,
      );
      for (const node of v.nodes.slice(0, 3)) {
        errors.push(`  -> ${node.target.join(" ")}: ${node.html.slice(0, 120)}`);
      }
    }
  }
  return {
    violations: result.violations,
    errors,
    pass: errors.length === 0,
  };
}

export async function checkA11y(page: Page, url: string): Promise<{
  pass: boolean;
  errors: string[];
  violations: unknown[];
}> {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  const { default: axe } = await (globalThis as Record<string, unknown> & {
    importDynamic?: (s: string) => Promise<{ default: (opts: object) => { run: () => Promise<{ violations: unknown[] }> } }>
  }).importDynamic!("axe-core");
  return expectNoA11yViolations(page, url);
}

export function captureConsoleErrors(page: Page, fn: () => Promise<void>): Promise<ConsoleMessage[]> {
  const errors: ConsoleMessage[] = [];
  const listener = (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(msg);
  };
  page.on("console", listener);
  return fn().finally(() => page.off("console", listener));
}

export async function waitForAnimation(page: Page, locator: Locator) {
  await locator.waitFor();
  await page.waitForTimeout(100);
}