<script>
  import { fonts, colors, backgrounds } from './tokens.js';
  import CircuitVine from './CircuitVine.svelte';
  import PageNumber from './PageNumber.svelte';
</script>

<div class="page" style:background={backgrounds.paper}>
  <CircuitVine page="right"/>
  <div class="terminal">
    <div class="prompt" style:color={colors.termDim} style:font-family={fonts.mono}>&gt; cat /etc/motd</div>
    <blockquote style:font-family={fonts.body} style:color={colors.ink}>
      "Assert nothing.<br/>Derive everything."
    </blockquote>
    <div class="rule" style:background="linear-gradient(90deg, transparent, {colors.copper}, transparent)"></div>
    <p class="attribution" style:font-family={fonts.mono} style:color={colors.termDim}>— THE UR FRAMEWORK</p>
  </div>
  <PageNumber number="i"/>
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 40px 36px; position: relative;
  }
  .terminal { text-align: center; }
  .prompt {
    font-size: 0.6rem;
    letter-spacing: 0.05em;
    margin-bottom: 16px;
  }
  blockquote {
    font-size: 1.1rem; font-style: italic;
    text-align: center; line-height: 1.8;
    max-width: 80%; margin: 0 auto;
  }
  .rule { width: 60px; height: 1px; margin: 20px auto; }
  .attribution { font-size: 0.6rem; letter-spacing: 0.1em; opacity: 0.6; }
</style>
