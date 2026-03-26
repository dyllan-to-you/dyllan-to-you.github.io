/**
 * Swappable visual assertion layer.
 *
 * Two backends:
 *   - "pixel" (default): Playwright's toHaveScreenshot() pixel-diff. Free, fast, deterministic.
 *   - "llm": Claude vision API. Semantic, catches meaning-level regressions. Costs per-token.
 *
 * Switch via VISION_BACKEND=llm environment variable.
 * The test-facing API is identical regardless of backend.
 */

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

// ── Backend interface ───────────────────────────────────────────────

export interface VisionResult {
  pass: boolean;
  reasoning: string;
}

interface VisionBackend {
  assert(page: Page, assertion: string, snapshotName: string, options?: { fullPage?: boolean }): Promise<VisionResult>;
  describe(page: Page): Promise<string>;
}

// ── Pixel backend (default) ─────────────────────────────────────────

const pixelBackend: VisionBackend = {
  async assert(page, _assertion, snapshotName, options) {
    try {
      await expect(page).toHaveScreenshot(`${snapshotName}.png`, {
        fullPage: options?.fullPage ?? false,
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
      });
      return { pass: true, reasoning: "Screenshot matches golden file" };
    } catch (err) {
      return { pass: false, reasoning: `Pixel diff failed: ${(err as Error).message.slice(0, 200)}` };
    }
  },

  async describe(page) {
    const title = await page.title();
    const text = await page.innerText("body").catch(() => "");
    return `Page title: "${title}". Body text preview: "${text.slice(0, 300)}"`;
  },
};

// ── LLM backend (opt-in) ────────────────────────────────────────────

async function createLlmBackend(): Promise<VisionBackend> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  return {
    async assert(page, assertion, _snapshotName, options) {
      const screenshot = await page.screenshot({
        fullPage: options?.fullPage ?? false,
        type: "png",
      });

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/png", data: screenshot.toString("base64") },
              },
              {
                type: "text",
                text: `You are a visual QA tester. Evaluate whether this screenshot satisfies the following assertion:

"${assertion}"

Respond with EXACTLY this JSON format, nothing else:
{"pass": true/false, "reasoning": "brief explanation"}`,
              },
            ],
          },
        ],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      try {
        const parsed = JSON.parse(text);
        return { pass: Boolean(parsed.pass), reasoning: String(parsed.reasoning) };
      } catch {
        return { pass: false, reasoning: `Failed to parse vision response: ${text}` };
      }
    },

    async describe(page) {
      const screenshot = await page.screenshot({ type: "png" });

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/png", data: screenshot.toString("base64") },
              },
              {
                type: "text",
                text: "Describe what you see on this webpage. Focus on layout, visual elements, text content, and any notable design choices. Be concise.",
              },
            ],
          },
        ],
      });

      return response.content[0].type === "text" ? response.content[0].text : "";
    },
  };
}

// ── Backend resolution ──────────────────────────────────────────────

let _backend: VisionBackend | null = null;

async function getBackend(): Promise<VisionBackend> {
  if (_backend) return _backend;

  if (process.env.VISION_BACKEND === "llm") {
    console.log("[vision] Using LLM backend (Claude API — per-token cost)");
    _backend = await createLlmBackend();
  } else {
    console.log("[vision] Using pixel backend (Playwright screenshot diff — free)");
    _backend = pixelBackend;
  }

  return _backend;
}

// ── Public API (same regardless of backend) ─────────────────────────

/**
 * Assert a visual property of the current page state.
 *
 * @param page - Playwright page
 * @param assertion - Natural language description of what should be true (used by LLM backend, ignored by pixel)
 * @param snapshotName - Unique name for the golden screenshot (used by pixel backend)
 * @param options - Screenshot options
 */
export async function visionAssert(
  page: Page,
  assertion: string,
  snapshotName: string,
  options?: { fullPage?: boolean },
): Promise<VisionResult> {
  const backend = await getBackend();
  return backend.assert(page, assertion, snapshotName, options);
}

/**
 * Describe what's visible on the page.
 * Pixel backend returns title + text. LLM backend returns semantic description.
 */
export async function visionDescribe(page: Page): Promise<string> {
  const backend = await getBackend();
  return backend.describe(page);
}
