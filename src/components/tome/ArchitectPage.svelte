<script>
  import { fonts, colors, backgrounds } from './tokens.js';
  import CircuitVine from './CircuitVine.svelte';
  import ChapterHeader from './ChapterHeader.svelte';
  import PageNumber from './PageNumber.svelte';
</script>

<div class="page" style:background={backgrounds.paper}>
  <CircuitVine page="right"/>
  <ChapterHeader number="I" title="The Architect" subtitle="On building and becoming"/>
  <div class="body" style:font-family={fonts.body} style:color={colors.ink}>
    <p>
      <span class="drop" style:font-family={fonts.display} style:color={colors.termGreen}>S</span>ystems
      thinker. Software engineer. Solo founder of Playfaire PBC — a public benefit corporation
      building sovereign systems and transparent tools.
    </p>
    <p>
      Seven years in enterprise software taught the mechanics. The vision came from somewhere
      older — a conviction that technology should serve autonomy, not extract it.
    </p>
    <p class="closing" style:font-family={fonts.mono} style:color={colors.termDim}>
      &gt; location: San Francisco Bay Area<br/>
      &gt; building: ontology × orchestration × play
    </p>
  </div>
  <PageNumber number="iii"/>
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    padding: 40px 32px 32px; position: relative;
  }
  .body { font-size: 0.9rem; line-height: 1.7; }
  .body p { margin: 0 0 14px; }
  .body p:last-child { margin: 0; }
  .drop { font-size: 2rem; float: left; line-height: 1; margin-right: 6px; }
  .closing { font-size: 0.7rem; line-height: 1.9; letter-spacing: 0.02em; }
</style>
