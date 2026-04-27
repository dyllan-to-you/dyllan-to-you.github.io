<script lang="ts">
let { number } = $props();
</script>

<div class="page-number">
  — {number} —
</div>

<style>
  .page-number {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    font-family: var(--tome-font-heading);
    color: var(--tome-copper);
    font-size: var(--tome-text-caption);
    opacity: 0.4;
  }
</style>
