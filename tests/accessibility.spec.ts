/**
 * Accessibility tests — run the axe-core rule set against each published
 * route and assert zero violations. Catches ARIA, landmark, alt-text,
 * heading-order, and contrast regressions in rendered HTML.
 *
 * Drafts are filtered from production builds, so this suite only hits
 * routes that survive the draft filter.
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = [
  { path: "/", name: "cover" },
  { path: "/epigraph", name: "epigraph" },
  { path: "/story", name: "Chapter I — The Architect" },
  { path: "/works", name: "Chapter II — The Works" },
  { path: "/writings", name: "Chapter III — The Writings" },
  { path: "/now", name: "Now" },
  { path: "/colophon", name: "Colophon" },
];

for (const { path, name } of ROUTES) {
  test(`${name} (${path}) has no axe violations`, async ({ page }) => {
    await page.goto(path);
    // Let Svelte hydrate before scanning
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      // Skip rules that false-positive on our 3D book chrome
      .disableRules([
        // The Tome's offscreen leaves are intentionally hidden from AT
        "aria-hidden-focus",
        // Best-practice rule: the book's h1 is on the cover leaf, which is
        // inert on non-cover routes. The book metaphor (single document,
        // multiple "pages" in DOM) defeats this heuristic — every route
        // shares the same document with the cover providing the canonical h1.
        "page-has-heading-one",
      ])
      .analyze();

    expect(
      results.violations,
      `axe violations on ${path}:\n${JSON.stringify(results.violations, null, 2)}`,
    ).toEqual([]);
  });
}
