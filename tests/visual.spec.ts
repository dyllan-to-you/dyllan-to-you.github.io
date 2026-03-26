/**
 * Visual tests for dyllan.to.
 *
 * Two layers:
 *   1. Standard Playwright assertions (fast, deterministic)
 *   2. Visual assertions — pixel-diff by default, Claude vision via VISION_BACKEND=llm
 *
 * Run all:          npx playwright test
 * Run vision only:  npx playwright test --grep @vision
 * Use LLM backend:  VISION_BACKEND=llm npx playwright test --grep @vision
 * Update goldens:   npx playwright test --update-snapshots
 */

import { test, expect } from "@playwright/test";
import { visionAssert, visionDescribe } from "./vision";

test.describe("Page loads", () => {
  test("index returns 200", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("has a title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);
  });

  test("no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});

test.describe("Visual regression @vision", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000); // Let CSS animations settle
  });

  test("page renders visible content", async ({ page }) => {
    const result = await visionAssert(
      page,
      "The page displays visible content — text, images, or interactive elements are present. It is not a blank or error page.",
      "home-content",
    );
    expect(result.pass, result.reasoning).toBe(true);
  });

  test("book layout is recognizable", async ({ page }) => {
    const result = await visionAssert(
      page,
      "The page shows something that resembles a book, tome, or document with distinct pages or sections.",
      "home-book-layout",
    );
    expect(result.pass, result.reasoning).toBe(true);
  });

  test("no visual artifacts or broken layout", async ({ page }) => {
    const result = await visionAssert(
      page,
      "The page layout is clean with no obvious visual bugs: no overlapping text, no elements cut off at edges, no giant blank areas where content should be.",
      "home-clean-layout",
    );
    expect(result.pass, result.reasoning).toBe(true);
  });

  test("describe page for baseline", async ({ page }) => {
    const description = await visionDescribe(page);
    console.log("Vision description:", description);
    expect(description.length).toBeGreaterThan(10);
  });
});
