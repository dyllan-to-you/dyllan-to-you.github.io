<script>
  import { fonts, colors, backgrounds } from './tokens.js';
  import { tocEntries } from './pages.js';
  import CoverSigil from './CoverSigil.svelte';

  let { activePage = 1, onNavigate, onFlipBack } = $props();
</script>

<div class="page" style:background={backgrounds.paper} onclick={(e) => { if (e.target.closest('button')) return; onFlipBack?.(); }} role="presentation">
  <nav class="toc" aria-label="Table of contents">
    <div class="terminal-chrome">
      <span class="path" style:font-family={fonts.mono} style:color={colors.termGreen}>~/dyllan.to</span>
    </div>
    <div class="tree" style:font-family={fonts.mono} style:color={colors.ink}>
      <div class="tree-root" style:color={colors.termDim}>.</div>
      {#each tocEntries as entry, i}
        {@const active = entry.index === activePage}
        {@const last = i === tocEntries.length - 1}
        <button
          class="tree-entry"
          class:active
          onclick={() => onNavigate(entry.index)}
          aria-current={active ? 'page' : undefined}
        >
          <span class="branch" style:color={colors.termDim}>{last ? '└──' : '├──'}</span>
          <span class="leaf" style:color={active ? colors.termGreen : colors.ink}>{entry.toc}</span>
          {#if active}<span class="cursor" style:background={colors.termGreen}></span>{/if}
        </button>
      {/each}
    </div>
  </nav>

  <div class="supplementary">
    <div class="rule" style:background="linear-gradient(90deg, transparent, {colors.gold}44, transparent)"></div>
    <div class="sigil-small">
      <CoverSigil idPrefix="toc"/>
    </div>
    <div class="branding" style:font-family={fonts.mono} style:color={colors.termDim}>
      Playfaire PBC
    </div>
  </div>

  <div class="scanlines"></div>
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    display: flex; flex-direction: column;
    padding: 28px 24px 20px;
    position: relative;
    overflow: hidden;
  }

  .scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.015) 2px,
      rgba(0, 0, 0, 0.015) 4px
    );
    pointer-events: none;
  }

  .toc {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .terminal-chrome {
    margin-bottom: 16px;
  }

  .path {
    font-size: 0.65rem;
    letter-spacing: 0.04em;
  }

  .tree {
    display: flex;
    flex-direction: column;
  }

  .tree-root {
    font-size: 0.75rem;
    padding: 0 0 0 2px;
    line-height: 1.4;
    letter-spacing: 0.02em;
  }

  .tree-entry {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    padding: 0 6px 0 2px;
    margin: 0;
    cursor: pointer;
    border-radius: 2px;
    text-align: left;
    font-family: inherit;
    line-height: 1.4;
    transition: background 0.2s;
    position: relative;
  }

  .tree-entry:hover {
    background: rgba(45, 107, 63, 0.06);
  }

  .tree-entry:focus-visible {
    outline: 1px solid rgba(45, 107, 63, 0.4);
    outline-offset: 1px;
  }

  .tree-entry.active {
    background: rgba(45, 107, 63, 0.08);
  }

  .branch {
    font-size: 0.75rem;
    white-space: pre;
    flex-shrink: 0;
    user-select: none;
    margin-right: 6px;
  }

  .leaf {
    font-size: 0.75rem;
    letter-spacing: 0.02em;
    transition: color 0.2s;
  }

  .tree-entry:hover .leaf {
    color: rgba(45, 107, 63, 0.8) !important;
  }

  .cursor {
    display: inline-block;
    width: 6px;
    height: 12px;
    margin-left: 3px;
    vertical-align: middle;
    opacity: 0.7;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 0; }
  }

  /* ─── Supplementary ─── */
  .supplementary {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding-top: 8px;
  }

  .rule { width: 60%; height: 1px; }

  .sigil-small { opacity: 0.25; width: 70px; height: 70px; }
  .sigil-small :global(.sigil) { width: 70px; height: 70px; }

  .branding {
    font-size: 0.5rem;
    letter-spacing: 0.15em;
    opacity: 0.4;
  }
</style>
