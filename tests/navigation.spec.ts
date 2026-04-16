/**
 * Navigation tests for the book engine.
 *
 * Tests keyboard, click, and boundary navigation — including the
 * back-cover skip fix (colophon → closed, no intermediate spread).
 */

import { test, expect } from "@playwright/test";

// The book has 9 pages (indices 0-8). The aria-live region announces state.
const FLIP_SETTLE_MS = 1000;

test.describe("Book navigation", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
  });

  test("starts on front cover in landscape", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    const label = await page.locator("[aria-live='polite']").textContent();
    expect(label).toContain("Front Cover");
  });

  test("arrow right navigates forward", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    // Open the book from front cover
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(FLIP_SETTLE_MS);
    const label = await page.locator("[aria-live='polite']").textContent();
    expect(label).toContain("Epigraph");
  });

  test("arrow left navigates back", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    // Go forward then back
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(FLIP_SETTLE_MS);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(FLIP_SETTLE_MS);
    const label = await page.locator("[aria-live='polite']").textContent();
    expect(label).toContain("Front Cover");
  });

  test("cannot navigate before front cover", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(FLIP_SETTLE_MS);
    const label = await page.locator("[aria-live='polite']").textContent();
    expect(label).toContain("Front Cover");
  });

  test("colophon skips directly to closed back cover", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    // Navigate to the colophon (page index 5 = 5 ArrowRight presses from cover)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(FLIP_SETTLE_MS);
    }

    // Verify we're at colophon
    let label = await page.locator("[aria-live='polite']").textContent();
    expect(label).toContain("Colophon");

    // One more flip should close the book — skip the back cover leaf spread
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(FLIP_SETTLE_MS);

    label = await page.locator("[aria-live='polite']").textContent();
    expect(label).toContain("Book closed (back)");
  });

  test("closed back cover skips directly to colophon on back navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    // Navigate all the way to closed back
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(FLIP_SETTLE_MS);
    }
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(FLIP_SETTLE_MS);

    // Verify closed
    let label = await page.locator("[aria-live='polite']").textContent();
    expect(label).toContain("Book closed (back)");

    // Go back — should land on colophon, not an intermediate state
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(FLIP_SETTLE_MS);

    label = await page.locator("[aria-live='polite']").textContent();
    expect(label).toContain("Colophon");
  });

  test("TOC navigation jumps to correct page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    // Open book first
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(FLIP_SETTLE_MS);

    // Click a TOC entry (the-architect = /story page)
    const tocEntry = page.locator("button.tree-entry", { hasText: "the-architect" });
    if (await tocEntry.count() > 0) {
      await tocEntry.first().click();
      await page.waitForTimeout(FLIP_SETTLE_MS);
      const label = await page.locator("[aria-live='polite']").textContent();
      expect(label).toContain("Architect");
    }
  });
});
