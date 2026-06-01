/**
 * Navigation tests for the book engine.
 *
 * Tests keyboard, click, and boundary navigation — including the
 * back-cover skip fix (colophon → closed, no intermediate spread).
 */

import { test, expect } from "@playwright/test";

// The aria-live region announces page state. Page count is data-driven
// (drafts filtered in prod); tests walk-until-match rather than count.
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
    const label = await page.locator('[data-tome-live-page]').textContent();
    expect(label).toContain("Front Cover");
  });

  test("arrow right navigates forward", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    // Open the book from front cover
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(FLIP_SETTLE_MS);
    const label = await page.locator('[data-tome-live-page]').textContent();
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
    const label = await page.locator('[data-tome-live-page]').textContent();
    expect(label).toContain("Front Cover");
  });

  test("cannot navigate before front cover", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(FLIP_SETTLE_MS);
    const label = await page.locator('[data-tome-live-page]').textContent();
    expect(label).toContain("Front Cover");
  });

  test("colophon skips directly to closed back cover", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    // Walk until we land on Colophon. T7: derive target from data, not from
    // a hardcoded literal — the book is additively-evolving.
    let label = "";
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(FLIP_SETTLE_MS);
      label = (await page.locator('[data-tome-live-page]').textContent()) ?? "";
      if (label.includes("Colophon")) break;
    }
    expect(label).toContain("Colophon");

    // One more flip should close the book — skip the back cover leaf spread
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(FLIP_SETTLE_MS);

    label = (await page.locator('[data-tome-live-page]').textContent()) ?? "";
    expect(label).toContain("Book closed (back)");
  });

  test("closed back cover skips directly to colophon on back navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    // Walk to colophon (data-driven, T7), then one more flip to close.
    let label = "";
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(FLIP_SETTLE_MS);
      label = (await page.locator('[data-tome-live-page]').textContent()) ?? "";
      if (label.includes("Colophon")) break;
    }
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(FLIP_SETTLE_MS);

    // Verify closed
    label = (await page.locator('[data-tome-live-page]').textContent()) ?? "";
    expect(label).toContain("Book closed (back)");

    // Go back — should land on colophon, not an intermediate state
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(FLIP_SETTLE_MS);

    label = (await page.locator('[data-tome-live-page]').textContent()) ?? "";
    expect(label).toContain("Colophon");
  });

  test("ArrowDown inside a focused .scroll-area scrolls, does not flip (R5)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    // Open the book onto the first content page (epigraph → next is a content
    // leaf with a real scroll-area).
    await page.keyboard.press("ArrowRight"); // → epigraph
    await page.waitForTimeout(FLIP_SETTLE_MS);
    await page.keyboard.press("ArrowRight"); // → first content chapter
    await page.waitForTimeout(FLIP_SETTLE_MS);

    const before = (await page.locator("[data-tome-live-page]").textContent()) ?? "";

    // Focus the active leaf's scroll-area, then press ArrowDown. Pre-R5 the
    // engine hijacked ArrowDown and flipped forward; post-R5 it must pass
    // through to native scroll, leaving the page label unchanged.
    await page.evaluate(() => {
      const areas = Array.from(document.querySelectorAll<HTMLElement>(".scroll-area"));
      // Pick the one inside a non-inert (active) leaf.
      const active = areas.find((a) => !a.closest("[inert]"));
      (active ?? areas[0])?.focus();
    });
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(FLIP_SETTLE_MS);

    const after = (await page.locator("[data-tome-live-page]").textContent()) ?? "";
    expect(after).toBe(before); // no flip — ArrowDown stayed in the scroll-area

    // ArrowRight from a scroll-area MUST still flip (reserved for navigation).
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(FLIP_SETTLE_MS);
    const afterRight = (await page.locator("[data-tome-live-page]").textContent()) ?? "";
    expect(afterRight).not.toBe(before);
  });

  test("TOC navigation jumps to correct page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    // Open book first
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(FLIP_SETTLE_MS);

    // Click a TOC entry (the-resume = /resume page)
    const tocEntry = page.locator("button.tree-entry", { hasText: "the-resume" });
    if (await tocEntry.count() > 0) {
      await tocEntry.first().click();
      await page.waitForTimeout(FLIP_SETTLE_MS);
      const label = await page.locator('[data-tome-live-page]').textContent();
      expect(label).toContain("Résumé");
    }
  });
});
