<script lang="ts">
import ChapterHeader from "./ChapterHeader.svelte";
import CircuitVine from "./CircuitVine.svelte";
import PageNumber from "./PageNumber.svelte";
import ProjectCard from "./ProjectCard.svelte";

let {
  page,
  number,
  vine,
  registerScrollArea,
  onCardNavigate,
}: {
  page: Record<string, unknown>;
  number: string | null;
  vine: string;
  registerScrollArea?: (el: HTMLElement | null) => void;
  onCardNavigate?: (href: string) => void;
} = $props();

let scrollAreaEl = $state<HTMLElement | null>(null);

$effect(() => {
  registerScrollArea?.(scrollAreaEl);
  return () => registerScrollArea?.(null);
});
</script>

<div class="page" class:epigraph={page.quote} class:colophon={!!page.lines}>
  {#if !page.lines}
    <CircuitVine page={vine}/>
  {/if}

  <div class="scroll-area" bind:this={scrollAreaEl}>
    <!-- Chapter header (if present) -->
    {#if page.chapter}
      <ChapterHeader number={page.chapter.number} title={page.chapter.title} subtitle={page.chapter.subtitle}/>
    {/if}

    <!-- Terminal header label (if present, no chapter) -->
    {#if page.header && !page.chapter}
      <div class="header">&gt; {page.header}</div>
    {/if}

    <!-- Epigraph layout (centered quote + attribution) -->
    {#if page.quote}
      <div class="centered">
        {#if page.prompt}
          <div class="prompt">&gt; {page.prompt}</div>
        {/if}
        <blockquote>{page.quote}</blockquote>
        <div class="rule"></div>
        <p class="attribution">&mdash; {page.attribution}</p>
      </div>
    {/if}

    <!-- Page body (pre-rendered HTML from YAML) -->
    {#if page.body}
      <div class="body">
        {@html page.body}
      </div>
    {/if}

    <!-- Cards (if present) -->
    {#if page.cards && page.cards.length > 0}
      <div class="cards">
        {#each page.cards as card}
          <ProjectCard
            name={card.name}
            description={card.description}
            href={card.href}
            onNavigate={card.href && onCardNavigate ? () => onCardNavigate(card.href) : undefined}
          />
        {/each}
      </div>
    {:else if page.cardsSource === 'writings'}
      <div class="empty-state">
        <span class="prompt">&gt;</span> no posts yet. the ink is still wet.
      </div>
    {/if}

    <!-- Closing terminal text (if present) -->
    {#if page.closing}
      <p class="closing">
        {#each page.closing.split('\n') as line, i}
          {#if i > 0}<br/>{/if}
          &gt; {line}
        {/each}
      </p>
    {/if}

    <!-- Colophon lines (if present) -->
    {#if page.lines}
      <div class="colophon-label">&gt; colophon</div>
      <div class="colophon-rule"></div>
      <div class="colophon-body">
        {#each page.lines as line, i}
          {#if i === page.lines.length - 1}
            <div class="thin-rule"></div>
          {/if}
          <p
            class:italic={line.italic}
            class:imprint={line.mono}
          >
            {line.text}
          </p>
        {/each}
      </div>
    {/if}
  </div>

  <PageNumber {number}/>
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    padding: 60px 32px 32px; position: relative;
    background: var(--tome-bg-paper);
    display: flex; flex-direction: column;
  }

  .scroll-area {
    flex: 1; min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    mask-image: linear-gradient(to bottom, black calc(100% - 32px), transparent);
    -webkit-mask-image: linear-gradient(to bottom, black calc(100% - 32px), transparent);
    padding-bottom: 32px;
    /* Re-enable text selection inside the readable content area; the tome
       root disables selection globally to prevent stray drags during page
       flips, but the prose itself should be selectable. */
    user-select: text;
    -webkit-user-select: text;
  }

  /* Subtle scrollbar that matches the parchment aesthetic */
  .scroll-area::-webkit-scrollbar { width: 4px; }
  .scroll-area::-webkit-scrollbar-track { background: transparent; }
  .scroll-area::-webkit-scrollbar-thumb {
    background: var(--tome-copper, rgba(160, 120, 60, 0.3));
    border-radius: 2px;
  }
  .scroll-area { scrollbar-width: thin; scrollbar-color: var(--tome-copper, rgba(160, 120, 60, 0.3)) transparent; }

  /* ─── Epigraph ─── */
  .epigraph .scroll-area {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }
  .centered {
    text-align: center;
  }
  .prompt {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-dim);
    font-size: var(--tome-text-caption); letter-spacing: 0.05em;
    margin-bottom: 16px;
  }
  blockquote {
    font-family: var(--tome-font-body);
    color: var(--tome-ink);
    font-size: var(--tome-text-title); font-style: italic;
    text-align: center; line-height: 1.8;
    max-width: 80%; margin: 0 auto;
  }
  .rule {
    width: 60px; height: 1px; margin: 20px auto;
    background: linear-gradient(90deg, transparent, var(--tome-copper), transparent);
  }
  .attribution {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-dim);
    font-size: var(--tome-text-caption); letter-spacing: 0.1em; opacity: 0.6;
  }

  /* ─── Body (pre-rendered HTML from YAML) ─── */
  .body {
    font-family: var(--tome-font-body);
    color: var(--tome-ink);
    font-size: var(--tome-text-body); line-height: 1.7;
  }
  .body :global(p) { margin: 0 0 14px; }
  .body :global(p:last-child) { margin: 0; }

  /* Section labels — h2 rendered as terminal-green labels */
  .body :global(h2) {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-green);
    font-size: var(--tome-text-caption); letter-spacing: 0.1em; margin: 0 0 4px;
    font-weight: normal;
  }
  .body :global(h2::before) { content: "> "; }

  /* Section rules */
  .body :global(hr) {
    width: 60px; height: 1px; border: none; margin: 12px 0;
    background: linear-gradient(90deg, rgba(45, 107, 63, 0.27), transparent);
  }

  /* ─── Header ─── */
  .header {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-dim);
    font-size: var(--tome-text-caption); letter-spacing: 0.05em;
    margin-bottom: 12px; opacity: 0.5;
  }

  /* ─── Cards ─── */
  .cards { display: flex; flex-direction: column; gap: 14px; }

  /* ─── Empty state (no published writings) ─── */
  .empty-state {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-dim);
    font-size: var(--tome-text-chrome); letter-spacing: 0.05em;
    padding: 24px 0; opacity: 0.7;
  }
  .empty-state .prompt { opacity: 0.5; }

  /* ─── Closing ─── */
  .closing {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-dim);
    font-size: var(--tome-text-caption); line-height: 1.9; letter-spacing: 0.02em;
  }

  /* ─── Colophon ─── */
  .colophon-label {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-green);
    font-size: var(--tome-text-caption); letter-spacing: 0.1em; margin-bottom: 16px; text-align: center;
  }
  .colophon-rule {
    width: 40px; height: 1px; margin: 0 auto 20px;
    background: linear-gradient(90deg, transparent, var(--tome-gold), transparent);
  }
  .colophon-body {
    font-family: var(--tome-font-body);
    color: var(--tome-ink-light);
    font-size: var(--tome-text-chrome); text-align: center; line-height: 1.8;
  }
  .colophon-body p { margin: 0 0 12px; }
  .italic { font-style: italic; }
  .thin-rule {
    width: 20px; height: 1px; margin: 16px auto; opacity: 0.3;
    background: var(--tome-copper);
  }
  .imprint {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-dim);
    font-size: var(--tome-text-caption); margin: 0;
  }
</style>
