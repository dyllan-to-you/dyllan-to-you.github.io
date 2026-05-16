# dyllan-to — Agent Guide

Personal site for Dyllan Justice Tô-Yu. Astro 6 + Svelte 5. Two content collections (`pages`, `writings`), each authored as YAML. No MDX in this project.

## Stack shape

- **Content collections**: both `pages` and `writings` use `glob("**/*.yaml")`. Schemas in `src/lib/page.ts` and `src/lib/writing.ts`.
- **Writing bodies** are structured (blocks + spans + prompts) and rendered by `src/lib/writing.ts:renderBody()` into HTML strings at layout time.
- **Page bodies** are pre-rendered HTML stored verbatim in YAML.
- **`BookLayout.astro`** composes pages + writings into the tome page array. Writings are injected after the `writings` index page so they live as interior chapters of the book.
- **`[slug].astro`** for writings renders `BookLayout` with `initialSlug` set — the direct URL loads the tome at that writing's page, not a separate scroll view.
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

## Conventions

- **File naming**: `<slug>.yaml` for both pages and writings. Pages have numeric prefix for sort (`00-cover-front.yaml` … `06-colophon.yaml`). Writings use kebab-case slug.
- **Writing schema**: `src/lib/writing.ts`. Blocks (paragraph/legend/separator) reference spans via `{s:id}` placeholders. Spans reference prompts by id. See also `justice/craft/voice-attribution.md` for authoring rules and the `/write` skill for the chat-time workflow.
- **Page schema**: `src/lib/page.ts`. Frontmatter-rich; optional HTML body; sections auto-extracted from `h2[id]` for TOC nesting.
- **Tome composition**: `src/layouts/BookLayout.astro`. Page order follows the numeric prefix; writings are injected after the writings-index page in descending-date order.
- **Commit style**: inherits the project's mythic S-V-O register (see parent `CLAUDE.md`).
