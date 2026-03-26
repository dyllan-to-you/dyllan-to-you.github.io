<script>
  import { fonts, colors } from './tokens.js';
  let { name, description } = $props();
</script>

<div class="card" style:border-color="{colors.termGreen}33" style:background="linear-gradient(135deg, {colors.paper}88, {colors.paperEdge}44)">
  <div class="name" style:font-family={fonts.mono} style:color={colors.termGreen}>
    <span class="prompt">&gt;</span> {name}
  </div>
  <div class="desc" style:font-family={fonts.body} style:color={colors.inkLight}>{description}</div>
</div>

<style>
  .card {
    padding: 10px 12px;
    border: 1px solid;
    border-radius: 2px;
  }
  .name {
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    margin-bottom: 3px;
  }
  .prompt { opacity: 0.5; }
  .desc {
    font-size: 0.82rem;
    padding-left: 14px;
  }
</style>
