<script>
  import { fonts, colors } from './tokens.js';
  let { number } = $props();
</script>

<div class="page-number" style:font-family={fonts.heading} style:color={colors.copper}>
  — {number} —
</div>

<style>
  .page-number {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.6rem;
    opacity: 0.4;
  }
</style>
