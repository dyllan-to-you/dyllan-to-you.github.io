<script>
  import { fonts, colors, backgrounds } from './tokens.js';
  import CircuitVine from './CircuitVine.svelte';
  import PageNumber from './PageNumber.svelte';
</script>

<div class="page" style:background={backgrounds.paper}>
  <CircuitVine page="left"/>
  <div class="body" style:color={colors.ink}>
    <div>
      <div class="label" style:font-family={fonts.mono} style:color={colors.termGreen}>&gt; philosophy</div>
      <p style:font-family={fonts.body}>Local-first. Data-sovereign. Community-owned. The solarpunk ethos isn't aesthetic — it's architectural. Every system should make its inhabitants more free, not less.</p>
    </div>
    <div class="section-rule" style:background="linear-gradient(90deg, {colors.termGreen}44, transparent)"></div>
    <div>
      <div class="label" style:font-family={fonts.mono} style:color={colors.termGreen}>&gt; practice</div>
      <p style:font-family={fonts.body}>Recursive specification as design method. Formal modeling before implementation. Convergent systems that derive structure from first principles — assert nothing, derive everything.</p>
    </div>
  </div>
  <PageNumber number="ii"/>
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    padding: 40px 32px 32px; position: relative;
  }
  .body {
    font-size: 0.9rem; line-height: 1.7;
    display: flex; flex-direction: column; gap: 16px;
    padding-top: 8px;
  }
  .body p { margin: 0; }
  .label { font-size: 0.6rem; letter-spacing: 0.1em; margin-bottom: 4px; }
  .section-rule { width: 60px; height: 1px; }
</style>
