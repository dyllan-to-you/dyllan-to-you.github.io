<!--
  Dogear navigation corner — folded page corner with String of Arrows leaf glyph.

  Two variants:
    forward (top-right): fold-over triangle with paper gradient, leaf underneath
    back (top-left): leaf peeking from behind the page, paper triangle on top

  SVG defs (filters, gradients, paths) are defined once and shared via <use>.
-->
<script lang="ts">
/**
 * @type {{ direction: 'forward' | 'back', onclick: () => void, disabled?: boolean }}
 */
let { direction, onclick, disabled = false } = $props();
</script>

<!-- Shared SVG defs — rendered once, referenced by both variants via <use> -->
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
    <linearGradient id="soa-flap-grad" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f2e6d0"/>
      <stop offset="35%" stop-color="#e6d8b8"/>
      <stop offset="100%" stop-color="#c0a880"/>
    </linearGradient>
    <filter id="soa-cast-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5"/>
    </filter>
    <filter id="soa-crease-blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5"/>
    </filter>
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

{#snippet leaf(rotation)}
  <svg x="4" y="7.5" width="42" height="35" viewBox="30 180 340 210" preserveAspectRatio="none">
    <g transform="rotate({rotation} 200 282.5)">
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
{/snippet}

<button
  class="dogear"
  class:dogear-forward={direction === 'forward'}
  class:dogear-back={direction === 'back'}
  type="button"
  {onclick}
  {disabled}
  aria-label={direction === 'forward' ? 'Next page' : 'Previous page'}
>
  <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {#if direction === 'forward'}
      <!-- Cast shadow, flap triangle, crease lines, then leaf -->
      <path d="M -2 2 L 48 52 L -4 52 Z" fill="rgba(50,30,10,0.18)" filter="url(#soa-cast-shadow)"/>
      <path d="M 0 0 L 50 50 L 0 50 Z" fill="url(#soa-flap-grad)"/>
      <line x1="0" y1="0" x2="50" y2="50" stroke="rgba(60,40,20,0.3)" stroke-width="1" filter="url(#soa-crease-blur)"/>
      <line x1="-1" y1="0" x2="49" y2="50" stroke="rgba(255,245,220,0.35)" stroke-width="1" filter="url(#soa-crease-blur)"/>
      <g transform="rotate(-15 25 25)">
        {@render leaf(-90)}
      </g>
    {:else}
      <!-- Leaf behind, then page triangle + scanlines + crease -->
      <g transform="rotate(15 25 25)">
        {@render leaf(90)}
      </g>
      <path d="M 50 0 L 50 50 L 0 50 Z" fill="var(--tome-paper-edge)"/>
      <path d="M 50 0 L 50 50 L 0 50 Z" fill="url(#soa-scanlines)"/>
      <line x1="50" y1="0" x2="0" y2="50" stroke="rgba(60,40,20,0.3)" stroke-width="1" filter="url(#soa-crease-blur)"/>
      <line x1="49" y1="0" x2="-1" y2="50" stroke="rgba(255,245,220,0.35)" stroke-width="1" filter="url(#soa-crease-blur)"/>
    {/if}
  </svg>
</button>

<style>
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
</style>
