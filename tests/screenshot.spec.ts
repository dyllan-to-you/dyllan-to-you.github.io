import { test } from "@playwright/test";

test("screenshot spreads", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/");
  await page.waitForSelector(".tome-root");

  // Open book
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(800);
  // Screenshot: epigraph spread (TOC left, epigraph right)
  await page.screenshot({ path: "tests/spread-1.png" });

  // Next spread
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(800);
  await page.screenshot({ path: "tests/spread-2.png" });

  // One more
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(800);
  await page.screenshot({ path: "tests/spread-3.png" });
});
