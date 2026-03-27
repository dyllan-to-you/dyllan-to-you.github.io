<script>
  import { fonts, colors, backgrounds } from './tokens.js';
  import CircuitVine from './CircuitVine.svelte';
  import ChapterHeader from './ChapterHeader.svelte';
  import ProjectCard from './ProjectCard.svelte';
  import PageNumber from './PageNumber.svelte';

  let { page, number, vine } = $props();
</script>

<div class="page" style:background={backgrounds.paper}>
  <CircuitVine page={vine}/>

  {#if page.type === 'epigraph'}
    <div class="centered">
      <div class="prompt" style:color={colors.termDim} style:font-family={fonts.mono}>&gt; {page.prompt}</div>
      <blockquote style:font-family={fonts.body} style:color={colors.ink}>
        {@html page.quote}
      </blockquote>
      <div class="rule" style:background="linear-gradient(90deg, transparent, {colors.copper}, transparent)"></div>
      <p class="attribution" style:font-family={fonts.mono} style:color={colors.termDim}>&mdash; {page.attribution}</p>
    </div>

  {:else if page.type === 'prose'}
    <div class="body" style:font-family={fonts.body} style:color={colors.ink}>
      {#each page.sections as section, i}
        {#if i > 0}
          <div class="section-rule" style:background="linear-gradient(90deg, {colors.termGreen}44, transparent)"></div>
        {/if}
        <div>
          <div class="label" style:font-family={fonts.mono} style:color={colors.termGreen}>&gt; {section.label}</div>
          <p>{section.text}</p>
        </div>
      {/each}
    </div>

  {:else if page.type === 'chapter'}
    <ChapterHeader number={page.chapter.number} title={page.chapter.title} subtitle={page.chapter.subtitle}/>
    <div class="body" style:font-family={fonts.body} style:color={colors.ink}>
      {#each page.paragraphs as para}
        <p>
          {#if para.drop}
            <span class="drop" style:font-family={fonts.display} style:color={colors.termGreen}>{para.drop}</span>
          {/if}
          {para.text}
        </p>
      {/each}
      {#if page.closing}
        <p class="closing" style:font-family={fonts.mono} style:color={colors.termDim}>
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
      <div class="header" style:font-family={fonts.mono} style:color={colors.termDim}>&gt; {page.header}</div>
    {/if}
    <div class="cards">
      {#each page.cards as card}
        <ProjectCard name={card.name} description={card.description}/>
      {/each}
    </div>

  {:else if page.type === 'colophon'}
    <div class="colophon-label" style:font-family={fonts.mono} style:color={colors.termGreen}>&gt; colophon</div>
    <div class="colophon-rule" style:background="linear-gradient(90deg, transparent, {colors.gold}, transparent)"></div>
    <div class="colophon-body" style:font-family={fonts.body} style:color={colors.inkLight}>
      {#each page.lines as line, i}
        {#if i === page.lines.length - 1}
          <div class="thin-rule" style:background={colors.copper}></div>
        {/if}
        <p
          class:italic={line.italic}
          style:font-family={line.mono ? fonts.mono : undefined}
          style:color={line.mono ? colors.termDim : undefined}
          class:imprint={line.mono}
        >
          {@html line.text}
        </p>
      {/each}
    </div>
  {/if}

  <PageNumber {number}/>
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    padding: 40px 32px 32px; position: relative;
  }

  /* ─── Epigraph ─── */
  .centered {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    height: 100%; text-align: center;
  }
  .prompt {
    font-size: 0.6rem; letter-spacing: 0.05em;
    margin-bottom: 16px;
  }
  blockquote {
    font-size: 1.1rem; font-style: italic;
    text-align: center; line-height: 1.8;
    max-width: 80%; margin: 0 auto;
  }
  .rule { width: 60px; height: 1px; margin: 20px auto; }
  .attribution { font-size: 0.6rem; letter-spacing: 0.1em; opacity: 0.6; }

  /* ─── Prose / Chapter ─── */
  .body { font-size: 0.9rem; line-height: 1.7; }
  .body p { margin: 0 0 14px; }
  .body p:last-child { margin: 0; }
  .label { font-size: 0.6rem; letter-spacing: 0.1em; margin-bottom: 4px; }
  .section-rule { width: 60px; height: 1px; }
  .drop { font-size: 2rem; float: left; line-height: 1; margin-right: 6px; }
  .closing { font-size: 0.7rem; line-height: 1.9; letter-spacing: 0.02em; }

  /* ─── Cards ─── */
  .header {
    font-size: 0.6rem; letter-spacing: 0.05em;
    margin-bottom: 12px; opacity: 0.5;
  }
  .cards { display: flex; flex-direction: column; gap: 14px; }

  /* ─── Colophon ─── */
  .colophon-label { font-size: 0.6rem; letter-spacing: 0.1em; margin-bottom: 16px; text-align: center; }
  .colophon-rule { width: 40px; height: 1px; margin: 0 auto 20px; }
  .colophon-body { font-size: 0.85rem; text-align: center; line-height: 1.8; }
  .colophon-body p { margin: 0 0 12px; }
  .italic { font-style: italic; }
  .thin-rule { width: 20px; height: 1px; margin: 16px auto; opacity: 0.3; }
  .imprint { font-size: 0.65rem; margin: 0; }
</style>
