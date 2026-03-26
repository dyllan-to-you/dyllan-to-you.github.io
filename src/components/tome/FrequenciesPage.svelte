<script>
  import { fonts, colors, backgrounds } from './tokens.js';
  import CircuitVine from './CircuitVine.svelte';
  import ChapterHeader from './ChapterHeader.svelte';
  import PageNumber from './PageNumber.svelte';
</script>

<div class="page" style:background={backgrounds.paper}>
  <CircuitVine page="left"/>
  <ChapterHeader number="III" title="The Frequencies" subtitle="Sound, light, and presence"/>
  <div class="body" style:font-family={fonts.body} style:color={colors.ink}>
    <p>
      <span class="drop" style:font-family={fonts.display} style:color={colors.termGreen}>M</span>usic
      is the other architecture. Looping-based performance — layers built live, deconstructed
      live. Classical piano training as foundation, everything else as exploration.
    </p>
    <p>
      Multiple instruments. Art installations at Burning Man. The DJ persona Hatman, where the
      hat comes off and something else takes over.
    </p>
    <p class="closing" style:font-family={fonts.mono} style:color={colors.termDim}>
      &gt; every performance is a system that runs once
    </p>
  </div>
  <PageNumber number="vi"/>
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
