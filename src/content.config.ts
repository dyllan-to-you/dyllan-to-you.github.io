import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { PageSchema } from "./lib/page";
import { WritingSchema } from "./lib/writing";

/**
 * Page collection — book pages as YAML.
 *
 * Each page carries tome-engine frontmatter (chapter, header, quote, cards,
 * cardsSource, lines, closing, backFace) plus an optional pre-rendered HTML
 * body. Progressive enhancement — every field is independently present.
 */
const pages = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/pages" }),
  schema: PageSchema,
});

/**
 * Writings collection — voice-attributed essays as YAML holographs.
 * See src/lib/writing.ts for schema + renderer.
 */
const writings = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/writings" }),
  schema: WritingSchema,
});

export const collections = { pages, writings };
