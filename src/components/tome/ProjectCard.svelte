<script lang="ts">
let {
  name,
  description,
  href,
  onNavigate,
}: {
  name: string;
  description: string;
  href?: string;
  onNavigate?: () => void;
} = $props();

/* If onNavigate is provided and the click is a plain left-click (no modifiers),
   intercept and hand off to the tome's in-book navigation. Otherwise let the
   browser handle the anchor normally — preserves right-click, open-in-new-tab,
   middle-click-for-new-tab, and direct-URL share semantics. */
function handleClick(e: MouseEvent) {
  if (!onNavigate) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if ("button" in e && e.button !== 0) return;
  e.preventDefault();
  onNavigate();
}
</script>

{#if href}
  <a class="card card-link" {href} onclick={handleClick}>
    <div class="name">
      <span class="prompt">&gt;</span> {name}
    </div>
    <div class="desc">{description}</div>
  </a>
{:else}
  <div class="card">
    <div class="name">
      <span class="prompt">&gt;</span> {name}
    </div>
    <div class="desc">{description}</div>
  </div>
{/if}

<style>
  .card {
    padding: 10px 12px;
    border: 1px solid rgba(45, 107, 63, 0.2);
    border-radius: 2px;
    background: linear-gradient(135deg, rgba(240, 228, 204, 0.53), rgba(224, 208, 176, 0.27));
  }
  .card-link {
    display: block;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
  }
  .card-link:hover,
  .card-link:focus-visible {
    border-color: var(--tome-term-green);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(45, 107, 63, 0.18);
    outline: none;
  }
  .name {
    font-family: var(--tome-font-mono);
    color: var(--tome-term-green);
    font-size: var(--tome-text-caption);
    letter-spacing: 0.05em;
    margin-bottom: 3px;
  }
  .prompt { opacity: 0.5; }
  .desc {
    font-family: var(--tome-font-body);
    color: var(--tome-ink-light);
    font-size: var(--tome-text-chrome);
    padding-left: 14px;
  }
</style>
