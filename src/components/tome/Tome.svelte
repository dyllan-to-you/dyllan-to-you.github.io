<!--
  §7 — Book Engine

  Manages flip state, 3D transforms, depth ordering, and input handling.
  Receives page data as a prop from the Astro layout (content collection).

  Renders in two modes based on viewport orientation:
    Landscape: two-page spread, rotateY around left edge. TOC on verso.
    Portrait:  single-page full-screen, rotateX around top edge. TOC in drawer.

  Mental model: a stack of leaves. `flipped` is how many have been turned.
  All navigation is goTo(target).

  Depth ordering: translateZ within a preserve-3d context. No z-index on
  leaves. Depth transitions with the flip for natural cascading.
-->
<script lang="ts">
import { onDestroy, onMount } from "svelte";
import ContentPage from "./ContentPage.svelte";
import CoverPage from "./CoverPage.svelte";
import Dogear from "./Dogear.svelte";
import TocPage from "./TocPage.svelte";
import { interaction, layout, timing } from "./tokens.ts";

interface PageData {
  slug: string;
  order: number;
  label: string;
  toc?: string;
  pageLayout: "cover" | "content";
  variant?: "front" | "back";
  chapter?: { number: string; title: string; subtitle?: string };
  backFace?: "cover";
  body?: string;
  prompt?: string;
  quote?: string;
  attribution?: string;
  lines?: { text: string; italic?: boolean; mono?: boolean }[];
  cards?: { name: string; description: string }[];
  header?: string;
  closing?: string;
}

let { pages }: { pages: PageData[] } = $props();

/* ═══════════════════════════════════════════════
     Derived page data
  ═══════════════════════════════════════════════ */

const tocEntries = pages.map((p, i) => ({ ...p, index: i })).filter((p) => p.toc);

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
let contentIndex = 0;
const pageNumbers = pages.map((p) => (p.pageLayout !== "cover" ? ROMAN[contentIndex++] : null));

const vineSide = pages.map((_, i) => (i % 2 === 1 ? "right" : "left"));

/* ═══════════════════════════════════════════════
     Constants
  ═══════════════════════════════════════════════ */

const total = pages.length;
const DEPTH = 2;
const DEPTH_OVERLAY = (total + 1) * DEPTH;
const DEPTH_UI = (total + 2) * DEPTH;

/* ═══════════════════════════════════════════════
     Engine state
  ═══════════════════════════════════════════════ */

let isPortrait = $state(false);
let flipped = $state(0);
let animation = $state(null);
let timer: ReturnType<typeof setTimeout> | undefined;
let tocOpen = $state(false);
let suppressPush = false;
let wrapperEl = $state(null);

/* ─── Derived ─── */

let bookOpen = $derived(!isPortrait && flipped > 0 && flipped < total);
let busy = $derived(animation !== null);

let landscapeOffset = $derived.by(() => {
  if (isPortrait) return "0px";
  if (flipped === 0) return "-25%";
  if (flipped >= total) return "25%";
  return "0px";
});

let currentPageLabel = $derived.by(() => {
  if (isPortrait) {
    const idx = Math.min(flipped, total - 1);
    return `Page ${flipped + 1} of ${total}: ${pages[idx].label}`;
  }
  if (flipped >= total) return "Book closed (back)";
  if (flipped === 0) return "Front Cover";
  return pages[flipped]?.label || `Page ${flipped}`;
});

/* ─── Orientation ─── */

$effect(() => {
  const check = () => {
    isPortrait = window.innerWidth < window.innerHeight;
  };
  check();
  window.addEventListener("resize", check);
  return () => window.removeEventListener("resize", check);
});

let previousPortrait = isPortrait;

$effect(() => {
  const current = isPortrait;
  if (previousPortrait === current) return;
  previousPortrait = current;
  animation = null;
  tocOpen = false;
  clearTimeout(timer);
});

/* ═══════════════════════════════════════════════
     URL routing
  ═══════════════════════════════════════════════ */

const slugs = pages.map((p) => p.slug ?? "");

// "back" is a virtual slug: the closed-back state (flipped === total).
// It has no page in the registry — the back cover is the verso of the
// colophon leaf — but direct-linking to /back is still useful.
const BACK_SLUG = "back";

function indexForPath(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  if (clean === "") return 0;
  if (clean === BACK_SLUG) return total;
  const found = slugs.indexOf(clean);
  return found === -1 ? 0 : found;
}

function pathForIndex(i) {
  if (i === total) return `/${BACK_SLUG}`;
  const slug = slugs[i];
  return slug ? `/${slug}` : "/";
}

onMount(() => {
  // Initial sync: if the URL points past the cover, animate the
  // cascading flip from cover to target. goTo's stagger logic
  // showcases each leaf as it turns. pushState is skipped because
  // the URL already matches the target.
  const initialIdx = indexForPath(window.location.pathname);
  if (initialIdx !== flipped) {
    goTo(initialIdx);
  }

  const onPop = () => {
    const idx = indexForPath(window.location.pathname);
    if (idx !== flipped) {
      suppressPush = true;
      goTo(idx);
    }
  };
  window.addEventListener("popstate", onPop);
  return () => window.removeEventListener("popstate", onPop);
});

/* ═══════════════════════════════════════════════
     Navigation
  ═══════════════════════════════════════════════ */

function goTo(target) {
  if (busy) return;
  if (target === flipped || target < 0 || target > total) return;

  const forward = target > flipped;
  const from = Math.min(flipped, target);
  const to = Math.max(flipped, target) - 1;
  const steps = to - from + 1;
  const staggerMs = steps > 1 ? timing.flipMs * 0.35 : 0;

  animation = { from, to, forward, startFlipped: flipped, staggerMs };
  flipped = target;
  tocOpen = false;

  // Sync URL (skipped when called from popstate to avoid loops)
  if (typeof window !== "undefined") {
    if (suppressPush) {
      suppressPush = false;
    } else {
      const newPath = pathForIndex(target);
      if (window.location.pathname !== newPath) {
        history.pushState(null, "", newPath);
      }
    }
  }

  clearTimeout(timer);
  timer = setTimeout(
    () => {
      animation = null;
    },
    timing.flipMs + staggerMs + 50,
  );
}

function goForward() {
  goTo(flipped + 1);
}
function goBack() {
  goTo(flipped - 1);
}

/* ═══════════════════════════════════════════════
     Per-leaf calculations
  ═══════════════════════════════════════════════ */

function isAnimating(i) {
  return animation && i >= animation.from && i <= animation.to;
}

function isFlippedFor(i) {
  if (isAnimating(i)) return i < flipped;
  return animation ? i < animation.startFlipped : i < flipped;
}

function transformFor(i) {
  const onLeft = isFlippedFor(i);
  const depth = (onLeft ? i : total - i) * DEPTH;
  if (isPortrait) {
    const angle = onLeft ? 180 - i * 0.4 : 0;
    return `translateZ(${depth}px) rotateX(${angle}deg)`;
  }
  const rotation = onLeft ? "rotateY(-180deg)" : "rotateY(0deg)";
  return `translateZ(${depth}px) ${rotation}`;
}

function transitionFor(i) {
  if (!isAnimating(i)) return "none";
  const { from, to, forward, staggerMs } = animation;
  const steps = to - from;
  const pos = forward ? i - from : to - i;
  const delay = steps > 0 ? (pos / steps) * staggerMs : 0;
  return `transform ${timing.flipMs}ms ${timing.flipEase} ${delay}ms`;
}

/* ═══════════════════════════════════════════════
     Input handlers
  ═══════════════════════════════════════════════ */

function handleClick() {
  if (busy) return;
  if (flipped === 0) {
    goTo(1);
    return;
  }
  if (flipped >= total) {
    goTo(total - 1);
  }
}

let touchStart = { x: 0, y: 0 };

function handleTouchStart(event) {
  touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
}

function handleTouchEnd(event) {
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  const delta = isPortrait ? -dy : -dx;
  const cross = isPortrait ? Math.abs(dx) : Math.abs(dy);
  if (Math.abs(delta) < interaction.swipeThreshold) return;
  if (cross > Math.abs(delta)) return;
  delta > 0 ? goForward() : goBack();
}

function handleKeydown(event) {
  if (["ArrowRight", " ", "ArrowDown"].includes(event.key)) {
    event.preventDefault();
    goForward();
  }
  if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    goBack();
  }
}

function handleWheel(event) {
  // If the wheel target is inside a scroll-area that can still scroll
  // in the wheel direction, let native scroll handle it.
  const scrollEl = event.target.closest?.(".scroll-area");
  if (scrollEl) {
    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    const atTop = scrollTop <= 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
    const scrollingDown = event.deltaY > 0;
    if (!(scrollingDown ? atBottom : atTop)) return;
  }

  event.preventDefault();
  if (busy) return;
  if (event.deltaY > 0 || event.deltaX > 0) goForward();
  else if (event.deltaY < 0 || event.deltaX < 0) goBack();
}

/* Wheel must be non-passive so we can conditionally preventDefault
   (scroll-area content vs page flip). Svelte 5 binds wheel as passive
   by default, so we use $effect + addEventListener. */
$effect(() => {
  if (!wrapperEl) return;
  wrapperEl.addEventListener("wheel", handleWheel, { passive: false });
  return () => wrapperEl.removeEventListener("wheel", handleWheel);
});

onDestroy(() => clearTimeout(timer));
</script>


<!-- ═══════════════════════════════════════════════
     Template
     ═══════════════════════════════════════════════ -->

<svelte:window onkeydown={handleKeydown}/>

<div
  class="tome-root"
  class:portrait={isPortrait}
  role="region"
  aria-label="Interactive book"
  aria-roledescription="book"
>
  <div class="sr-only" aria-live="polite" aria-atomic="true">
    {currentPageLabel}
  </div>

  <div
    class="wrapper"
    bind:this={wrapperEl}
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
    role="presentation"
  >
    <div
      class="perspective"
      style:width={isPortrait ? layout.portraitW : layout.landscapeW}
      style:height={isPortrait ? layout.portraitH : layout.landscapeH}
      style:perspective={isPortrait ? layout.portraitPerspective : layout.landscapePerspective}
      style:perspective-origin={isPortrait ? layout.portraitEye : layout.landscapeEye}
      style:transform="translateX({landscapeOffset})"
    >
      {#if !isPortrait}
        {#if bookOpen}
          <div
            class="binding-shadow"
            style:transform="translateX(-50%) translateZ({DEPTH_OVERLAY}px)"
            aria-hidden="true"
          ></div>
        {/if}
        <!-- Static right-side paper backdrop. Hidden during the
             open-from-closed-back animation so the right side reads
             as "interior not yet revealed" (void) rather than
             "blank paper page" while the back cover rotates away. -->
        {#if flipped < total && !(animation && animation.startFlipped === total)}
          <div class="static-right">
            <div class="page-edge" aria-hidden="true"></div>
          </div>
        {/if}
      {/if}


      <!-- ─── LEAVES ─── -->
      {#each pages as page, i (i)}
        {@const leafFlipped = isFlippedFor(i)}
        <div
          class="leaf"
          class:portrait-leaf={isPortrait}
          class:landscape-leaf={!isPortrait}
          style:transform={transformFor(i)}
          style:transition={transitionFor(i)}
          role="group"
          aria-label={page.label}
        >
          <!-- Front face -->
          <div
            class="face front"
            class:recto={!isPortrait}
            class:shadow-right={!leafFlipped}
          >
            {#if page.pageLayout === 'cover'}
              <CoverPage variant={page.variant}/>
            {:else}
              <ContentPage {page} number={pageNumbers[i]} vine={vineSide[i]}/>
              <button class="edge-click edge-back" type="button" onclick={goBack} disabled={busy} tabindex="-1" aria-hidden="true"></button>
              <button class="edge-click edge-fwd" type="button" onclick={goForward} disabled={busy} tabindex="-1" aria-hidden="true"></button>
              <Dogear direction="forward" onclick={goForward} disabled={busy}/>
            {/if}
          </div>

          <!-- Back face -->
          {#if isPortrait}
            <div class="face back-x">
              <div class="paper-back"></div>
            </div>
          {:else}
            <div class="face back-y verso" class:shadow-left={leafFlipped}>
              {#if page.backFace === 'cover'}
                <CoverPage variant="back"/>
              {:else}
                <TocPage {tocEntries} activePage={i + 1} onNavigate={goTo} onFlipBack={goBack}/>
                <button class="edge-click edge-back" type="button" onclick={goBack} disabled={busy} tabindex="-1" aria-hidden="true"></button>
                <button class="edge-click edge-fwd" type="button" onclick={goForward} disabled={busy} tabindex="-1" aria-hidden="true"></button>
                <Dogear direction="back" onclick={goBack} disabled={busy}/>
              {/if}
            </div>
          {/if}
        </div>
      {/each}


      <!-- Open/close affordance -->
      {#if flipped === 0 || flipped >= total}
        <!-- Closed (front cover or back cover): click anywhere to (re-)open -->
        <div
          class="click-zone"
          style:transform="translateZ({DEPTH_UI}px)"
          onclick={handleClick}
          onkeydown={(e) => { if (e.key === 'Enter') handleClick(); }}
          role="button"
          tabindex="0"
          aria-label={flipped === 0 ? 'Click to open the book' : 'Click to re-open the book'}
        ></div>
      {/if}
    </div>


    <!-- Portrait: TOC handle sits on the peeking sliver above the book -->
    {#if isPortrait && flipped > 0}
      <button
        class="toc-handle"
        onclick={() => { tocOpen = !tocOpen; }}
        aria-expanded={tocOpen}
        aria-controls="portrait-toc"
      >
        <span class="toc-handle-icon" class:open={tocOpen}>▾</span>
        <span class="toc-handle-label">{tocOpen ? 'close' : 'contents'}</span>
      </button>
    {/if}

    <!-- Portrait: TOC drawer drops down over the book -->
    {#if isPortrait}
      <div
        id="portrait-toc"
        class="toc-drawer"
        class:open={tocOpen}
      >
        <TocPage {tocEntries} activePage={flipped} onNavigate={goTo} onFlipBack={() => { tocOpen = false; }}/>
      </div>
    {/if}

    <!-- Portrait: page indicator -->
    {#if isPortrait && !tocOpen}
      <div class="page-indicator">
        {flipped} / {total}
      </div>
    {/if}

    {#if !isPortrait && !bookOpen}
      <div class="hint" aria-hidden="true">
        click to open
      </div>
    {/if}
  </div>

  <div class="ambient-glow" aria-hidden="true"></div>
</div>


<style>
  @keyframes -global-sigilPulse {
    0%, 100% { filter: drop-shadow(0 0 8px rgba(201, 168, 76, 0.2)); }
    50% { filter: drop-shadow(0 0 16px rgba(201, 168, 76, 0.4)); }
  }

  .tome-root {
    width: 100vw; min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 0; box-sizing: border-box;
    user-select: none;
    background: var(--tome-bg-void);
    font-family: var(--tome-font-fallback);
  }

  .tome-root.portrait {
    padding: 36px 4px 4px;
    justify-content: flex-start;
  }

  .wrapper { position: relative; }

  .perspective {
    position: relative;
    transform-style: preserve-3d;
    transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ─── Leaf ─── */
  .leaf {
    position: absolute; top: 0;
    transform-style: preserve-3d;
  }

  .portrait-leaf {
    left: 0; width: 100%; height: 100%;
    transform-origin: center top;
  }

  .landscape-leaf {
    left: 50%; width: 50%; height: 100%;
    transform-origin: left center;
  }

  /* ─── Face ─── */
  .face {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    overflow: hidden; border-radius: 3px;
  }

  .back-x { transform: rotateX(180deg); }
  .back-y { transform: rotateY(180deg); }

  .paper-back {
    width: 100%; height: 100%;
    background: var(--tome-bg-paper);
  }

  .recto  { border-radius: 0 3px 3px 0; }
  .verso  { border-radius: 3px 0 0 3px; }

  .shadow-right  { box-shadow: 3px 0 12px rgba(0,0,0,0.15); }
  .shadow-left   { box-shadow: -3px 0 12px rgba(0,0,0,0.15); }

  /* ─── Landscape panels ─── */
  .binding-shadow {
    position: absolute;
    top: 0; left: 50%;
    width: 24px; height: 100%;
    pointer-events: none;
    background: linear-gradient(90deg,
      transparent, rgba(0,0,0,.05) 35%,
      rgba(0,0,0,.07) 50%, rgba(0,0,0,.05) 65%,
      transparent
    );
  }

  .static-right {
    position: absolute;
    top: 0; right: 0;
    width: 50%; height: 100%;
    overflow: hidden;
    border-radius: 0 3px 3px 0;
    background: var(--tome-bg-paper);
  }

  .page-edge {
    position: absolute;
    top: 4px; bottom: 4px; left: 0;
    width: 4px;
    background: repeating-linear-gradient(
      to bottom,
      rgba(0,0,0,.03),
      rgba(0,0,0,.03) 1px,
      rgba(255,255,255,.04) 1px,
      rgba(255,255,255,.04) 2px
    );
    border-radius: 1px 0 0 1px;
  }

  /* ─── Click zones ─── */
  .click-zone {
    position: absolute; inset: 0;
    cursor: pointer;
  }

  .click-zone:focus-visible {
    outline: 2px solid rgba(201, 168, 76, 0.6);
    outline-offset: 4px;
    border-radius: 3px;
  }

  /* ─── Padding-edge click zones ─── */
  .edge-click {
    position: absolute;
    top: 0; bottom: 0;
    width: 32px;
    padding: 0; margin: 0;
    background: transparent;
    border: none;
    cursor: pointer;
  }

  .edge-back { left: 0; }
  .edge-fwd { right: 0; }

  .edge-click:disabled { cursor: default; }

  /* Portrait uses swipe + TOC drawer, not dogears/edge-clicks */
  .portrait :global(.dogear),
  .portrait .edge-click { display: none; }

  /* ─── Portrait TOC ─── */
  .toc-handle {
    position: absolute;
    top: -26px; left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 20px 10px;
    background: var(--tome-bg-paper);
    border: none;
    border-radius: 6px 6px 0 0;
    cursor: pointer;
    font-family: var(--tome-font-mono);
    color: var(--tome-term-green);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    opacity: 0.92;
    transition: opacity 0.2s;
    z-index: 12;
  }

  .toc-handle:hover,
  .toc-handle:focus-visible { opacity: 1; }

  .toc-handle-icon {
    display: inline-block;
    transition: transform 0.25s;
    font-size: 0.7rem;
    line-height: 1;
  }

  .toc-handle-icon.open {
    transform: rotate(180deg);
  }

  .toc-drawer {
    position: absolute;
    top: 0; left: 0; right: 0;
    max-height: 0;
    overflow: hidden;
    border-radius: 0 0 6px 6px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 11;
    background: var(--tome-bg-paper);
  }

  .toc-drawer.open {
    max-height: 70vh;
  }

  /* ─── Portrait page indicator ─── */
  .page-indicator {
    text-align: center;
    margin-top: 8px;
    font-family: var(--tome-font-mono);
    color: var(--tome-gold);
    font-size: 0.6rem;
    opacity: 0.3;
    letter-spacing: 0.15em;
  }

  .hint {
    text-align: center; margin-top: 8px;
    font-family: var(--tome-font-body);
    color: var(--tome-gold);
    font-size: 0.7rem; opacity: 0.3;
    letter-spacing: 0.1em;
  }

  .ambient-glow {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 600px; height: 400px;
    pointer-events: none; z-index: 0;
    background: radial-gradient(ellipse, rgba(201, 168, 76, 0.03) 0%, transparent 70%);
  }
</style>
