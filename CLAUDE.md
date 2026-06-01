# dyllan-to — Agent Guide

Personal site for Dyllan Justice Tô-Yu. Astro 6 + Svelte 5. Two content collections (`pages`, `writings`), each authored as YAML. No MDX in this project.

## Stack shape

- **Content collections**: both `pages` and `writings` use `glob("**/*.yaml")`. Schemas in `src/lib/page.ts` and `src/lib/writing.ts`.
- **Writing bodies** are structured (blocks + spans + prompts) and rendered by `src/lib/writing.ts:renderBody()` into HTML strings at layout time.
- **Page bodies** are pre-rendered HTML stored verbatim in YAML.
- **`BookLayout.astro`** composes pages + writings into the tome page array. Writings are injected after the `writings` index page so they live as interior chapters of the book.
- **Routing is a projection of content.** `src/pages/[...slug].astro` is the *only* route file; its `getStaticPaths` enumerates every route (root→cover, each published page, `writings/<entry.id>`, `/back`) from the same collections `BookLayout` loads, through the shared `isPublished()` predicate (`src/lib/content.ts`). No per-page shell, no `initialSlug` prop — the Tome reads `window.location.pathname` on mount and flips there. (T11.)
- **One canonical page type.** `src/lib/page.ts` exports `TomePage` (the Zod `Page` + synthesized `sections`/`meta`/`parent`); `BookLayout`, `Tome`, and `ContentPage` all import it — never hand-redeclare the shape.
- **Layout MODE is the `block` discriminant** (`flow`|`epigraph`|`colophon`) on `PageSchema`, guarded by a mandatory `.superRefine`; `ContentPage` switches on `page.block`, not on field presence. Orthogonal slots (`body`/`cards`/`chapter`/`header`/`closing`) still compose within `flow`.
- **Pure geometry/routing.** Flip math (`transformFor`/`transitionFor`/`isFlippedFor`) and path↔index (`indexForPath`/`pathForIndex`) live in `src/lib/{geometry,routing}.ts`, unit-tested via vitest (`pnpm test:unit`); `Tome.svelte` owns the reactive state + flip state machine and calls them with live values.
- **StickyNote** (hover popover for voice-collab spans and `data-preview` links) mounts at shell level in `BookLayout.astro`, so it works everywhere the tome renders.

## Tenets

### T1 — Single-extension content filenames

Astro 6's glob loader derives `entry.id` from the filename with eccentric extension handling. Multi-part extensions like `<slug>.writing.yaml` produce broken ids (e.g., `<slug>writing` without the dot). Keep to `<slug>.yaml`; encode type via directory, not filename.

**Why:** Discovered when atlas writing failed to resolve its route — entry id was `we-fed-machines-an-atlaswriting`. Fixed by renaming.

**How to apply:** One extension per content file. If you need to disambiguate kinds, use directories (`src/content/writings/`, `src/content/pages/`).

### T2 — Pre-render markup in YAML

When the source is conceptually markdown but the project has no MDX integration, store pre-rendered HTML in the YAML body field rather than runtime-parsing markdown. Avoids a parser dependency, keeps the pipeline single-pass, makes cross-file projection trivial.

**Why:** Adding `marked` or using `@astrojs/markdown-remark` at runtime brings back the exact render-path complexity that `experimental_AstroContainer` had — just with a different ceiling.

**How to apply:** For page bodies (plain prose), hand-author HTML (`<p>`, `<h2 id="...">`, `<hr />`, `<ul>`, `<a>`). For writings, use the structured block/span schema — the writing renderer does the work. Do not introduce a markdown parser without a concrete need.

### T3 — `experimental_*` APIs are unsafe for dev HMR paths

`experimental_AstroContainer` is documented for tests and build-time static generation. In a dev server, the container's renderer registry holds stale references after module invalidation, and MDX re-compiles don't propagate — edits cascade into silent 404s until server restart. Do not reach for experimental APIs to bridge format boundaries at request time.

**Why:** This was the root cause of the dev-server HMR 404 that blocked iteration on writings for weeks. Container API was never meant for the hot path.

**How to apply:** If a transform needs to happen at request time, do it via a stable Astro primitive (content collections + typed data + handwritten renderer) or move it to build time. Experimental APIs are for tests and SSG only.

### T4 — Mount global-listener islands at shell level

Svelte (or React) components that listen to document-level events and render overlays conditionally — `StickyNote` is the canonical example — belong in the root layout shell, not in per-route layouts. Route-scoped mounts break when routes are unified under one shell (like writings moving from `PostLayout` to `BookLayout`).

**Why:** Caught when writings moved into the tome — the hover affordance would have gone silently missing had StickyNote stayed in `PostLayout`.

**How to apply:** If a component listens on `window`/`document` and the hover targets can appear on more than one route, mount once in the outermost layout that covers all those routes.

### T5 — Don't stack opacity on already-dim contrast tokens

When `--tome-term-dim` (or any token whose direct contrast against the parchment is already borderline) is rendered with `opacity: 0.4–0.7` at the usage site, the effective ratio drops below WCAG AA without any sign of failure at the token layer. The contrast-token test passes; the rendered chrome silently fails.

**Why:** Discovered during the 2026-05-16 a11y pass — `.attribution { opacity: 0.6 }`, `.page-number { opacity: 0.4 }`, `.toc .meta { opacity: 0.7 }`, and several siblings were all undercutting their declared ratios. The token comments in `guide.css` explicitly call out 5.60/7.46/7.08 contrast values; the opacity-stacking at the call sites silently negated that work.

**How to apply:** If a chrome element needs to feel "less prominent visually," reduce font-weight, increase letter-spacing, or move to a token whose direct-paint ratio is higher (`--tome-ink-light` instead of `--tome-term-dim`). Don't multiply opacity onto a token that's already at the borderline. The `contrast.spec.ts` suite tests token pairs at full opacity; usage-level opacity is invisible to it.

### T6 — `inert` is not a complete axe escape hatch for multi-DOM-page metaphors

The tome renders every leaf in DOM at once and uses `inert` on non-active leaves to hide them from AT. axe-core respects `inert` for ARIA-hidden / focus rules — but **still flags `landmark-is-unique` across inert subtrees**. A `<nav>` landmark on every leaf with the same `aria-label` will fail axe even when 6 of 7 are inert.

**Why:** Discovered when adding `inert` exposed both the cover h1 (page-has-heading-one) and per-leaf nav landmarks (landmark-is-unique) as axe violations that hadn't fired before — because before, axe also wasn't crediting the offscreen leaves as accessible. `inert` correctly hid them; axe correctly demanded uniqueness anyway.

**How to apply:** When the architecture parks N copies of a structural element in DOM (per-leaf TOC, per-page sidebar, etc.), don't lean on `inert` alone to solve uniqueness. Either downgrade the landmark wrapper (`<nav>` → `<div>`; keep semantic interior via links + `aria-current`), or disable the specific axe best-practice rule with reasoning preserved in-file. Both choices are valid; the wrong choice is assuming `inert` already handled it.

### T7 — Hard-coded loop counts in tests rot against additively-evolving structures

`tests/navigation.spec.ts` walks the book via `for (let i = 0; i < 5; i++) page.keyboard.press("ArrowRight")` and asserts arrival at Colophon. That arithmetic was correct when the book had 6 pages. The book is now 7 pages and the test silently lands on "Now" — failing on the assertion text, not the walk count, so the failure mode looks like a regression rather than test rot.

**Why:** Caught during the 2026-05-16 a11y pass when running the full suite. The test predates the addition of the writings index page. The book is additively-evolving (Tenet from parent `CLAUDE.md`: "Additive evolution") — its size will grow again.

**How to apply:** When walking a sequence whose length is data-driven (pages array, writings collection, etc.), derive the target index from the data, not from a hardcoded literal. For book tests: `for (let i = 0; i < pages.length - 1; i++)` or query the live region label after each press and break on match. Same shape generalizes to any "click N times to reach X" test against any append-only structure.

### T8 — Bust `.astro/` after content-schema changes

Astro 6 caches parsed content-collection data in `.astro/data-store.json`, keyed on `content-config-digest`. When you add a field to a collection schema — especially with `.default()` — the digest doesn't always change in a way that triggers re-validation. `getCollection()` returns entries that look correct in the cache file but never expose the new field to consumers. Dev-server restart alone is not enough; the on-disk cache survives.

**Why:** Discovered 2026-05-25 wiring a `draft` flag into `PageSchema`. The cache file showed `"draft": true` for the three drafted entries, but the SSR'd Svelte island's `props=` attribute had zero `"draft"` occurrences for ANY of 11 page entries. Multiple restarts of `pnpm dev` did not fix it. `rm -rf .astro node_modules/.vite` + rebuild did. Sibling memory: `feedback_astro_content_cache_invalidation.md`.

**How to apply:** When a schema field "should" be visible to components but isn't — conditional rendering branches silently not firing, props missing the field in SSR'd island output, defaults appearing where explicit values were set — bust the cache before debugging code:

```
rm -rf .astro node_modules/.vite
```

Then restart dev. If the field appears, the bug was cache invalidation; if it still doesn't, then look at the code. Doing this first saves 10–30 min of wrong-direction debugging.

### T9 — `backface-visibility: hidden` parents ignore z-index for transformed children

A flattening parent with `backface-visibility: hidden` (the tome's `.face`) builds a render surface that **re-sorts any transformed descendant to the bottom of the paint order — z-index and translateZ are both ignored**. So a child that paints on top at rest drops *behind* its siblings the instant it gets a `transform` (even a `:hover` `scale`, even a transform on a nested SVG).

**Why:** The dogear page-turn buttons sit on `.face` and overlap the full-height `.edge-click` strips. At rest the dogear (later in DOM) wins the pointer. On `:hover` its `scale(1.08)` re-sorted it behind `.edge-click` → the pointer landed on `.edge-click` → `mouseleave` → `:hover` reverted → dogear back on top → re-hover. Result: the dogear *pulsed* in and out of hover and felt unclickable. `document.elementFromPoint` at the dogear's own center returned `.edge-click` whenever any transform was applied; `z-index: 999` and `translateZ` did nothing.

**How to apply:** Give the flattening parent its own clean stacking context with `isolation: isolate` — DOM-order stacking is then honored and the transformed child stays on top. (Fixed `.face` in `Tome.svelte`.) Diagnose this class of bug by probing `document.elementFromPoint(cx, cy)` at the element's center while toggling its transform: if a sibling appears under a transform but z-index can't reclaim it, suspect a `backface-visibility: hidden` ancestor, not 2D stacking.

### T10 — `astro:content`'s `z` is value-only and Astro-7-deprecated; import from `astro/zod`

`import { z } from "astro:content"` re-exports zod's `z` as a *value* with no type-space namespace, so `z.infer<typeof Schema>` fails (`Cannot find namespace 'z'`) under a cold type-check — and that cascades into implicit-`any` on every type derived from the schema. Astro's own deprecation note (it's removed in Astro 7) points to `import { z } from "astro/zod"`, which exports `z` as a proper namespace.

**Why:** 11 real `src/` type errors hid behind a warm `.astro` cache; a cold `astro sync && astro check` surfaced 6 `z.infer` namespace errors + 5 cascade implicit-anys, all cleared by the one import swap.

**How to apply:** Import `z` from `astro/zod` (not `astro:content`) wherever you use `z.infer` or schema *types*. And run the type gate cold — `rm -rf .astro node_modules/.vite && pnpm astro sync && pnpm check:ci` — a warm cache lies about type health (see T8).

### T11 — Routes are a projection of content, never hand-mirrored shells

Defining the URL set in two places — hand-written `src/pages/*.astro` shells **and** the runtime `slugs[]` in `Tome.svelte` — drifts silently: `/story` 404s, every `/writings/<id>` permalink 404s the instant it un-drafts, and nothing fails loudly. The fix is a single `[...slug].astro` whose `getStaticPaths` enumerates from the collections through the *shared* `isPublished()` predicate.

**Why:** The pre-refactor site shipped exactly this split-brain — this very file once described a `[slug].astro` with `initialSlug` that was never built.

**How to apply:** Never add a per-page `.astro` shell. Routes derive from data via `src/pages/[...slug].astro`. Its `getStaticPaths` filter MUST be byte-identical to `BookLayout`'s — both call `src/lib/content.ts:isPublished`. Use `entry.id` (the filename), never the decorative `data.id`. Bust `.astro/` after (T8).

### T12 — A global `@keyframes` in `guide.css` gets tree-shaken if nothing references it

A bare `@keyframes` in a global stylesheet with no in-file `animation:` consumer is dropped by the production CSS minifier — the animation works in dev and silently dies in `dist`. (Cousin of T2/T3: a build step that strips "unused" CSS can't see that a *component* references the keyframe.)

**Why:** Relocating `sigilPulse` from `Tome.svelte` to `guide.css` (to fix a cross-component orphan) made the minifier tree-shake it; CoverPage stopped pulsing only in the built site.

**How to apply:** Co-locate a keyframe with its sole consuming component, using Svelte's `-global-` prefix (`@keyframes -global-name`) so it's emitted globally yet kept referenced by that component's `animation:`. If a keyframe truly must live in `guide.css`, ensure something in that file references it.

### T13 — Fault-isolate content rendering at the compose boundary (dev-soft / CI-hard)

`renderBody` throws on a bad span/voice/prompt ref or a cycle. Called unguarded in `BookLayout`'s injection loop, one content typo aborts the entire static build for *every* route — violating the parent vault's defense-in-depth tenet (the fallback should be simpler, not absent).

**Why:** A single bad `{s:id}` in any one writing reddened `astro build` site-wide.

**How to apply:** Wrap per-item content rendering in try/catch at the composition boundary. Re-throw under `import.meta.env.PROD` so the build stays the publish gate (fail visibly); in dev, degrade to a loud, escaped error card naming the item + a `biome-ignore`-reasoned `console.warn`. The fallback is a static error string, not another system.

## Conventions

- **File naming**: `<slug>.yaml` for both pages and writings. Pages have a numeric prefix for sort (`00-cover-front.yaml` … `07-colophon.yaml`). Writings use a kebab-case slug; the route key is `entry.id` (the filename), not the decorative `id` field.
- **Writing schema**: `src/lib/writing.ts`. Blocks (paragraph/legend/separator) reference spans via `{s:id}` placeholders. Spans reference prompts by id. See also `justice/craft/voice-attribution.md` for authoring rules and the `/write` skill for the chat-time workflow.
- **Page schema**: `src/lib/page.ts`. Frontmatter-rich; optional HTML body; sections auto-extracted from `h2[id]` for TOC nesting. Layout MODE is the `block` enum (`flow`|`epigraph`|`colophon`) guarded by a `.superRefine`; this file also exports the canonical `TomePage` type.
- **Routing**: `src/pages/[...slug].astro` — one catch-all `getStaticPaths` projects every route from the collections (T11); `src/pages/rss.xml.ts` is the writings feed. `src/lib/content.ts:isPublished` is the shared draft filter.
- **Tome composition**: `src/layouts/BookLayout.astro`. Page order follows the numeric prefix; writings are injected after the writings-index page in descending-date order, each carrying `parent: "writings"` so the TOC nests them (not slug-prefix magic).
- **Testing**: `pnpm test:unit` (vitest — pure geometry/routing in `src/lib`); `pnpm test:a11y` (axe + contrast); `pnpm test` (full Playwright — run `--workers=1`; the `@vision` specs flake under preview-server contention).
- **Commit style**: inherits the project's mythic S-V-O register (see parent `CLAUDE.md`).
