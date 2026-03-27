<!--
  §7 — Book Engine

  Manages flip state, 3D transforms, z-indexing, and input handling.
  No content knowledge — reads from leaf/page arrays defined below.

  Renders in two modes based on viewport orientation:
    Landscape: persistent TOC on left, content flips on right. Navigation via TOC.
    Portrait:  single-page flipbook, pages flip bottom-to-top (rotateX)

  Mental model: a stack of leaves. `flipped` is how many have been turned.
  All navigation is goTo(target). A single-page flip is a fan of one leaf.
-->
<script>
  import { untrack, onDestroy } from 'svelte';
  import {
    colors, fonts, backgrounds,
    timing, layout, zIndex, interaction,
    LANDSCAPE_TO_PORTRAIT, PORTRAIT_TO_LANDSCAPE,
  } from './tokens.js';

  /* ─── Page imports ─── */
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

  /** Landscape leaf fronts (right side). Backs 0–7 = TocPage, back 8 = PaperBlank. */
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
     Engine state — two variables, one model.

     flipped:   how many leaves have been turned (0 = closed front, total = closed back)
     animation: null when idle, otherwise describes the in-progress flip
  ═══════════════════════════════════════════════ */

  let isPortrait = $state(false);
  let flipped = $state(0);
  let animation = $state(null);
  // animation shape: { from, to, forward, startFlipped, staggerMs }
  // from/to = leaf index range (inclusive) being animated
  let timer;

  /* ─── Derived ─── */

  let total = $derived(isPortrait ? PORTRAIT_PAGES.length : LANDSCAPE_FRONTS.length);
  let bookOpen = $derived(!isPortrait && flipped > 0 && flipped < LANDSCAPE_FRONTS.length);
  let busy = $derived(animation !== null);

  let landscapeOffset = $derived.by(() => {
    if (isPortrait) return '0px';
    if (flipped === 0) return '-25%';
    if (flipped >= LANDSCAPE_FRONTS.length) return '25%';
    return '0px';
  });

  let currentPageLabel = $derived.by(() => {
    if (isPortrait) {
      const idx = Math.min(flipped, PAGE_LABELS.length - 1);
      return `Page ${flipped + 1} of ${PORTRAIT_PAGES.length}: ${PAGE_LABELS[idx]}`;
    }
    if (flipped >= LANDSCAPE_FRONTS.length) return 'Book closed (back)';
    if (flipped === 0) return 'Front Cover';
    return `${PAGE_LABELS[flipped] || 'Page ' + flipped}`;
  });


  /* ─── Orientation ─── */

  $effect(() => {
    const check = () => { isPortrait = window.innerWidth < window.innerHeight; };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  });

  let previousPortrait = isPortrait;

  $effect(() => {
    const current = isPortrait;
    if (previousPortrait === current) return;
    const wasPortrait = previousPortrait;
    previousPortrait = current;
    const currentFlipped = untrack(() => flipped);
    animation = null;
    clearTimeout(timer);
    const table = wasPortrait ? PORTRAIT_TO_LANDSCAPE : LANDSCAPE_TO_PORTRAIT;
    flipped = table[Math.min(currentFlipped, table.length - 1)];
  });


  /* ═══════════════════════════════════════════════
     Navigation — one function for everything.

     goTo(target) handles single flips and multi-page fans.
     All inputs (keys, clicks, swipe, TOC) call goTo.
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

    clearTimeout(timer);
    timer = setTimeout(() => { animation = null; }, timing.flipMs + staggerMs + 50);
  }

  function goForward() { goTo(flipped + 1); }
  function goBack()    { goTo(flipped - 1); }


  /* ═══════════════════════════════════════════════
     Per-leaf calculations — pure functions of state.
  ═══════════════════════════════════════════════ */

  /** Is this leaf in the animated set? */
  function isAnimating(i) {
    return animation && i >= animation.from && i <= animation.to;
  }

  /** Should this leaf be in the flipped position? */
  function isFlippedFor(i) {
    // Animated leaves use the target state (CSS transition handles the motion)
    if (isAnimating(i)) return i < flipped;
    // Static leaves freeze at pre-animation state to prevent z-index restacking
    return animation ? i < animation.startFlipped : i < flipped;
  }

  /** Z-index: animated leaves on top, static leaves frozen at pre-animation order. */
  function zIndexFor(i) {
    if (isAnimating(i)) {
      // Lowest i on top: departing content peels first (forward),
      // destination content settles last (backward).
      return zIndex.animating - (i - animation.from);
    }
    const wasFlipped = animation ? i < animation.startFlipped : i < flipped;
    return wasFlipped
      ? zIndex.leafBase + i
      : zIndex.leafBase + total - i + total;
  }

  /** CSS transition: animated leaves get flip + stagger delay; static leaves get none. */
  function transitionFor(i) {
    if (!isAnimating(i)) return 'none';
    const { from, to, forward, staggerMs } = animation;
    const steps = to - from;
    const pos = forward ? i - from : to - i;
    const delay = steps > 0 ? (pos / steps) * staggerMs : 0;
    return `transform ${timing.flipMs}ms ${timing.flipEase} ${delay}ms`;
  }


  /* ═══════════════════════════════════════════════
     Input handlers — all route to goTo / goForward / goBack
  ═══════════════════════════════════════════════ */

  function handleClick(event) {
    if (busy) return;
    if (!isPortrait) {
      if (flipped === 0) { goTo(1); return; }
      if (flipped >= LANDSCAPE_FRONTS.length) { goTo(LANDSCAPE_FRONTS.length - 1); return; }
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / rect.height;
    ratio < interaction.portraitBackZone ? goBack() : goForward();
  }

  let touchStart = { x: 0, y: 0 };

  function handleTouchStart(event) {
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }

  function handleTouchEnd(event) {
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    const delta = isPortrait ? dy : dx;
    if (delta < -interaction.swipeThreshold) goForward();
    else if (delta > interaction.swipeThreshold) goBack();
  }

  function handleKeydown(event) {
    if (['ArrowRight', ' ', 'ArrowDown'].includes(event.key)) { event.preventDefault(); goForward(); }
    if (['ArrowLeft', 'ArrowUp'].includes(event.key)) { event.preventDefault(); goBack(); }
  }

  function handleWheel(event) {
    event.preventDefault();
    if (busy) return;
    if (event.deltaY > 0) goForward();
    else if (event.deltaY < 0) goBack();
  }

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
        {#if bookOpen}
          <div class="binding-shadow" style:z-index={zIndex.bindingShadow} aria-hidden="true"></div>
        {/if}
        {#if flipped < total}
          <div class="static-right" style:z-index={zIndex.rightBase} style:background={backgrounds.paper}></div>
        {/if}
      {/if}


      <!-- ─── PORTRAIT LEAVES ─── -->
      {#if isPortrait}
        {#each PORTRAIT_PAGES as Page, i (i)}
          {@const leafFlipped = isFlippedFor(i)}
          <div
            class="leaf portrait-leaf"
            style:transform={leafFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)'}
            style:transition={transitionFor(i)}
            style:will-change={isAnimating(i) ? 'transform' : 'auto'}
            style:z-index={zIndexFor(i)}
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
      {#if !isPortrait}
        {#each LANDSCAPE_FRONTS as Front, i (i)}
          {@const leafFlipped = isFlippedFor(i)}
          <div
            class="leaf landscape-leaf"
            style:transform={leafFlipped ? 'rotateY(-180deg)' : 'rotateY(0deg)'}
            style:transition={transitionFor(i)}
            style:will-change={isAnimating(i) ? 'transform' : 'auto'}
            style:z-index={zIndexFor(i)}
            role="group"
            aria-label={PAGE_LABELS[i] || `Leaf ${i + 1}`}
          >
            <div class="face front recto" class:shadow-right={!leafFlipped}>
              <Front />
            </div>
            <div class="face back-y verso" class:shadow-left={leafFlipped}>
              {#if i < LANDSCAPE_FRONTS.length - 1}
                <TocPage activePage={i + 1} onNavigate={goTo} onFlipBack={goBack} />
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
        <div
          class="click-zone-right"
          style:z-index={zIndex.clickZone}
          onclick={goForward}
          onkeydown={(e) => { if (e.key === 'Enter') goForward(); }}
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
          onclick={goBack}
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
          onclick={goForward}
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

    {#if !isPortrait && !bookOpen}
      <div class="hint" style:font-family={fonts.body} style:color={colors.gold} aria-hidden="true">
        click to open
      </div>
    {/if}
  </div>

  <div class="ambient-glow" style:background="radial-gradient(ellipse, {colors.gold}08 0%, transparent 70%)" aria-hidden="true"></div>
</div>


<!-- ═══════════════════════════════════════════════
     Scoped styles — structural CSS for the engine.
     Visual tokens are applied via style: directives.
     ═══════════════════════════════════════════════ -->
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
    padding: 20px; box-sizing: border-box;
    user-select: none;
  }

  .wrapper { position: relative; }

  .perspective {
    position: relative;
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

  .recto  { border-radius: 0 3px 3px 0; }
  .verso  { border-radius: 3px 0 0 3px; }

  .shadow-bottom { box-shadow: 0 4px 20px rgba(0,0,0,0.25); }
  .shadow-top    { box-shadow: 0 -4px 20px rgba(0,0,0,0.2); }
  .shadow-right  { box-shadow: 3px 0 12px rgba(0,0,0,0.15); }
  .shadow-left   { box-shadow: -3px 0 12px rgba(0,0,0,0.15); }

  /* ─── Landscape panels ─── */
  .binding-shadow {
    position: absolute;
    top: 0; left: 50%; transform: translateX(-50%);
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
  }

  /* ─── Click zones ─── */
  .click-zone {
    position: absolute; inset: 0;
    cursor: pointer;
  }

  .click-zone-right {
    position: absolute;
    top: 0; left: 50%;
    width: 50%; height: 100%;
    cursor: pointer;
  }

  .click-zone:focus-visible,
  .click-zone-right:focus-visible {
    outline: 2px solid rgba(201, 168, 76, 0.6);
    outline-offset: 4px;
    border-radius: 3px;
  }

  /* ─── Navigation (portrait) ─── */
  .nav-bar {
    display: flex; justify-content: center;
    align-items: center; gap: 16px;
    margin-top: 16px;
  }

  .nav-btn {
    background: none; border: none;
    font-size: 0.75rem; cursor: pointer;
    letter-spacing: 0.1em;
    min-width: 44px; min-height: 44px;
    padding: 8px 12px;
    display: inline-flex;
    align-items: center; justify-content: center;
    transition: color 0.3s;
  }
  .nav-btn:disabled { cursor: default; }

  .nav-btn:focus-visible {
    outline: 2px solid rgba(201, 168, 76, 0.6);
    outline-offset: 2px; border-radius: 3px;
  }

  .dots {
    display: flex; gap: 5px;
    flex-wrap: wrap; justify-content: center;
  }

  .dot {
    width: 6px; height: 6px;
    border-radius: 50%; border: 1px solid;
    transition: background 0.3s;
  }

  .hint {
    text-align: center; margin-top: 8px;
    font-size: 0.7rem; opacity: 0.3;
    letter-spacing: 0.1em;
  }

  .ambient-glow {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 600px; height: 400px;
    pointer-events: none; z-index: 0;
  }
</style>
