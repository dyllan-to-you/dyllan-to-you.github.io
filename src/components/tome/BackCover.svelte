<script>
  import { colors, backgrounds } from './tokens.js';
  import CornerOrnament from './CornerOrnament.svelte';
  import CoverSigil from './CoverSigil.svelte';
</script>

<div class="page" style:background={backgrounds.leather}>
  {#each ['tl', 'tr', 'br', 'bl'] as pos}
    <CornerOrnament position={pos}/>
  {/each}
  <div class="border-frame"></div>
  <div class="sigil-muted">
    <CoverSigil idPrefix="back"/>
  </div>
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .border-frame {
    position: absolute; inset: 0;
    border: 1px solid rgba(201,168,76,0.13);
    margin: 20px;
  }
  .sigil-muted { opacity: 0.3; }
</style>
