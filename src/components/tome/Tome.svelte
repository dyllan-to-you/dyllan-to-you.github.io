<!--
  §7 — Book Engine

  Manages flip state, 3D transforms, depth ordering, and input handling.
  No content knowledge — reads from the page registry (pages.js).

  Renders in two modes based on viewport orientation:
    Landscape: two-page spread, rotateY around left edge. TOC on verso.
    Portrait:  single-page full-screen, rotateX around top edge. TOC in drawer.

  Mental model: a stack of leaves. `flipped` is how many have been turned.
  All navigation is goTo(target).

  Depth ordering: translateZ within a preserve-3d context. No z-index on
  leaves. Depth transitions with the flip for natural cascading.
-->
<script>
import { onDestroy, onMount } from "svelte";
import ContentPage from "./ContentPage.svelte";
import CoverPage from "./CoverPage.svelte";
import { pageNumbers, pages, vineSide } from "./pages.js";
import TocPage from "./TocPage.svelte";
import { interaction, layout, timing } from "./tokens.js";

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
let timer;
let tocOpen = $state(false);
let suppressPush = false;

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
  const found = slugs.findIndex((s) => s === clean);
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
  event.preventDefault();
  if (busy) return;
  if (event.deltaY > 0 || event.deltaX > 0) goForward();
  else if (event.deltaY < 0 || event.deltaX < 0) goBack();
}

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
  <!-- Shared SVG defs for the string-of-arrows leaf glyph used by the
       dogear buttons. Hidden; referenced via <use href="#soa-*"> below. -->
  <svg class="soa-defs" width="0" height="0" aria-hidden="true">
    <defs>
      <filter id="soa-blur-heavy" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8"/>
      </filter>
      <filter id="soa-blur-edge" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3.5"/>
      </filter>
      <filter id="soa-blur-light" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5"/>
      </filter>
      <!-- Flap gradient: B's warmth with C's cooler shadow at the tip.
           Perpendicular to fold line (top-right → bottom-left in objectBoundingBox). -->
      <linearGradient id="soa-flap-grad" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f2e6d0"/>
        <stop offset="35%" stop-color="#e6d8b8"/>
        <stop offset="100%" stop-color="#c0a880"/>
      </linearGradient>
      <!-- Cast shadow blur (B intensity) -->
      <filter id="soa-cast-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5"/>
      </filter>
      <!-- Crease blur (C sharpness) -->
      <filter id="soa-crease-blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5"/>
      </filter>
      <!-- Scanlines pattern matching TocPage -->
      <pattern id="soa-scanlines" patternUnits="userSpaceOnUse" width="4" height="4">
        <rect width="4" height="2" fill="transparent"/>
        <rect y="2" width="4" height="2" fill="rgba(0, 0, 0, 0.015)"/>
      </pattern>

      <path id="soa-shape" d="M 200, 440
               C 160, 350 120, 260 110, 155
               C 110, 135 140, 125 160, 145
               C 175, 160 190, 165 200, 165
               C 210, 165 225, 160 240, 145
               C 260, 125 290, 135 290, 155
               C 280, 260 240, 350 200, 440 Z"/>

      <clipPath id="soa-clip">
        <use href="#soa-shape"/>
      </clipPath>

      <path id="soa-highlight" d="M 200, 400
               C 170, 320 140, 240 135, 175
               C 135, 165 150, 155 165, 170
               C 175, 180 185, 185 200, 185
               C 215, 185 225, 180 235, 170
               C 250, 155 265, 165 265, 175
               C 260, 240 230, 320 200, 400 Z"/>

      <path id="soa-veins" d="
        M 200, 165 L 200, 420
        M 200, 185 Q 165, 160 140, 150
        M 200, 215 Q 160, 205 125, 190
        M 200, 250 Q 165, 250 130, 235
        M 200, 285 Q 170, 285 135, 275
        M 200, 320 Q 175, 320 145, 310
        M 200, 355 Q 180, 355 160, 345
        M 200, 390 Q 190, 390 175, 380
        M 200, 185 Q 235, 160 260, 150
        M 200, 215 Q 240, 205 275, 190
        M 200, 250 Q 235, 250 270, 235
        M 200, 285 Q 230, 285 265, 275
        M 200, 320 Q 225, 320 255, 310
        M 200, 355 Q 220, 355 240, 345
        M 200, 390 Q 210, 390 225, 380
        M 165, 205 Q 155, 225 140, 235
        M 235, 250 Q 245, 270 260, 280
        M 170, 285 Q 160, 305 145, 315
        M 235, 160 Q 245, 140 260, 130
        M 165, 160 Q 155, 140 140, 130
      "/>

      <!-- Body gradient: sage at base → olive → gold at the tip.
           userSpaceOnUse so the gradient rotates with the leaf group. -->
      <linearGradient id="soa-grad" x1="200" y1="155" x2="200" y2="440" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#2d5236"/>
        <stop offset="35%" stop-color="#3a5a35"/>
        <stop offset="65%" stop-color="#7a6a2d"/>
        <stop offset="100%" stop-color="#c9a84c"/>
      </linearGradient>

      <linearGradient id="soa-hl-grad" x1="200" y1="175" x2="200" y2="400" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#7aa380"/>
        <stop offset="60%" stop-color="#a89460"/>
        <stop offset="100%" stop-color="#e8d68c"/>
      </linearGradient>
    </defs>
  </svg>

  <div class="sr-only" aria-live="polite" aria-atomic="true">
    {currentPageLabel}
  </div>

  <div
    class="wrapper"
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
    onwheel={handleWheel}
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
            {#if page.type === 'cover'}
              <CoverPage variant={page.variant}/>
            {:else}
              <ContentPage {page} number={pageNumbers[i]} vine={vineSide[i]}/>
              <button class="edge-click edge-back" type="button" onclick={goBack} disabled={busy} tabindex="-1" aria-hidden="true"></button>
              <button class="edge-click edge-fwd" type="button" onclick={goForward} disabled={busy} tabindex="-1" aria-hidden="true"></button>
              <!-- Forward dogear: fold-over at top-right, L=50.
                   Leaf centered at crease midpoint (25, 25). -->
              <button class="dogear dogear-forward dogear-btn" type="button" onclick={goForward} disabled={busy} aria-label="Next page">
                <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M -2 2 L 48 52 L -4 52 Z" fill="rgba(50,30,10,0.18)" filter="url(#soa-cast-shadow)"/>
                  <path d="M 0 0 L 50 50 L 0 50 Z" fill="url(#soa-flap-grad)"/>
                  <line x1="0" y1="0" x2="50" y2="50" stroke="rgba(60,40,20,0.3)" stroke-width="1" filter="url(#soa-crease-blur)"/>
                  <line x1="-1" y1="0" x2="49" y2="50" stroke="rgba(255,245,220,0.35)" stroke-width="1" filter="url(#soa-crease-blur)"/>
                  <g transform="rotate(-15 25 25)">
                    <svg x="4" y="7.5" width="42" height="35" viewBox="30 180 340 210" preserveAspectRatio="none">
                      <g transform="rotate(-90 200 282.5)">
                        <use href="#soa-shape" fill="url(#soa-grad)"/>
                        <g clip-path="url(#soa-clip)">
                          <use href="#soa-highlight" fill="url(#soa-hl-grad)" filter="url(#soa-blur-heavy)" opacity="0.75"/>
                          <use href="#soa-veins" fill="none" stroke="#4a4020" stroke-width="14" stroke-linecap="round" filter="url(#soa-blur-heavy)"/>
                          <use href="#soa-veins" fill="none" stroke="#8a7a3e" stroke-width="7" stroke-linecap="round" filter="url(#soa-blur-edge)"/>
                          <use href="#soa-veins" fill="none" stroke="#e8e2c8" stroke-width="2.5" stroke-linecap="round" filter="url(#soa-blur-light)"/>
                        </g>
                        <use href="#soa-shape" fill="none" stroke="#1a3420" stroke-width="2.5" opacity="0.8"/>
                      </g>
                    </svg>
                  </g>
                </svg>
              </button>
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
                <TocPage activePage={i + 1} onNavigate={goTo} onFlipBack={goBack}/>
                <button class="edge-click edge-back" type="button" onclick={goBack} disabled={busy} tabindex="-1" aria-hidden="true"></button>
                <button class="edge-click edge-fwd" type="button" onclick={goForward} disabled={busy} tabindex="-1" aria-hidden="true"></button>
                <!-- Back dogear: corner folded behind the page.
                     Leaf on the surface, paper triangle on top covering
                     the portion still "under" the page. Only the part
                     peeking past the fold is visible. -->
                <button class="dogear dogear-back dogear-btn" type="button" onclick={goBack} disabled={busy} aria-label="Previous page">
                  <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <!-- Leaf (behind the page triangle) -->
                    <g transform="rotate(15 25 25)">
                      <svg x="4" y="7.5" width="42" height="35" viewBox="30 180 340 210" preserveAspectRatio="none">
                        <g transform="rotate(90 200 282.5)">
                          <use href="#soa-shape" fill="url(#soa-grad)"/>
                          <g clip-path="url(#soa-clip)">
                            <use href="#soa-highlight" fill="url(#soa-hl-grad)" filter="url(#soa-blur-heavy)" opacity="0.75"/>
                            <use href="#soa-veins" fill="none" stroke="#4a4020" stroke-width="14" stroke-linecap="round" filter="url(#soa-blur-heavy)"/>
                            <use href="#soa-veins" fill="none" stroke="#8a7a3e" stroke-width="7" stroke-linecap="round" filter="url(#soa-blur-edge)"/>
                            <use href="#soa-veins" fill="none" stroke="#e8e2c8" stroke-width="2.5" stroke-linecap="round" filter="url(#soa-blur-light)"/>
                          </g>
                          <use href="#soa-shape" fill="none" stroke="#1a3420" stroke-width="2.5" opacity="0.8"/>
                        </g>
                      </svg>
                    </g>
                    <!-- Page triangle: covers the bottom-right half, blending
                         with the page. Uses edge color for the corner region. -->
                    <path d="M 50 0 L 50 50 L 0 50 Z" fill="var(--tome-paper-edge)"/>
                    <path d="M 50 0 L 50 50 L 0 50 Z" fill="url(#soa-scanlines)"/>
                    <!-- Crease on diagonal only -->
                    <line x1="50" y1="0" x2="0" y2="50" stroke="rgba(60,40,20,0.3)" stroke-width="1" filter="url(#soa-crease-blur)"/>
                    <line x1="49" y1="0" x2="-1" y2="50" stroke="rgba(255,245,220,0.35)" stroke-width="1" filter="url(#soa-crease-blur)"/>
                  </svg>
                </button>
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
        <TocPage activePage={flipped} onNavigate={goTo} onFlipBack={() => { tocOpen = false; }}/>
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

  .sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap; border: 0;
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
    padding: 56px 4px 8px;
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

  /* ─── Dogear corners ─── */
  .soa-defs {
    position: absolute;
    width: 0; height: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .dogear {
    position: absolute;
    top: 0;
    width: 50px; height: 50px;
    padding: 0; margin: 0;
    background: none; border: none;
    cursor: pointer;
    display: block;
    transition: transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
  }

  .dogear-back    { left: 0; }
  .dogear-forward { right: 0; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2)); }

  .dogear-forward:hover:not(:disabled) {
    transform: scale(1.08);
    filter: drop-shadow(0 3px 8px rgba(201, 168, 76, 0.35))
            drop-shadow(0 1px 3px rgba(0, 0, 0, 0.25));
  }

  .dogear-back:hover:not(:disabled) {
    transform: scale(1.1);
  }

  .dogear:disabled {
    cursor: default;
    opacity: 0.35;
  }

  .dogear:focus-visible {
    outline: 2px solid var(--tome-gold);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .dogear svg {
    width: 100%; height: 100%;
    display: block;
    overflow: hidden;
  }

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
