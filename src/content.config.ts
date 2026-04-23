import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Page collection — book pages as MDX.
 *
 * Frontmatter carries book-engine metadata. The MDX body renders to
 * HTML via Container API and is displayed inside the page frame.
 *
 * Progressive enhancement: each frontmatter field is independently
 * present or absent. No "type" switching.
 *
 *   chapter      → renders ChapterHeader above body
 *   header       → renders terminal-style label above body
 *   quote        → renders centered epigraph layout
 *   cards        → renders static card grid after body
 *   cardsSource  → renders dynamic card grid sourced from a collection
 *   lines        → renders colophon-style centered text
 *   closing      → renders terminal closing text after body
 *   backFace     → marks this leaf's verso as the back cover
 */
const pages = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/pages" }),
  schema: z.object({
    slug: z.string(),
    order: z.number(),
    label: z.string(),
    toc: z.string().optional(),
    /** "cover" for leather exterior pages, "content" for everything else. Named
     *  pageLayout (not layout) because Astro reserves "layout" in MDX frontmatter. */
    pageLayout: z.enum(["cover", "content"]).default("content"),
    variant: z.enum(["front", "back"]).optional(),
    chapter: z
      .object({
        number: z.string(),
        title: z.string(),
        subtitle: z.string().optional(),
      })
      .optional(),
    backFace: z.enum(["cover"]).optional(),
    // Epigraph
    prompt: z.string().optional(),
    quote: z.string().optional(),
    attribution: z.string().optional(),
    // Colophon
    lines: z
      .array(
        z.object({
          text: z.string(),
          italic: z.boolean().optional(),
          mono: z.boolean().optional(),
        }),
      )
      .optional(),
    // Cards
    cards: z
      .array(
        z.object({
          name: z.string(),
          description: z.string(),
        }),
      )
      .optional(),
    /** Populate cards dynamically from a collection at build time. */
    cardsSource: z.enum(["writings"]).optional(),
    header: z.string().optional(),
    closing: z.string().optional(),
  }),
});

const writings = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/writings" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { pages, writings };
