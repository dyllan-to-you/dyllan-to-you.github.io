/**
 * §1 — Design Tokens
 *
 * Single source of truth for the book's visual identity.
 * Change the tome's look by editing this file alone.
 *
 * Consumed by:
 *   - Tome.svelte (engine mechanics: timing, layout, interaction)
 *   - Page components (colors, fonts, backgrounds)
 *   - SVG decorations (colors)
 */

export const colors = {
  // Exterior — leather casing
  leather:    "#3a2818",
  leatherMid: "#4a3525",
  spine:      "#2a1808",
  gold:       "#c9a84c",
  goldBright: "#e8d68c",
  copper:     "#b87333",
  // Interior — parchment terminal
  paper:      "#f0e4cc",
  paperLight: "#f5ead5",
  paperEdge:  "#e0d0b0",
  ink:        "#2a1a0a",
  inkLight:   "#6a5a4a",
  // Terminal accents on parchment
  termGreen:  "#2d6b3f",
  termAmber:  "#a07828",
  termDim:    "#8a7a6a",
  prompt:     "#3d7a4f",
};

export const fonts = {
  display:  "'Cinzel Decorative', 'Cinzel', serif",
  heading:  "'Cinzel', serif",
  body:     "'Cormorant Garamond', serif",
  mono:     "'IBM Plex Mono', 'Courier New', monospace",
  fallback: "'Cormorant Garamond', Georgia, serif",
};

export const timing = {
  flipMs:     600,
  flipEase:   "cubic-bezier(0.45, 0.05, 0.55, 0.95)",  // symmetric ease-in-out
};

export const layout = {
  portraitW:            "96vw",
  portraitH:            "min(85vh, 700px)",
  landscapeW:           "min(1300px, 97vw)",
  landscapeH:           "min(800px, 94vh)",
  portraitPerspective:  "1000px",
  landscapePerspective: "1200px",
  portraitEye:          "50% 50%",     // centered — symmetric forward/backward
  landscapeEye:         "75% 50%",
};

export const interaction = {
  swipeThreshold:   50,
  portraitBackZone: 0.35,
};

export const backgrounds = {
  leather: `
    repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,.02) 3px, rgba(0,0,0,.02) 6px),
    repeating-linear-gradient(-30deg, transparent, transparent 5px, rgba(0,0,0,.015) 5px, rgba(0,0,0,.015) 10px),
    radial-gradient(ellipse at 40% 30%, ${colors.leatherMid}, ${colors.leather} 60%, ${colors.spine})
  `,
  paper: `
    radial-gradient(ellipse at 85% 15%, rgba(180,150,100,.12), transparent 50%),
    radial-gradient(ellipse at 15% 85%, rgba(160,130,80,.08), transparent 40%),
    radial-gradient(ellipse at 50% 50%, ${colors.paperLight}, ${colors.paper} 70%, ${colors.paperEdge})
  `,
  void: "radial-gradient(ellipse at 50% 50%, #1a1a2e 0%, #0a0a15 100%)",
};

