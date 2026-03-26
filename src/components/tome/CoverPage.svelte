<script>
  import { fonts, colors, backgrounds } from './tokens.js';
  import CornerOrnament from './CornerOrnament.svelte';
  import CoverSigil from './CoverSigil.svelte';
</script>

<div class="page" style:background={backgrounds.leather}>
  {#each ['tl', 'tr', 'br', 'bl'] as pos}
    <CornerOrnament position={pos}/>
  {/each}
  <div class="border-frame"></div>

  <div class="sigil-wrap">
    <CoverSigil idPrefix="cover"/>
  </div>
  <h1 style:font-family={fonts.display} style:color={colors.gold} style:text-shadow="0 0 20px {colors.gold}44, 0 2px 4px rgba(0,0,0,.5)">
    Justice
  </h1>
  <div class="gold-line"></div>
  <p class="subtitle" style:font-family={fonts.body} style:color={colors.goldBright}>
    Builder · Musician · Architect
  </p>
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    position: relative;
  }
  .border-frame {
    position: absolute; inset: 0;
    border: 1px solid rgba(201,168,76,0.2);
    margin: 20px; border-radius: 2px;
    pointer-events: none;
  }
  .sigil-wrap {
    margin-bottom: 24px;
    animation: sigilPulse 4s ease-in-out infinite;
  }
  h1 {
    font-size: 2.2rem;
    letter-spacing: 0.3em;
    margin: 0 0 8px;
    text-transform: uppercase;
  }
  .gold-line {
    width: 120px; height: 1px;
    background: linear-gradient(90deg, transparent, #c9a84c, transparent);
    margin: 8px 0;
  }
  .subtitle {
    font-size: 0.85rem;
    letter-spacing: 0.2em;
    opacity: 0.7;
    margin: 0;
    text-transform: uppercase;
  }
</style>
