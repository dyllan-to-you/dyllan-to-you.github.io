/**
 * §5 — Page Registry
 *
 * Single source of truth for all pages in the book.
 * Adding a page = adding one entry here. Everything else derives.
 *
 * Types:
 *   cover    — leather exterior (front or back)
 *   epigraph — centered quote with attribution
 *   prose    — labeled sections of body text
 *   chapter  — chapter header + body paragraphs (optional drop cap)
 *   cards    — project cards with optional chapter header
 *   colophon — centered closing text
 */

export const pages = [
  // ─── Cover ───
  {
    type: "cover",
    label: "Front Cover",
    variant: "front",
    slug: "",
  },

  // ─── Content pages ───
  {
    type: "epigraph",
    label: "Epigraph",
    toc: "epigraph",
    slug: "epigraph",
    prompt: "cat /etc/motd",
    quote: "\u201CAssert nothing.<br/>Derive everything.\u201D",
    attribution: "THE UR FRAMEWORK",
  },
  {
    type: "prose",
    label: "Philosophy",
    toc: "philosophy",
    slug: "philosophy",
    sections: [
      {
        label: "philosophy",
        text: "Local-first. Data-sovereign. Community-owned. The solarpunk ethos isn\u2019t aesthetic \u2014 it\u2019s architectural. Every system should make its inhabitants more free, not less.",
      },
      {
        label: "practice",
        text: "Recursive specification as design method. Formal modeling before implementation. Convergent systems that derive structure from first principles \u2014 assert nothing, derive everything.",
      },
    ],
  },
  {
    type: "chapter",
    label: "The Architect",
    toc: "the-architect",
    slug: "architect",
    chapter: { number: "I", title: "The Architect", subtitle: "On building and becoming" },
    paragraphs: [
      {
        drop: "S",
        text: "ystems thinker. Software engineer. Solo founder of Playfaire PBC \u2014 a public benefit corporation building sovereign systems and transparent tools.",
      },
      {
        text: "Seven years in enterprise software taught the mechanics. The vision came from somewhere older \u2014 a conviction that technology should serve autonomy, not extract it.",
      },
    ],
    closing: "location: San Francisco Bay Area\nbuilding: ontology \u00D7 orchestration \u00D7 play",
  },
  {
    type: "cards",
    label: "Core Projects",
    toc: "core-projects",
    slug: "projects",
    header: "ls ~/core",
    cards: [
      { name: "Ur", description: "A recursive specification framework. The ontological kernel." },
      { name: "Faewyld", description: "Agent orchestration. Self-optimizing autonomous loops." },
      { name: "Ludex", description: "The knowledge and crossing layer. Navigation through meaning." },
    ],
  },
  {
    type: "cards",
    label: "The Works",
    toc: "the-works",
    slug: "works",
    chapter: { number: "II", title: "The Works", subtitle: "Projects and pursuits" },
    cards: [
      {
        name: "Locus",
        description: "Coaching tools. Detecting phase transitions and applying pressure at the edge of becoming.",
      },
      { name: "Verve", description: "Personal productivity. Time and rhythm as first-class primitives." },
      { name: "Toast", description: "Cryptographic proof-of-presence. The clink of glasses, verified." },
    ],
  },
  {
    type: "chapter",
    label: "The Frequencies",
    toc: "frequencies",
    slug: "frequencies",
    chapter: { number: "III", title: "The Frequencies", subtitle: "Sound, light, and presence" },
    paragraphs: [
      {
        drop: "M",
        text: "usic is the other architecture. Looping-based performance \u2014 layers built live, deconstructed live. Classical piano training as foundation, everything else as exploration.",
      },
      {
        text: "Multiple instruments. Art installations at Burning Man. The DJ persona Hatman, where the hat comes off and something else takes over.",
      },
    ],
    closing: "every performance is a system that runs once",
  },
  {
    type: "colophon",
    label: "Colophon",
    toc: "colophon",
    slug: "colophon",
    lines: [
      { text: "Crafted with intention." },
      { text: "Built on sovereign systems<br/>and transparent tools.", italic: true },
      { text: "dyllan.to \u00B7 MMXXVI", mono: true },
    ],
  },

  // ─── Back cover ───
  {
    type: "cover",
    label: "Back Cover",
    variant: "back",
    slug: "back",
  },
];

/** Content pages (everything between covers) for TOC generation. */
export const tocEntries = pages.map((p, i) => ({ ...p, index: i })).filter((p) => p.toc);

/** Roman numeral page numbers for content pages. */
const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
let contentIndex = 0;
export const pageNumbers = pages.map((p) => (p.type !== "cover" ? ROMAN[contentIndex++] : null));

/** CircuitVine side alternation for content pages (odd index = right, even = left). */
export const vineSide = pages.map((_, i) => (i % 2 === 1 ? "right" : "left"));
