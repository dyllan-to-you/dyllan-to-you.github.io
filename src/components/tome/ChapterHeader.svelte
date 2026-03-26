<script>
  import { fonts, colors } from './tokens.js';
  let { number, title, subtitle } = $props();
</script>

<div class="chapter-label" style:font-family={fonts.mono} style:color={colors.termGreen}>
  &gt; chapter {number}
</div>
<h2 class="chapter-title" style:font-family={fonts.display} style:color={colors.ink}>
  {title}
</h2>
<p class="chapter-subtitle" style:font-family={fonts.body} style:color={colors.inkLight}>
  {subtitle}
</p>
<div class="divider" style:background="linear-gradient(90deg, {colors.termGreen}, {colors.copper}, transparent)"></div>

<style>
  .chapter-label {
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    margin-bottom: 4px;
  }
  .chapter-title {
    font-size: 1.35rem;
    margin: 0 0 4px;
    letter-spacing: 0.08em;
  }
  .chapter-subtitle {
    font-size: 0.8rem;
    font-style: italic;
    margin: 0 0 20px;
  }
  .divider {
    width: 80px;
    height: 1px;
    margin: 0 0 20px;
  }
</style>
