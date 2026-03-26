<script>
  import { fonts, colors, backgrounds } from './tokens.js';
  import CircuitVine from './CircuitVine.svelte';
  import PageNumber from './PageNumber.svelte';
</script>

<div class="page" style:background={backgrounds.paper}>
  <CircuitVine page="right"/>
  <div class="colophon-label" style:font-family={fonts.mono} style:color={colors.termGreen}>&gt; colophon</div>
  <div class="rule" style:background="linear-gradient(90deg, transparent, {colors.gold}, transparent)"></div>
  <div class="body" style:font-family={fonts.body} style:color={colors.inkLight}>
    <p>Crafted with intention.</p>
    <p class="italic">Built on sovereign systems<br/>and transparent tools.</p>
    <div class="thin-rule" style:background={colors.copper}></div>
    <p class="imprint" style:font-family={fonts.mono} style:color={colors.termDim}>Playfaire PBC · MMXXVI</p>
  </div>
  <PageNumber number="vii"/>
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 40px; position: relative;
  }
  .colophon-label { font-size: 0.6rem; letter-spacing: 0.1em; margin-bottom: 16px; }
  .rule { width: 40px; height: 1px; margin-bottom: 20px; }
  .body { font-size: 0.85rem; text-align: center; line-height: 1.8; }
  .body p { margin: 0 0 12px; }
  .italic { font-style: italic; }
  .thin-rule { width: 20px; height: 1px; margin: 16px auto; opacity: 0.3; }
  .imprint { font-size: 0.65rem; margin: 0; }
</style>
