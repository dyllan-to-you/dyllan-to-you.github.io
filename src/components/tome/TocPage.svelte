<script lang="ts">
let { tocEntries, activePage = 1, onNavigate, onFlipBack } = $props();
</script>

<div class="page" onclick={(e) => { if (e.target.closest('button')) return; onFlipBack?.(); }} role="presentation">
  <nav class="toc" aria-label="Table of contents">
    <div class="terminal-chrome">
      <button
        class="path"
        class:path-active={activePage === 0}
        onclick={() => onNavigate(0)}
        aria-label="Return to front cover"
        aria-current={activePage === 0 ? 'page' : undefined}
      >~/dyllan.to</button>
    </div>
    <div class="tree">
      <div class="tree-root">.</div>
      {#each tocEntries as entry, i}
        {@const active = entry.index === activePage}
        {@const last = i === tocEntries.length - 1}
        <button
          class="tree-entry"
          class:active
          onclick={() => onNavigate(entry.index)}
          aria-current={active ? 'page' : undefined}
        >
          <span class="branch">{last ? '└──' : '├──'}</span>
          <span class="leaf" class:leaf-active={active}>{entry.toc}</span>
          {#if active}<span class="cursor"></span>{/if}
        </button>
      {/each}
    </div>
  </nav>

  <div class="scanlines"></div>
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    display: flex; flex-direction: column;
    padding: 60px 24px 20px;
    position: relative;
    overflow: hidden;
    background: var(--tome-bg-paper);
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
    font-family: var(--tome-font-mono);
    color: var(--tome-term-green);
    font-size: 0.65rem;
    letter-spacing: 0.04em;
    background: none;
    border: none;
    padding: 2px 4px;
    margin: -2px -4px;
    cursor: pointer;
    border-radius: 2px;
    transition: background 0.2s, opacity 0.2s;
    opacity: 0.85;
  }

  .path:hover {
    background: rgba(45, 107, 63, 0.08);
    opacity: 1;
  }

  .path:focus-visible {
    outline: 1px solid rgba(45, 107, 63, 0.4);
    outline-offset: 1px;
  }

  .path-active {
    background: rgba(45, 107, 63, 0.1);
    opacity: 1;
  }

  .tree {
    font-family: var(--tome-font-mono);
    color: var(--tome-ink);
    display: flex;
    flex-direction: column;
  }

  .tree-root {
    color: var(--tome-term-dim);
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
    color: var(--tome-term-dim);
    font-size: 0.75rem;
    white-space: pre;
    flex-shrink: 0;
    user-select: none;
    margin-right: 6px;
  }

  .leaf {
    color: var(--tome-ink);
    font-size: 0.75rem;
    letter-spacing: 0.02em;
    transition: color 0.2s;
  }

  .leaf-active {
    color: var(--tome-term-green);
  }

  .tree-entry:hover .leaf {
    color: rgba(45, 107, 63, 0.8);
  }

  .cursor {
    display: inline-block;
    width: 6px;
    height: 12px;
    margin-left: 3px;
    vertical-align: middle;
    background: var(--tome-term-green);
    opacity: 0.7;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 0; }
  }

</style>
