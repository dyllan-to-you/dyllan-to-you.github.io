<script>
import ChapterHeader from "./ChapterHeader.svelte";
import CircuitVine from "./CircuitVine.svelte";
import PageNumber from "./PageNumber.svelte";
import ProjectCard from "./ProjectCard.svelte";

let { page, number, vine } = $props();
</script>

<div class="page">
  {#if page.type !== 'colophon'}
    <CircuitVine page={vine}/>
  {/if}

  <div class="scroll-area">
  {#if page.type === 'epigraph'}
    <div class="centered">
      <div class="prompt">&gt; {page.prompt}</div>
      <blockquote>
        {@html page.quote}
      </blockquote>
      <div class="rule"></div>
      <p class="attribution">&mdash; {page.attribution}</p>
    </div>

  {:else if page.type === 'prose'}
    <div class="body">
      {#each page.sections as section, i}
        {#if i > 0}
          <div class="section-rule"></div>
        {/if}
        <div>
          <div class="label">&gt; {section.label}</div>
          <p>{section.text}</p>
        </div>
      {/each}
    </div>

  {:else if page.type === 'chapter'}
    <ChapterHeader number={page.chapter.number} title={page.chapter.title} subtitle={page.chapter.subtitle}/>
    <div class="body">
      {#each page.paragraphs as para}
        <p>
          {#if para.drop}
            <span class="drop">{para.drop}</span>
          {/if}
          {para.text}
        </p>
      {/each}
      {#if page.closing}
        <p class="closing">
          {#each page.closing.split('\n') as line, i}
            {#if i > 0}<br/>{/if}
            &gt; {line}
          {/each}
        </p>
      {/if}
    </div>

  {:else if page.type === 'cards'}
    {#if page.chapter}
      <ChapterHeader number={page.chapter.number} title={page.chapter.title} subtitle={page.chapter.subtitle}/>
    {:else if page.header}
      <div class="header">&gt; {page.header}</div>
    {/if}
    <div class="cards">
      {#each page.cards as card}
        <ProjectCard name={card.name} description={card.description}/>
      {/each}
    </div>

  {:else if page.type === 'colophon'}
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
          {@html line.text}
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
  }

  /* Remove fade mask when content fits (not scrollable) */
  .scroll-area:not([style]):where(:not(:hover)) {
    /* The mask is always applied for simplicity — the 32px fade
       at the bottom is subtle enough to be invisible when content
       doesn't reach the edge. */
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
  .centered {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    height: 100%; text-align: center;
  }
  .prompt {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-dim);
    font-size: 0.6rem; letter-spacing: 0.05em;
    margin-bottom: 16px;
  }
  blockquote {
    font-family: var(--tome-font-body);
    color: var(--tome-ink);
    font-size: 1.1rem; font-style: italic;
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
    font-size: 0.6rem; letter-spacing: 0.1em; opacity: 0.6;
  }

  /* ─── Prose / Chapter ─── */
  .body {
    font-family: var(--tome-font-body);
    color: var(--tome-ink);
    font-size: 0.9rem; line-height: 1.7;
  }
  .body p { margin: 0 0 14px; }
  .body p:last-child { margin: 0; }
  .label {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-green);
    font-size: 0.6rem; letter-spacing: 0.1em; margin-bottom: 4px;
  }
  .section-rule {
    width: 60px; height: 1px;
    background: linear-gradient(90deg, rgba(45, 107, 63, 0.27), transparent);
  }
  .drop {
    font-family: var(--tome-font-display);
    color: var(--tome-term-green);
    font-size: 2rem; float: left; line-height: 1; margin-right: 6px;
  }
  .closing {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-dim);
    font-size: 0.7rem; line-height: 1.9; letter-spacing: 0.02em;
  }

  /* ─── Cards ─── */
  .header {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-dim);
    font-size: 0.6rem; letter-spacing: 0.05em;
    margin-bottom: 12px; opacity: 0.5;
  }
  .cards { display: flex; flex-direction: column; gap: 14px; }

  /* ─── Colophon ─── */
  .colophon-label {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-green);
    font-size: 0.6rem; letter-spacing: 0.1em; margin-bottom: 16px; text-align: center;
  }
  .colophon-rule {
    width: 40px; height: 1px; margin: 0 auto 20px;
    background: linear-gradient(90deg, transparent, var(--tome-gold), transparent);
  }
  .colophon-body {
    font-family: var(--tome-font-body);
    color: var(--tome-ink-light);
    font-size: 0.85rem; text-align: center; line-height: 1.8;
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
    font-size: 0.65rem; margin: 0;
  }
</style>
