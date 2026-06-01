/**
 * Tome-page schema.
 *
 * Pages are the structural leaves of the book. Each carries frontmatter that
 * drives the tome engine (chapter / cards / quote / colophon lines / etc.)
 * and an optional HTML body for prose sections.
 *
 * Pages are pre-rendered: the body is stored as HTML string in the YAML, not
 * as markdown or MDX. This eliminates the experimental_AstroContainer
 * dependency that was the source of the dev-server HMR fragility on MDX edits.
 */

import { z } from "astro/zod";

const ChapterSchema = z.object({
  number: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
});

const LineSchema = z.object({
  text: z.string(),
  italic: z.boolean().optional(),
  mono: z.boolean().optional(),
});

const CardSchema = z.object({
  name: z.string(),
  description: z.string(),
  // Optional in-book/permalink target. Authored cards omit it; the layout's
  // dynamic writings-cards builder sets it to the writing's permalink.
  href: z.string().optional(),
});

export const PageSchema = z.object({
  slug: z.string(),
  order: z.number(),
  label: z.string(),
  toc: z.string().optional(),
  // Hidden from the prod book; still rendered in dev so in-flight pages
  // are visible while authoring. Mirrors the writings collection.
  draft: z.boolean().default(false),
  pageLayout: z.enum(["cover", "content"]).default("content"),
  variant: z.enum(["front", "back"]).optional(),
  chapter: ChapterSchema.optional(),
  backFace: z.enum(["cover"]).optional(),
  // Epigraph
  prompt: z.string().optional(),
  quote: z.string().optional(),
  attribution: z.string().optional(),
  // Colophon
  lines: z.array(LineSchema).optional(),
  // Cards (static)
  cards: z.array(CardSchema).optional(),
  // Cards (dynamic — resolved at layout time from a collection)
  cardsSource: z.enum(["writings"]).optional(),
  header: z.string().optional(),
  closing: z.string().optional(),
  // Body — pre-rendered HTML. Paragraphs wrapped in <p>; headings as <h2>;
  // separators as <hr>. Safe minimal markup only: p / h2 / h3 / strong / em /
  // a / hr / ul / ol / li / code.
  body: z.string().optional(),
});

export type Page = z.infer<typeof PageSchema>;

/**
 * Canonical tome-page type — the superset that actually flows through the
 * tome engine. It is the authored `Page` (single-sourced from the Zod schema)
 * plus the fields the layout *synthesizes* at compose time:
 *
 *   - `sections` — h2 anchors extracted from the rendered body (TOC nesting).
 *   - `meta`     — TOC meta column text (e.g. a writing's short date).
 *
 * (Card `href` is authored-or-synthesized but lives on `CardSchema` itself, so
 * it rides in via `Page`.) This is the ONE shape `BookLayout`, `Tome`, and
 * `ContentPage` agree on — framework-neutral; no Astro/Svelte imports here.
 */
export type TomePage = Page & {
  sections?: { id: string; text: string }[];
  meta?: string;
};

/** Extract h2 ids from rendered page body HTML for TOC-section nesting. */
export function extractSections(html: string): { id: string; text: string }[] {
  const sections: { id: string; text: string }[] = [];
  const re = /<h2[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/h2>/gi;
  for (const match of html.matchAll(re)) {
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    if (match[1] && text) {
      sections.push({ id: match[1], text });
    }
  }
  return sections;
}
