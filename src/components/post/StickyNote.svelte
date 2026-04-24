<!--
  Hover overlays for post content.

  Two modes, driven by the element under the cursor:

  Mode "strip" — for .voice-collab (collaborative prose).
    A paper strip matching the page parchment unfolds DOWN from above
    the hovered span (rotateX 90° → 0°, transform-origin bottom).
    Casts a shadow upward — bottom is flush with the text, like a
    crease rather than a floating note.

  Mode "preview" — for <a data-preview="url"> links.
    A square sticky-note with the linked image + caption (yellow paper,
    click-to-open). Prefers placement above the link, then to the right,
    then left. Falls back below only if nothing else fits.
-->
<script lang="ts">
import { onMount } from "svelte";

type Mode = "strip" | "preview";

const PREVIEW_W = 260;
const PREVIEW_H_EST = 240;
const GAP = 10;

let mode = $state<Mode>("strip");
let visible = $state(false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

// Strip state
let stripText = $state("");
let stripTop = $state(0);
let stripLeft = $state(0);
let stripWidth = $state(0);

// Preview state
let previewHref = $state("");
let previewImg = $state("");
let previewCaption = $state("");
let previewTop = $state(0);
let previewLeft = $state(0);
let previewPlacement = $state<"above" | "right" | "left" | "below">("above");

function cancelHide() {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
}
function scheduleHide() {
  cancelHide();
  hideTimer = setTimeout(() => { visible = false; }, 160);
}

function showStrip(span: HTMLElement) {
  cancelHide();
  const rect = span.getBoundingClientRect();
  stripText = span.dataset.prompt ?? "";
  stripTop = rect.top;
  stripLeft = rect.left;
  stripWidth = Math.max(rect.width, 220);
  mode = "strip";
  visible = true;
}

function showPreview(link: HTMLAnchorElement) {
  cancelHide();
  const rect = link.getBoundingClientRect();
  previewHref = link.href;
  previewImg = link.dataset.preview ?? "";
  previewCaption = link.textContent?.trim() ?? link.href;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const aboveSpace = rect.top;
  const belowSpace = vh - rect.bottom;
  const rightSpace = vw - rect.right;
  const leftSpace = rect.left;

  // Preference order: above > right > left > below
  if (aboveSpace >= PREVIEW_H_EST + GAP) {
    previewPlacement = "above";
    previewTop = rect.top - PREVIEW_H_EST - GAP;
    previewLeft = Math.min(rect.left, vw - PREVIEW_W - 12);
  } else if (rightSpace >= PREVIEW_W + GAP) {
    previewPlacement = "right";
    previewTop = Math.max(8, Math.min(rect.top, vh - PREVIEW_H_EST - 12));
    previewLeft = rect.right + GAP;
  } else if (leftSpace >= PREVIEW_W + GAP) {
    previewPlacement = "left";
    previewTop = Math.max(8, Math.min(rect.top, vh - PREVIEW_H_EST - 12));
    previewLeft = rect.left - PREVIEW_W - GAP;
  } else if (belowSpace >= PREVIEW_H_EST + GAP) {
    previewPlacement = "below";
    previewTop = rect.bottom + GAP;
    previewLeft = Math.min(rect.left, vw - PREVIEW_W - 12);
  } else {
    // Fall back to above, clipped if needed
    previewPlacement = "above";
    previewTop = Math.max(8, rect.top - PREVIEW_H_EST - GAP);
    previewLeft = Math.min(rect.left, vw - PREVIEW_W - 12);
  }

  mode = "preview";
  visible = true;
}

onMount(() => {
  const handleOver = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (!target?.closest) return;
    if (target.closest(".hover-overlay")) {
      cancelHide();
      return;
    }
    const link = target.closest?.("a[data-preview]") as HTMLAnchorElement | null;
    if (link) { showPreview(link); return; }
    const span = target.closest?.(".voice-collab") as HTMLElement | null;
    if (span) { showStrip(span); return; }
  };

  const handleOut = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (!target?.closest) return;
    if (target.closest(".voice-collab") ||
        target.closest("a[data-preview]") ||
        target.closest(".hover-overlay")) {
      scheduleHide();
    }
  };

  const handleScroll = () => {
    visible = false;
    cancelHide();
  };

  document.addEventListener("mouseover", handleOver);
  document.addEventListener("mouseout", handleOut);
  document.addEventListener("scroll", handleScroll, { capture: true });

  return () => {
    document.removeEventListener("mouseover", handleOver);
    document.removeEventListener("mouseout", handleOut);
    document.removeEventListener("scroll", handleScroll, { capture: true });
  };
});
</script>

<!-- Strip tooltip: unfolds down from above the hovered voice-collab span -->
{#if mode === "strip"}
<div
  class="hover-overlay strip"
  class:visible={visible && mode === "strip"}
  style:top="{stripTop}px"
  style:left="{stripLeft}px"
  style:width="{stripWidth}px"
  aria-hidden="true"
>
  <div class="strip-paper">{stripText}</div>
</div>
{/if}

<!-- Link preview: square sticky-note with image + caption, clickable -->
{#if mode === "preview"}
<a
  class="hover-overlay preview"
  class:visible={visible && mode === "preview"}
  class:place-above={previewPlacement === "above"}
  class:place-right={previewPlacement === "right"}
  class:place-left={previewPlacement === "left"}
  class:place-below={previewPlacement === "below"}
  style:top="{previewTop}px"
  style:left="{previewLeft}px"
  href={previewHref}
  target="_blank"
  rel="noopener noreferrer"
>
  <div class="preview-paper">
    {#if previewImg}
      <img src={previewImg} alt="" class="preview-img" />
    {/if}
    <div class="preview-caption">{previewCaption}</div>
  </div>
</a>
{/if}

<style>
  .hover-overlay {
    position: fixed;
    z-index: 200;
    pointer-events: none;
  }
  .hover-overlay.visible { pointer-events: auto; }

  /* ── Strip tooltip (voice-collab prompt) ── */
  /* The strip sits ABOVE the hovered span; its bottom edge is flush with
     the top of the span (the "crease"). Shadow points upward only. */
  .strip {
    transform: translateY(-100%);
  }
  .strip-paper {
    /* Match the page parchment for a "paper folded over text" feel */
    background: var(--tome-bg-paper);
    color: var(--tome-ink);
    font-family: var(--tome-font-body);
    font-size: 0.82rem;
    line-height: 1.55;
    padding: 10px 14px;
    margin-bottom: 0;   /* flush against the text below — crease, not gap */
    border-radius: 3px 3px 0 0;  /* only top corners rounded */
    border-bottom: 1px solid rgba(139, 69, 19, 0.25);  /* subtle crease line */
    /* Shadow reaches upward only; bottom stays flush */
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.18), 0 -1px 0 rgba(139, 69, 19, 0.12);
    white-space: pre-wrap;
    transform-origin: bottom center;
    transform: perspective(800px) rotateX(-90deg);
    opacity: 0;
    will-change: transform, opacity;
    transition:
      transform 0.30s cubic-bezier(0.2, 0.95, 0.35, 1.02),
      opacity 0.22s ease;
  }
  .strip.visible .strip-paper {
    transform: perspective(800px) rotateX(0deg);
    opacity: 1;
  }

  /* ── Link preview (sticky note for <a data-preview>) ── */
  .preview {
    text-decoration: none;
    color: inherit;
  }
  .preview-paper {
    width: 260px;
    padding: 12px 12px 10px;
    background: linear-gradient(135deg, #fffdf3 0%, #fff2a8 100%);
    border-radius: 3px;
    box-shadow:
      inset 0 -1px 0 rgba(180, 140, 30, 0.18),
      3px 5px 14px rgba(0, 0, 0, 0.22);
    opacity: 0;
    will-change: transform, opacity;
    transition:
      transform 0.32s cubic-bezier(0.2, 0.95, 0.35, 1.04),
      opacity 0.22s ease;
  }

  /* Flip-out pivots from the edge nearest the link */
  .place-above .preview-paper {
    transform-origin: bottom left;
    transform: perspective(900px) rotateX(80deg);
  }
  .place-below .preview-paper {
    transform-origin: top left;
    transform: perspective(900px) rotateX(-80deg);
  }
  .place-right .preview-paper {
    transform-origin: left center;
    transform: perspective(900px) rotateY(-90deg);
  }
  .place-left .preview-paper {
    transform-origin: right center;
    transform: perspective(900px) rotateY(90deg);
  }

  .preview.visible .preview-paper {
    transform: perspective(900px) rotateX(0deg) rotateY(0deg);
    opacity: 1;
  }
  .preview:hover .preview-paper {
    box-shadow:
      inset 0 -1px 0 rgba(180, 140, 30, 0.25),
      4px 7px 18px rgba(0, 0, 0, 0.30);
  }
  .preview-img {
    display: block;
    width: 100%;
    max-height: 180px;
    object-fit: contain;
    background: #fff;
    border-radius: 2px;
    margin-bottom: 8px;
  }
  .preview-caption {
    font-family: var(--tome-font-mono);
    font-size: 0.68rem;
    line-height: 1.4;
    color: #3d2e14;
    letter-spacing: 0.02em;
  }

  @media (max-width: 640px) {
    .strip {
      max-width: calc(100vw - 20px);
    }
  }
</style>
