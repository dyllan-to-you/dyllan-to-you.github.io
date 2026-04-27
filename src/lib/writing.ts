/**
 * Writing schema + renderer.
 *
 * Source of truth for a writing is a YAML holograph:
 *   id, frontmatter, voices, body (blocks), spans (table), prompts (table)
 *
 * MVP scope — enough to carry "We Fed Machines an Atlas..." and any near-term
 * successor. Later additions (drafts, thread weights, source-message refs,
 * outline tree, nested sections) slot in without breaking existing fields.
 *
 * Reference convention: local ids within a file are bare strings (`s001`,
 * `pr001`). Cross-file refs use scheme:id (`writing:<slug>`, `voice:justice-inline`,
 * `prompt:atlas/pr001`). MVP is single-file only; scheme parsing is reserved.
 */

import { z } from "astro:content";

// ────────────────────────────────────────────────────────────────────────────
// Schema
// ────────────────────────────────────────────────────────────────────────────

export const VoiceSchema = z.object({
  class: z.string(), // e.g. "voice-justice-inline"
  kind: z.enum(["author", "agent", "braid"]),
  label: z.string(),
});

const LegendBlock = z.object({
  kind: z.literal("legend"),
  content: z.string(),
});

const ParagraphBlock = z.object({
  kind: z.literal("paragraph"),
  id: z.string(),
  content: z.string(),
});

const SeparatorBlock = z.object({
  kind: z.literal("separator"),
});

export const BlockSchema = z.discriminatedUnion("kind", [
  LegendBlock,
  ParagraphBlock,
  SeparatorBlock,
]);

export const SpanSchema = z.object({
  voice: z.array(z.string()).min(1),
  prompt: z.string().optional(),
  text: z.string(),
  drafts: z.array(z.string()).optional(),
});

export const PromptSchema = z.object({
  justice: z.string().optional(),
  claude: z.string().optional(),
  notes: z.string().optional(),
});

export const WritingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date: z.coerce.date(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  voices: z.record(z.string(), VoiceSchema),
  body: z.array(BlockSchema),
  spans: z.record(z.string(), SpanSchema),
  prompts: z.record(z.string(), PromptSchema).default({}),
});

export type Writing = z.infer<typeof WritingSchema>;
export type Voice = z.infer<typeof VoiceSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type Span = z.infer<typeof SpanSchema>;
export type Prompt = z.infer<typeof PromptSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Renderer
// ────────────────────────────────────────────────────────────────────────────

const SPAN_PLACEHOLDER = /\{s:([a-zA-Z0-9_-]+)\}/g;

/** Render the writing body to a single HTML string. */
export function renderBody(writing: Writing): string {
  return writing.body.map((block) => renderBlock(block, writing)).join("\n");
}

/** Estimate reading time in minutes. 234 wpm sits just below Brysbaert (2019)'s
 *  meta-analytic average of 238 wpm for English silent reading, biased slightly
 *  toward the conservative side for thoughtful prose. */
export function getReadingTime(writing: Writing, wordsPerMinute = 234): number {
  const text = renderBody(writing).replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

function renderBlock(block: Block, writing: Writing): string {
  switch (block.kind) {
    case "legend":
      return `<div class="voice-legend">${resolveSpans(block.content, writing)}</div>`;
    case "paragraph":
      return `<p>${resolveSpans(block.content, writing)}</p>`;
    case "separator":
      return `<hr />`;
  }
}

/** Recursively replace {s:id} placeholders with rendered span HTML. */
function resolveSpans(content: string, writing: Writing, seen: Set<string> = new Set()): string {
  return content.replace(SPAN_PLACEHOLDER, (_, id: string) => {
    if (seen.has(id)) {
      throw new Error(`Span cycle detected at ${id}`);
    }
    const span = writing.spans[id];
    if (!span) {
      throw new Error(`Unknown span id: ${id}`);
    }
    return renderSpan(id, span, writing, new Set([...seen, id]));
  });
}

function renderSpan(id: string, span: Span, writing: Writing, seen: Set<string>): string {
  const classes = span.voice.map((v) => {
    const voice = writing.voices[v];
    if (!voice) throw new Error(`Unknown voice: ${v} (span ${id})`);
    return voice.class;
  });

  const attrs: string[] = [`class="${classes.join(" ")}"`];

  // Voice-collab carries the hover affordance; inline-only voices do not.
  // Per voice-attribution.md rule 6 + 7.
  if (span.prompt) {
    const prompt = writing.prompts[span.prompt];
    if (!prompt) throw new Error(`Unknown prompt: ${span.prompt} (span ${id})`);
    attrs.push(`data-prompt="${escapeAttr(formatPrompt(prompt))}"`);
  }

  const inner = resolveSpans(span.text, writing, seen);
  return `<span ${attrs.join(" ")}>${inner}</span>`;
}

function formatPrompt(prompt: Prompt): string {
  const parts: string[] = [];
  if (prompt.justice) parts.push(`Justice: ${prompt.justice}`);
  if (prompt.claude) parts.push(`Claude: ${prompt.claude}`);
  if (prompt.notes) parts.push(prompt.notes);
  return parts.join("\n\n");
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
