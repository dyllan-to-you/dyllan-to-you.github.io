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

// The route set the PRODUCTION build actually generates (the Playwright
// webServer runs `npm run preview`, i.e. the prod build, where drafts are
// filtered). Mirrors `[...slug].astro`'s getStaticPaths output with the
// current drafts: root + the published non-cover pages + the virtual back
// cover. `/story` `/works` `/writings` carry `draft:true`, so they are NOT
// generated — scanning them was false coverage (axe on a 404 page). When a
// page is un-drafted, add it here (T7: derive from the published set, never
// from hardcoded routes that rot against the additively-evolving book).
const ROUTES = [
  { path: "/", name: "cover" },
  { path: "/epigraph", name: "Epigraph" },
  { path: "/resume", name: "The Résumé" },
  { path: "/now", name: "Now" },
  { path: "/colophon", name: "Colophon" },
  { path: "/back", name: "Back Cover" },
];

for (const { path, name } of ROUTES) {
  test(`${name} (${path}) has no axe violations`, async ({ page }) => {
    const response = await page.goto(path);
    // Assert the route actually 200s BEFORE scanning, so a missing/404 route
    // fails loudly here instead of silently scanning a 404 page and passing
    // (the false-green class T7 warns about). A static 404 returns a non-200.
    expect(response?.status(), `expected 200 for ${path}, got ${response?.status()}`).toBe(200);
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
