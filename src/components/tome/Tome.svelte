<!--
  §7 — Book Engine

  Manages flip state, 3D transforms, z-indexing, and input handling.
  No content knowledge — reads from leaf/page arrays defined below.

  Renders in two modes based on viewport orientation:
    Landscape: persistent TOC on left, content flips on right. Navigation via TOC.
    Portrait:  single-page flipbook, pages flip bottom-to-top (rotateX)
-->
<script>
  import { untrack, onDestroy } from 'svelte';
  import {
    colors, fonts, backgrounds,
    timing, layout, zIndex, interaction,
    LANDSCAPE_TO_PORTRAIT, PORTRAIT_TO_LANDSCAPE,
  } from './tokens.js';

  /* ─── §5/§6: Page imports and leaf definitions ─── */
  import PaperBlank from './PaperBlank.svelte';
  import CoverPage from './CoverPage.svelte';
  import EpigraphPage from './EpigraphPage.svelte';
  import PhilosophyPage from './PhilosophyPage.svelte';
  import ArchitectPage from './ArchitectPage.svelte';
  import CoreProjectsPage from './CoreProjectsPage.svelte';
  import WorksPage from './WorksPage.svelte';
  import FrequenciesPage from './FrequenciesPage.svelte';
  import ColophonPage from './ColophonPage.svelte';
  import BackCover from './BackCover.svelte';
  import TocPage from './TocPage.svelte';

  /**
   * Landscape: one content page per leaf front (right side).
   * Backs of leaves 0–7 = TocPage (rendered inline, not stored here).
   * Leaf 8 back = PaperBlank (back cover exterior when fully closed).
   */
  const LANDSCAPE_FRONTS = [
    CoverPage, EpigraphPage, PhilosophyPage,
    ArchitectPage, CoreProjectsPage,
    WorksPage, FrequenciesPage,
    ColophonPage, BackCover,
  ];

  /** Portrait: single pages, bottom-to-top flipbook. */
  const PORTRAIT_PAGES = [
    CoverPage, EpigraphPage, PhilosophyPage,
    ArchitectPage, CoreProjectsPage,
    WorksPage, FrequenciesPage,
    ColophonPage, BackCover,
  ];

  /** Page labels for screen readers */
  const PAGE_LABELS = [
    'Front Cover', 'Epigraph', 'Philosophy',
    'The Architect', 'Core Projects',
    'The Works', 'Frequencies',
    'Colophon', 'Back Cover',
  ];


  /* ═══════════════════════════════════════════════
     Engine state
     ═══════════════════════════════════════════════ */

  let isPortrait = $state(false);
  let flipped = $state(0);
  let animatingLeaf = $state(-1);
  let timer;

  /* ─── Derived ─── */

  let total = $derived(isPortrait ? PORTRAIT_PAGES.length : LANDSCAPE_FRONTS.length);

  /** Whether the book is open (showing TOC + content spread) in landscape */
  let bookOpen = $derived(!isPortrait && flipped > 0 && flipped < LANDSCAPE_FRONTS.length);

  /** Landscape: shift container to center when book is closed */
  let landscapeOffset = $derived.by(() => {
    if (isPortrait) return '0px';
    if (flipped === 0) return '-25%';
    if (flipped >= LANDSCAPE_FRONTS.length) return '25%';
    return '0px';
  });

  /** Current page label for live region announcements */
  let currentPageLabel = $derived.by(() => {
    if (isPortrait) {
      const idx = Math.min(flipped, PAGE_LABELS.length - 1);
      return `Page ${flipped + 1} of ${PORTRAIT_PAGES.length}: ${PAGE_LABELS[idx]}`;
    }
    if (flipped >= LANDSCAPE_FRONTS.length) return 'Book closed (back)';
    if (flipped === 0) return 'Front Cover';
    return `${PAGE_LABELS[flipped] || 'Page ' + flipped}`;
  });


  /* ─── Orientation detection ─── */

  $effect(() => {
    const check = () => { isPortrait = window.innerWidth < window.innerHeight; };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  });


  /* ─── Orientation change → map reading position ─── */

  let previousPortrait = isPortrait;

  $effect(() => {
    const current = isPortrait;
    if (previousPortrait === current) return;

    const wasPortrait = previousPortrait;
    previousPortrait = current;

    const currentFlipped = untrack(() => flipped);

    animatingLeaf = -1;
    clearTimeout(timer);
    const table = wasPortrait ? PORTRAIT_TO_LANDSCAPE : LANDSCAPE_TO_PORTRAIT;
    flipped = table[Math.min(currentFlipped, table.length - 1)];
  });


  /* ─── Flip mechanics ─── */

  function flip(direction) {
    if (animatingLeaf >= 0) return;
    const next = flipped + direction;
    if (next < 0 || next > total) return;
    animatingLeaf = direction > 0 ? flipped : flipped - 1;
    flipped = next;
    clearTimeout(timer);
    timer = setTimeout(() => { animatingLeaf = -1; }, timing.cooldownMs);
  }

  function flipForward() { flip(1); }
  function flipBack()    { flip(-1); }

  /** Navigate to a specific page (used by TOC). Animates one leaf flip. */
  function goToPage(target) {
    if (animatingLeaf >= 0) return;
    if (target === flipped || target < 0 || target > total) return;

    if (target > flipped) {
      // Forward: animate the current top (unflipped) leaf flipping away
      animatingLeaf = flipped;
    } else {
      // Backward: animate the leaf just above target unflipping back
      // The leaf at index `target` will become the new top unflipped leaf,
      // so animate the leaf at `target` (it's currently flipped, swinging back)
      animatingLeaf = target;
    }
    flipped = target;
    clearTimeout(timer);
    timer = setTimeout(() => { animatingLeaf = -1; }, timing.cooldownMs);
  }


  /* ─── Z-index calculation ─── */

  function zIndexFor(leafIndex, isFlipped) {
    if (leafIndex === animatingLeaf) return zIndex.animating;
    // Flipped: lower indices on bottom (0..total-1)
    // Unflipped: higher range, lower indices on top (total+1..2*total)
    // The +total offset prevents ties between the last flipped and first unflipped leaf
    return isFlipped
      ? zIndex.leafBase + leafIndex
      : zIndex.leafBase + total - leafIndex + total;
  }

  /** Per-leaf transition: only the animating leaf gets CSS transition */
  function transitionFor(leafIndex) {
    return leafIndex === animatingLeaf
      ? `transform ${timing.flipMs}ms ${timing.flipEase}`
      : 'none';
  }


  /* ─── Click: cover/back cover open/close, portrait position-based ─── */

  function handleClick(event) {
    if (animatingLeaf >= 0) return;

    if (!isPortrait) {
      // Landscape: click zone only active when book is closed
      if (flipped === 0) { goToPage(1); return; }
      if (flipped >= LANDSCAPE_FRONTS.length) { goToPage(LANDSCAPE_FRONTS.length - 1); return; }
      return; // when open, TOC handles navigation
    }

    // Portrait: position-based
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / rect.height;
    ratio < interaction.portraitBackZone ? flipBack() : flipForward();
  }


  /* ─── Touch: swipe ─── */

  let touchStart = { x: 0, y: 0 };

  function handleTouchStart(event) {
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }

  function handleTouchEnd(event) {
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    const delta = isPortrait ? dy : dx;
    if (delta < -interaction.swipeThreshold) flipForward();
    else if (delta > interaction.swipeThreshold) flipBack();
  }


  /* ─── Keyboard ─── */

  function handleKeydown(event) {
    if (['ArrowRight', ' ', 'ArrowDown'].includes(event.key)) { event.preventDefault(); flipForward(); }
    if (['ArrowLeft', 'ArrowUp'].includes(event.key)) { event.preventDefault(); flipBack(); }
  }


  /* ─── Scroll/wheel: flip pages on scroll ─── */

  function handleWheel(event) {
    event.preventDefault();
    if (animatingLeaf >= 0) return;
    // deltaY > 0 = scroll down = forward, < 0 = scroll up = backward
    if (event.deltaY > 0) flipForward();
    else if (event.deltaY < 0) flipBack();
  }


  /* ─── Cleanup ─── */

  onDestroy(() => clearTimeout(timer));
</script>


<!-- ═══════════════════════════════════════════════
     Template
     ═══════════════════════════════════════════════ -->

<svelte:window onkeydown={handleKeydown}/>

<div class="tome-root" style:background={backgrounds.void} style:font-family={fonts.fallback} role="region" aria-label="Interactive book" aria-roledescription="book">

  <!-- Live region for page-turn announcements -->
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
    <!-- Perspective container -->
    <div
      class="perspective"
      style:width={isPortrait ? layout.portraitW : layout.landscapeW}
      style:height={isPortrait ? layout.portraitH : layout.landscapeH}
      style:perspective={isPortrait ? layout.portraitPerspective : layout.landscapePerspective}
      style:perspective-origin={isPortrait ? layout.portraitEye : layout.landscapeEye}
      style:transform="translateX({landscapeOffset})"
    >
      {#if !isPortrait}
        <!-- Binding shadow only when spread is visible -->
        {#if bookOpen}
          <div class="binding-shadow" style:z-index={zIndex.bindingShadow} aria-hidden="true"></div>
        {/if}

        <!-- Landscape: static right base (paper behind the leaf stack) -->
        {#if flipped < total}
          <div class="static-right" style:z-index={zIndex.rightBase} style:background={backgrounds.paper}></div>
        {/if}
      {/if}


      <!-- ─── PORTRAIT LEAVES ─── -->
      {#if isPortrait}
        {#each PORTRAIT_PAGES as Page, i (i)}
          {@const isFlipped = i < flipped}
          <div
            class="leaf portrait-leaf"
            style:transform={isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)'}
            style:transition={transitionFor(i)}
            style:will-change={i === animatingLeaf ? 'transform' : 'auto'}
            style:z-index={zIndexFor(i, isFlipped)}
            role="group"
            aria-label={PAGE_LABELS[i] || `Page ${i + 1}`}
          >
            <div class="face front shadow-bottom">
              <Page />
            </div>
            <div class="face back-x paper-back shadow-top" style:background={backgrounds.paper} aria-hidden="true"></div>
          </div>
        {/each}
      {/if}


      <!-- ─── LANDSCAPE LEAVES ─── -->
      <!-- Front = content page (right side). Back = TocPage (left side after flip). -->
      <!-- Last leaf back = PaperBlank (back cover exterior when fully closed). -->
      {#if !isPortrait}
        {#each LANDSCAPE_FRONTS as Front, i (i)}
          {@const isFlipped = i < flipped}
          <div
            class="leaf landscape-leaf"
            style:transform={isFlipped ? 'rotateY(-180deg)' : 'rotateY(0deg)'}
            style:transition={transitionFor(i)}
            style:will-change={i === animatingLeaf ? 'transform' : 'auto'}
            style:z-index={zIndexFor(i, isFlipped)}
            role="group"
            aria-label={PAGE_LABELS[i] || `Leaf ${i + 1}`}
          >
            <div class="face front recto" class:shadow-right={!isFlipped}>
              <Front />
            </div>
            <div class="face back-y verso" class:shadow-left={isFlipped}>
              {#if i < LANDSCAPE_FRONTS.length - 1}
                <TocPage {flipped} onNavigate={goToPage} />
              {:else}
                <PaperBlank />
              {/if}
            </div>
          </div>
        {/each}
      {/if}


      <!-- Click zones -->
      {#if isPortrait}
        <div
          class="click-zone"
          style:z-index={zIndex.clickZone}
          onclick={handleClick}
          onkeydown={(e) => { if (e.key === 'Enter') handleClick(e); }}
          role="button"
          tabindex="0"
          aria-label="Tap upper area for previous page, lower area for next page"
        ></div>
      {:else if !bookOpen}
        <!-- Landscape closed: full click zone to open -->
        <div
          class="click-zone"
          style:z-index={zIndex.clickZone}
          onclick={handleClick}
          onkeydown={(e) => { if (e.key === 'Enter') handleClick(e); }}
          role="button"
          tabindex="0"
          aria-label="Click to open the book"
        ></div>
      {:else}
        <!-- Landscape open: right-half click zone for flipping (TOC on left stays interactive) -->
        <div
          class="click-zone-right"
          style:z-index={zIndex.clickZone}
          onclick={flipForward}
          onkeydown={(e) => { if (e.key === 'Enter') flipForward(); }}
          role="button"
          tabindex="0"
          aria-label="Click to turn to next page"
        ></div>
      {/if}
    </div>


    <!-- ─── Navigation: portrait only ─── -->
    {#if isPortrait}
      <nav class="nav-bar" aria-label="Book navigation">
        <button
          class="nav-btn"
          onclick={flipBack}
          disabled={flipped === 0}
          aria-label="Previous page"
          style:color={flipped === 0 ? '#333' : colors.gold}
          style:font-family={fonts.heading}
          style:opacity={flipped === 0 ? 0.3 : 0.7}
        >
          ▴ PREV
        </button>

        <div class="dots" style:max-width="80px" role="group" aria-label={`Page progress: ${flipped} of ${total} pages turned`}>
          {#each Array(total) as _, i}
            <div
              class="dot"
              style:background={i < flipped ? colors.gold : '#333'}
              style:border-color="{colors.gold}44"
              role="presentation"
            ></div>
          {/each}
        </div>

        <button
          class="nav-btn"
          onclick={flipForward}
          disabled={flipped === total}
          aria-label="Next page"
          style:color={flipped === total ? '#333' : colors.gold}
          style:font-family={fonts.heading}
          style:opacity={flipped === total ? 0.3 : 0.7}
        >
          NEXT ▾
        </button>
      </nav>

      <div class="hint" style:font-family={fonts.body} style:color={colors.gold} aria-hidden="true">
        swipe or tap · ↑↓ keys
      </div>
    {/if}

    <!-- Landscape hint (only when book is closed) -->
    {#if !isPortrait && !bookOpen}
      <div class="hint" style:font-family={fonts.body} style:color={colors.gold} aria-hidden="true">
        click to open
      </div>
    {/if}
  </div>

  <!-- Ambient glow -->
  <div class="ambient-glow" style:background="radial-gradient(ellipse, {colors.gold}08 0%, transparent 70%)" aria-hidden="true"></div>
</div>


<!-- ═══════════════════════════════════════════════
     Scoped styles — structural CSS for the engine.
     Visual tokens are applied via style: directives.
     ═══════════════════════════════════════════════ -->
<style>
  /* ─── Keyframes ─── */
  @keyframes -global-sigilPulse {
    0%, 100% { filter: drop-shadow(0 0 8px rgba(201, 168, 76, 0.2)); }
    50% { filter: drop-shadow(0 0 16px rgba(201, 168, 76, 0.4)); }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .tome-root {
    width: 100vw;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
    user-select: none;
  }

  .wrapper { position: relative; }

  .perspective {
    position: relative;
    transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ─── Leaf (shared) ─── */
  .leaf {
    position: absolute;
    top: 0;
    transform-style: preserve-3d;
  }

  .portrait-leaf {
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: center top;
  }

  .landscape-leaf {
    left: 50%;
    width: 50%;
    height: 100%;
    transform-origin: left center;
  }

  /* ─── Face (shared) ─── */
  .face {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    overflow: hidden;
    border-radius: 3px;
  }

  .back-x { transform: rotateX(180deg); }
  .back-y { transform: rotateY(180deg); }

  .recto  { border-radius: 0 3px 3px 0; }
  .verso  { border-radius: 3px 0 0 3px; }

  .shadow-bottom { box-shadow: 0 4px 20px rgba(0,0,0,0.25); }
  .shadow-top    { box-shadow: 0 -4px 20px rgba(0,0,0,0.2); }
  .shadow-right  { box-shadow: 3px 0 12px rgba(0,0,0,0.15); }
  .shadow-left   { box-shadow: -3px 0 12px rgba(0,0,0,0.15); }

  /* ─── Landscape static panels ─── */
  .binding-shadow {
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 24px; height: 100%;
    pointer-events: none;
    background: linear-gradient(90deg,
      transparent,
      rgba(0,0,0,.05) 35%,
      rgba(0,0,0,.07) 50%,
      rgba(0,0,0,.05) 65%,
      transparent
    );
  }

  .static-right {
    position: absolute;
    top: 0; right: 0;
    width: 50%; height: 100%;
    overflow: hidden;
    border-radius: 0 3px 3px 0;
  }

  /* ─── Click zones ─── */
  .click-zone {
    position: absolute;
    inset: 0;
    cursor: pointer;
  }

  .click-zone-right {
    position: absolute;
    top: 0;
    left: 50%;
    width: 50%;
    height: 100%;
    cursor: pointer;
  }

  .click-zone:focus-visible,
  .click-zone-right:focus-visible {
    outline: 2px solid rgba(201, 168, 76, 0.6);
    outline-offset: 4px;
    border-radius: 3px;
  }

  /* ─── Navigation (portrait only) ─── */
  .nav-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-top: 16px;
  }

  .nav-btn {
    background: none;
    border: none;
    font-size: 0.75rem;
    cursor: pointer;
    letter-spacing: 0.1em;
    min-width: 44px;
    min-height: 44px;
    padding: 8px 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color 0.3s;
  }
  .nav-btn:disabled { cursor: default; }

  .nav-btn:focus-visible {
    outline: 2px solid rgba(201, 168, 76, 0.6);
    outline-offset: 2px;
    border-radius: 3px;
  }

  .dots {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    border: 1px solid;
    transition: background 0.3s;
  }

  .hint {
    text-align: center;
    margin-top: 8px;
    font-size: 0.7rem;
    opacity: 0.3;
    letter-spacing: 0.1em;
  }

  .ambient-glow {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 600px; height: 400px;
    pointer-events: none;
    z-index: 0;
  }
</style>
