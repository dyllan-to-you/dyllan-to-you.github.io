# Technomagyck Tome — dyllan.to

A 3D page-flipping personal website rendered as a solarpunk leather tome. Built with Astro + Svelte 5.

- **Landscape**: two-page book spread, right-to-left page flip (rotateY)
- **Portrait**: single-page flipbook, bottom-to-top flip (rotateX)
- Deterministic position mapping between orientations
- Keyboard, click, and touch/swipe input
- CSS 3D transforms with GPU compositing (willChange only on animating leaf)
- Fully accessible: ARIA roles, live region announcements, focus-visible, 44px touch targets

## Getting Started

```bash
cd dyllan-to
npm install
npm run dev
```

## File Structure

```
src/
  pages/
    index.astro              Astro shell (font loading, meta, hydration)
  components/tome/
    tokens.js              §1  Design tokens (colors, fonts, timing, layout, z-index)
    Tome.svelte            §7  Book engine (flip state, 3D transforms, input handling)
    CircuitVine.svelte     §3  Circuit-trace vine border decoration
    CoverSigil.svelte      §3  Geometric/organic central emblem
    CornerOrnament.svelte  §3  Corner flourish (4 rotations)
    PageNumber.svelte      §4  Centered page number at bottom
    ProjectCard.svelte     §4  Project name + description card
    ChapterHeader.svelte   §4  Chapter opener (number, title, subtitle, divider)
    PaperBlank.svelte      §5  Blank paper page (endpapers, fillers)
    CoverPage.svelte       §5  Front cover
    EpigraphPage.svelte    §5  "Assert nothing. Derive everything."
    PhilosophyPage.svelte  §5  Philosophy + Practice
    ArchitectPage.svelte   §5  Chapter I — The Architect
    CoreProjectsPage.svelte §5 Ur, Faewyld, Ludex cards
    WorksPage.svelte       §5  Chapter II — Locus, Verve, Toast cards
    FrequenciesPage.svelte §5  Chapter III — Music and performance
    ColophonPage.svelte    §5  Closing inscription
    BackCover.svelte       §5  Back cover
```

Dependency graph: `tokens.js <- decorations <- atoms <- pages <- Tome.svelte`

## Key Design Decisions

**No overflow:hidden on page roots.** That CSS property inside a `preserve-3d` context forces the browser to flatten 3D rendering. Clipping is handled by the leaf face wrappers in Tome.svelte.

**Transitions gated per-leaf.** CSS transitions are `"none"` unless a specific leaf is mid-flip. This eliminates the orientation-switch animation race condition and avoids applying transitions to non-animating leaves.

**Deterministic orientation mapping.** Lookup tables (not proportional math) map between portrait and landscape positions. Each entry is hand-verified against the content layout.

**willChange only on animating leaf.** Permanent `will-change: transform` wastes GPU memory. Only the leaf currently mid-flip gets GPU compositing.

**Font loading in Astro.** Fonts are loaded via `<link>` in `index.astro` with `preconnect`, not injected via `{@html}` at runtime. This avoids duplicate `<style>` elements and enables browser-level preloading.

**Svelte 5 idioms.** Direct component rendering (`<Page />`), `$derived.by()` for complex derivations, `$props()` throughout. No `svelte:component`.

## Accessibility

Run the accessibility suite on its own:

```bash
pnpm test:a11y
```

Two checks fire:

- **`tests/accessibility.spec.ts`** — runs `@axe-core/playwright` against every published route. Covers ARIA, landmarks, alt text, heading order, focus management, and color contrast on real rendered DOM. Two rules are explicitly disabled and the reasoning is in-file: `aria-hidden-focus` (the tome's offscreen leaves are intentionally hidden) and `page-has-heading-one` (the book's canonical h1 lives on the cover leaf, which is inert on non-cover routes; the book metaphor defeats this best-practice heuristic).
- **`tests/contrast.spec.ts`** — pure-data check that every `--tome-*` foreground/background pair we actually render meets its declared WCAG ratio (4.5:1 body, 3:1 large). Runs offline; sub-second.

Architectural notes:

- Non-active leaves carry `inert` so screen readers don't linearize the entire vault as one document.
- `prefers-reduced-motion` is honored both via global CSS overrides and JS short-circuits in `Tome.svelte` (`transitionFor()` returns `"none"`, `scrollIntoView` switches to `"auto"`).
- The hover-revealed prompt strip and link preview in `StickyNote.svelte` mirror their `mouseover/mouseout` listeners with `focusin/focusout` so keyboard users get the same affordance, with an `aria-live` region announcing the prompt text.
- The scroll-area on each content page is `tabindex="0"` (keyboard-scrollable for prose pages with no inner focusable content); inert leaves still exclude their scroll-area from Tab order.

## Deploy

```bash
npx astro add netlify   # or vercel, cloudflare, etc.
npm run build
```

Astro with `output: 'static'` (default) produces a zero-JS-overhead static site with only the Svelte tome island hydrated.
