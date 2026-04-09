/**
 * §1 — Engine Tokens
 *
 * JS-only values consumed by Tome.svelte for calculations,
 * conditionals, and dynamic style bindings that CSS alone can't drive.
 *
 * Visual tokens (colors, fonts, backgrounds) live in
 * src/styles/guide.css as CSS custom properties.
 */

export const timing = {
  flipMs: 600,
  flipEase: "cubic-bezier(0.45, 0.05, 0.55, 0.95)",
};

export const layout = {
  portraitW: "96vw",
  portraitH: "min(85vh, 700px)",
  // Landscape: fills 90% of vertical space. Width derives from height
  // via the preserved ~1.625 ratio, capped by 95vw on narrow viewports.
  landscapeW: "min(95vw, calc(90vh * 1.625))",
  landscapeH: "90vh",
  portraitPerspective: "1000px",
  landscapePerspective: "1200px",
  portraitEye: "50% 50%",
  landscapeEye: "75% 50%",
};

export const interaction = {
  swipeThreshold: 50,
  portraitBackZone: 0.35,
};
