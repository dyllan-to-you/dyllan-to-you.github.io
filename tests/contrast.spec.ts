/**
 * Design-system color contrast test.
 *
 * Reads --tome-* tokens from guide.css, computes WCAG relative-luminance
 * contrast ratios for foreground/background pairs that appear together in
 * the rendered UI, and asserts each pair meets AA body-text (4.5:1) or
 * large-text (3:1) minimums as appropriate.
 *
 * This is a pure-data test — does not require the preview server — but
 * runs under Playwright because the project's CI already wires Playwright
 * tests into npm run test.
 */

import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ── WCAG primitives ─────────────────────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const expanded = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h;
  return [
    parseInt(expanded.slice(0, 2), 16),
    parseInt(expanded.slice(2, 4), 16),
    parseInt(expanded.slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLin = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const fg = relativeLuminance(hexToRgb(fgHex));
  const bg = relativeLuminance(hexToRgb(bgHex));
  const light = Math.max(fg, bg);
  const dark = Math.min(fg, bg);
  return (light + 0.05) / (dark + 0.05);
}

/* ── Token extraction ────────────────────────────────────────────── */

function extractTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  // Match lines like `  --tome-name: #hexvalue;` — ignoring values that
  // aren't plain hex colors (gradients, var() references, etc.).
  const re = /--(tome-[\w-]+):\s*(#[0-9a-f]{3,8})\s*;/gi;
  for (const match of css.matchAll(re)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

/* ── Assertions ──────────────────────────────────────────────────── */

/** Pairs we actually render on screen. Tuple: [foregroundToken, bgToken, minRatio, note]. */
type Pair = [string, string, number, string];

const AA_BODY = 4.5;
const AA_LARGE = 3.0;

const PAIRS: Pair[] = [
  ["tome-ink", "tome-paper", AA_BODY, "body text on parchment"],
  ["tome-voice-justice", "tome-paper", AA_BODY, "Justice's voice on parchment"],
  ["tome-voice-agent", "tome-paper", AA_BODY, "Claude's voice on parchment"],
  ["tome-link", "tome-paper", AA_BODY, "links on parchment"],
  ["tome-ink-light", "tome-paper", AA_LARGE, "secondary ink on parchment (large text only)"],
  ["tome-term-green", "tome-paper", AA_LARGE, "terminal accent on parchment (decorative/label)"],
  ["tome-term-dim", "tome-paper", AA_LARGE, "dim terminal text on parchment (meta labels)"],
];

test.describe("design-system contrast", () => {
  const cssPath = resolve(__dirname, "..", "src", "styles", "guide.css");
  const css = readFileSync(cssPath, "utf8");
  const tokens = extractTokens(css);

  for (const [fg, bg, min, note] of PAIRS) {
    test(`${fg} on ${bg} meets ${min}:1 (${note})`, () => {
      const fgColor = tokens[fg];
      const bgColor = tokens[bg];
      expect(fgColor, `token --${fg} not defined`).toBeDefined();
      expect(bgColor, `token --${bg} not defined`).toBeDefined();

      const ratio = contrastRatio(fgColor, bgColor);
      const rounded = Math.round(ratio * 100) / 100;

      // Helpful failure message — includes the computed ratio.
      expect(
        ratio,
        `${fg} (${fgColor}) on ${bg} (${bgColor}) = ${rounded}:1 (need ≥ ${min}:1)`,
      ).toBeGreaterThanOrEqual(min);
    });
  }
});
