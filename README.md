# Technomagyck Tome — dyllan.to

A 3D page-flipping personal website rendered as a solarpunk leather tome. Astro 6 (static) + Svelte 5.

- **Landscape**: two-page book spread, right-to-left page flip (`rotateY` around the left edge)
- **Portrait**: single-page flipbook, bottom-to-top flip (`rotateX` around the top edge)
- Keyboard, click, touch/swipe, and horizontal-wheel input
- CSS 3D transforms; depth via `translateZ` in a `preserve-3d` stack (no per-leaf `z-index`)
- Routes are a **projection of the content collections** — one catch-all generator, no hand-maintained shells
- Accessible: ARIA roles, `aria-live` page announcements, `inert` offscreen leaves, focus-visible, keyboard-scrollable prose, WCAG-AA contrast

## Getting Started

```bash
cd dyllan-to
pnpm install
pnpm dev
```

`pnpm build` → `pnpm preview` to exercise the production (draft-filtered, statically-generated) build.

## File Structure

```
src/
  pages/
    [...slug].astro      The SINGLE route generator. getStaticPaths projects every
                         route from the pages + writings collections (root→cover,
                         each published page, writings/<id>, /back). No hand shells.
    rss.xml.ts           RSS feed over the writings collection.
  layouts/
    BookLayout.astro     Composition: loads both collections, injects writings after
                         the writings-index leaf, builds the tome page array, renders
                         per-route <head> (title/description/OG/canonical), mounts the
                         Tome + StickyNote islands. Fault-isolates each writing render.
  lib/
    page.ts              PageSchema (+ `block` discriminant + .superRefine) + the
                         canonical TomePage type + extractSections().
    writing.ts           WritingSchema + renderBody() — voice-attributed blocks/spans.
    content.ts           isPublished() — the single shared draft predicate.
    geometry.ts          Pure leaf-geometry math (transformFor/transitionFor/…). Unit-tested.
    routing.ts           Pure path ⇄ leaf-index (indexForPath/pathForIndex). Unit-tested.
    html.ts              Shared escapeHtml().
  components/tome/
    tokens.ts            JS engine tokens (timing, layout, interaction).
    Tome.svelte          Book engine: flip state machine, 3D transforms, input, URL
                         routing (pushState/popstate), focus management, orientation.
    ContentPage.svelte   Content-leaf renderer (layout MODE driven by page.block).
    TocPage.svelte       Table of contents (landscape verso + portrait drawer; nests
                         child pages under the parent named by their `parent` field).
    CoverPage.svelte     Front/back cover (owns the sigilPulse keyframe).
    CoverSigil.svelte    Geometric/organic central emblem.
    CircuitVine.svelte   Circuit-trace vine border decoration.
    CornerOrnament.svelte  Corner flourish.
    ChapterHeader.svelte   Chapter opener (number, title, subtitle).
    PageNumber.svelte    Roman page number.
    ProjectCard.svelte   Card (permalink href → in-app flip when it maps to a leaf).
    Dogear.svelte        Page-turn corner button.
  components/post/
    StickyNote.svelte    Shell-level overlay island — document hover/focus listener for
                         voice-collab prompt strips + data-preview link previews.
  content/
    pages/*.yaml         The 8 book pages (numeric-prefixed for order).
    writings/*.yaml      Voice-attributed essays (injected as interior chapters).
  styles/guide.css       CSS-custom-property design tokens + reduced-motion + voice CSS.

tests/
  *.spec.ts              Playwright: accessibility (axe), contrast (pure-data WCAG),
                         navigation, visual/screenshot.
  ../src/lib/*.test.ts   vitest unit tests for geometry.ts + routing.ts (pnpm test:unit).
```

Dependency graph: `tokens.ts + lib/{geometry,routing,content,html,page,writing} <- atoms/decorations <- ContentPage/TocPage <- Tome.svelte <- BookLayout.astro <- [...slug].astro`

## Key Design Decisions

**Routes are a projection of content.** `src/pages/[...slug].astro`'s `getStaticPaths` enumerates every route from the same `getCollection('pages')` + `getCollection('writings')` calls `BookLayout` composes from — through the single shared `isPublished()` predicate (`src/lib/content.ts`). So the generated route set and the rendered page set cannot drift: adding a page or un-drafting a writing arms a working permalink, never a 404. (See CLAUDE.md T12.)

**Layout MODE is an explicit discriminant.** A content leaf's interior layout is `page.block` (`flow` | `epigraph` | `colophon`), not inferred from field presence. A mandatory Zod `.superRefine` aborts the build with a named error if the content contradicts the tag; the orthogonal slots (`body`/`cards`/`chapter`/`header`/`closing`) still compose within `flow`.

**No `overflow:hidden` on page roots.** That property inside a `preserve-3d` context flattens 3D rendering. Clipping is handled by the leaf face wrappers in `Tome.svelte`.

**Transitions gated per-leaf.** CSS transitions are `"none"` unless a leaf is mid-flip — eliminates the orientation-switch race and avoids transitioning idle leaves. The teardown timer is keyed to `flipMs + staggerMs` (the real longest leaf delay), not a magic constant.

**Pure geometry, testable.** The flip math (`transformFor`/`transitionFor`/`isFlippedFor`) and path↔index routing live in pure `src/lib/{geometry,routing}.ts` with vitest coverage; `Tome.svelte` keeps the reactive state + flip state machine and calls them with live values.

**Build fault-isolation.** One bad `{s:id}`/voice/prompt ref degrades to a loud error card in dev and hard-aborts the build in prod (dev-soft / CI-hard) — a single content typo can't silently ship or nuke the whole site. (CLAUDE.md T13.)

**Per-route social surface.** `<head>` emits OG/Twitter/canonical tags driven by each route's own data, so a shared link unfurls as itself, not the cover.

**Font loading in Astro.** Fonts load via `<link>` with `preconnect` in `BookLayout`, not injected at runtime.

**Svelte 5 idioms.** Runes throughout (`$state`/`$derived`/`$props`/`$effect`); direct component rendering; no `svelte:component`.

## Accessibility

```bash
pnpm test:a11y     # axe + contrast
pnpm test:unit     # vitest (geometry + routing)
pnpm test          # full Playwright suite (run serially: --workers=1)
```

- **`tests/accessibility.spec.ts`** — `@axe-core/playwright` against the **real generated route set**, asserting each route 200s before scanning (a 404 fails loudly, not silently). Two rules are disabled with in-file reasoning: `aria-hidden-focus` (offscreen leaves are intentionally hidden) and `page-has-heading-one` (the canonical h1 lives on the cover leaf, inert on non-cover routes — the book metaphor defeats the heuristic).
- **`tests/contrast.spec.ts`** — pure-data check that every rendered `--tome-*` foreground/background pair meets its declared WCAG ratio at the size it's used (caption-size meta → AA body 4.5:1). Runs offline.

Architectural notes:

- Non-active leaves carry `inert` so screen readers don't linearize the entire book.
- `prefers-reduced-motion` is honored via global CSS overrides + JS short-circuits in `Tome.svelte` (`transitionFor()` returns `"none"`; `scrollIntoView` switches to `"auto"`).
- Inside a focused `.scroll-area`, vertical arrows + space yield to native scroll; only horizontal arrows flip — long prose stays keyboard-scrollable.
- `StickyNote.svelte` mirrors `mouseover/mouseout` with `focusin/focusout` + an `aria-live` region so the prompt affordance is keyboard-reachable.

## Deploy

```bash
npx astro add netlify   # or vercel, cloudflare, etc.
pnpm build
```

`output: 'static'` is pinned in `astro.config.mjs`; the build produces a static site with only the Svelte tome + StickyNote islands hydrated.

> Known trade-off (deferred): every route ships the whole composed book (~3.1 MB) because the Tome island owns all leaves for the flip. A content-first inversion / per-route weight trim is gated on real traffic — see the parent vault's `dyllan-to.refactor.plan.md`.
