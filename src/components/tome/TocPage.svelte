<script>
  import { fonts, colors, backgrounds } from './tokens.js';
  import CoverSigil from './CoverSigil.svelte';

  let { flipped = 1, onNavigate } = $props();

  const entries = [
    { label: 'Epigraph', page: 1, number: 'i' },
    { label: 'Philosophy', page: 2, number: 'ii' },
    { label: 'The Architect', page: 3, number: 'iii' },
    { label: 'Core Projects', page: 4, number: 'iv' },
    { label: 'The Works', page: 5, number: 'v' },
    { label: 'Frequencies', page: 6, number: 'vi' },
    { label: 'Colophon', page: 7, number: 'vii' },
  ];
</script>

<div class="page" style:background={backgrounds.paper}>
  <!-- TOC half -->
  <nav class="toc" aria-label="Table of contents">
    <div class="toc-header" style:font-family={fonts.mono} style:color={colors.termDim}>&gt; contents</div>
    <ul>
      {#each entries as entry}
        {@const active = entry.page === flipped}
        <li>
          <button
            class="toc-entry"
            class:active
            style:font-family={fonts.body}
            style:color={active ? colors.termGreen : colors.ink}
            onclick={() => onNavigate(entry.page)}
            aria-current={active ? 'page' : undefined}
          >
            <span class="prompt" style:color={colors.termGreen} style:opacity={active ? 1 : 0}>&gt;</span>
            <span class="label">{entry.label}</span>
            <span class="number" style:font-family={fonts.mono} style:color={colors.termDim}>{entry.number}</span>
          </button>
        </li>
      {/each}
    </ul>
  </nav>

  <!-- Supplementary half -->
  <div class="supplementary">
    <div class="rule" style:background="linear-gradient(90deg, transparent, {colors.gold}44, transparent)"></div>
    <div class="sigil-small">
      <CoverSigil idPrefix="toc"/>
    </div>
    <div class="branding" style:font-family={fonts.mono} style:color={colors.termDim}>
      Playfaire PBC
    </div>
  </div>
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    display: flex; flex-direction: column;
    padding: 28px 24px 20px;
    position: relative;
  }

  .toc {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .toc-header {
    font-size: 0.55rem;
    letter-spacing: 0.1em;
    margin-bottom: 12px;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .toc-entry {
    display: flex;
    align-items: baseline;
    gap: 6px;
    width: 100%;
    background: none;
    border: none;
    padding: 5px 8px;
    cursor: pointer;
    border-radius: 2px;
    text-align: left;
    transition: background 0.2s;
  }

  .toc-entry:hover {
    background: rgba(201, 168, 76, 0.08);
  }

  .toc-entry:focus-visible {
    outline: 1px solid rgba(201, 168, 76, 0.4);
    outline-offset: 1px;
  }

  .toc-entry.active {
    background: rgba(45, 107, 63, 0.06);
  }

  .prompt {
    font-size: 0.7rem;
    width: 10px;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }

  .toc-entry:hover .prompt { opacity: 0.5 !important; }

  .label {
    flex: 1;
    font-size: 0.85rem;
  }

  .number {
    font-size: 0.6rem;
    letter-spacing: 0.05em;
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
