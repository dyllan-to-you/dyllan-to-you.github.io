<script lang="ts">
let { name, description } = $props();
</script>

<div class="card">
  <div class="name">
    <span class="prompt">&gt;</span> {name}
  </div>
  <div class="desc">{description}</div>
</div>

<style>
  .card {
    padding: 10px 12px;
    border: 1px solid rgba(45, 107, 63, 0.2);
    border-radius: 2px;
    background: linear-gradient(135deg, rgba(240, 228, 204, 0.53), rgba(224, 208, 176, 0.27));
  }
  .name {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-green);
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    margin-bottom: 3px;
  }
  .prompt { opacity: 0.5; }
  .desc {
    font-family: var(--tome-font-body);
    color: var(--tome-ink-light);
    font-size: 0.82rem;
    padding-left: 14px;
  }
</style>
