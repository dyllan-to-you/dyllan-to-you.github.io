<script lang="ts">
let { number, title, subtitle } = $props();
</script>

<div class="chapter-label">
  &gt; chapter {number}
</div>
<h2 class="chapter-title">
  {title}
</h2>
<p class="chapter-subtitle">
  {subtitle}
</p>
<div class="divider"></div>

<style>
  .chapter-label {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-green);
    font-size: var(--tome-text-caption);
    letter-spacing: 0.15em;
    margin-bottom: 4px;
  }
  .chapter-title {
    font-family: var(--tome-font-display);
    color: var(--tome-ink);
    font-size: var(--tome-text-display);
    margin: 0 0 4px;
    letter-spacing: 0.08em;
  }
  .chapter-subtitle {
    font-family: var(--tome-font-body);
    color: var(--tome-ink-light);
    font-size: var(--tome-text-chrome);
    font-style: italic;
    margin: 0 0 20px;
  }
  .divider {
    width: 80px;
    height: 1px;
    margin: 0 0 20px;
    background: linear-gradient(90deg, var(--tome-term-green), var(--tome-copper), transparent);
  }
</style>
