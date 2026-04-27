<script lang="ts">
import CornerOrnament from "./CornerOrnament.svelte";
import CoverSigil from "./CoverSigil.svelte";

let { variant = "front" } = $props();
</script>

<div class="page" class:back={variant !== 'front'}>
  {#each ['tl', 'tr', 'br', 'bl'] as pos}
    <CornerOrnament position={pos}/>
  {/each}
  <div class="border-frame" class:back={variant !== 'front'}></div>

  {#if variant === 'front'}
    <div class="sigil-wrap">
      <CoverSigil idPrefix="cover"/>
    </div>
    <h1>Dyllan Justice Tô-Yu</h1>
    <div class="gold-line"></div>
    <p class="subtitle">Creative · Solarpunk · Engineer</p>
  {:else}
    <div class="sigil-muted">
      <CoverSigil idPrefix="back"/>
    </div>
  {/if}
</div>

<style>
  .page {
    width: 100%; height: 100%; box-sizing: border-box;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    position: relative;
    background: var(--tome-bg-leather);
    transform: translateZ(0);
    padding: clamp(16px, 4vmin, 32px);
  }
  .border-frame {
    position: absolute; inset: 0;
    border: 1px solid rgba(201, 168, 76, 0.2);
    margin: clamp(10px, 2.5vmin, 20px); border-radius: 2px;
    pointer-events: none;
  }
  .border-frame.back {
    border-color: rgba(201, 168, 76, 0.13);
  }
  .sigil-wrap {
    margin-bottom: clamp(12px, 3vmin, 24px);
    animation: sigilPulse 4s ease-in-out infinite;
  }
  .sigil-muted { opacity: 0.3; }
  h1 {
    font-family: var(--tome-font-display);
    color: var(--tome-gold);
    text-shadow: 0 0 20px rgba(201, 168, 76, 0.27), 0 2px 4px rgba(0,0,0,.5);
    font-size: clamp(var(--tome-text-lead), 3.5vmin, var(--tome-text-display));
    letter-spacing: 0.18em;
    margin: 0 0 clamp(4px, 1vmin, 8px);
    text-transform: uppercase;
    text-align: center;
    max-width: 90%;
  }
  .gold-line {
    width: clamp(60px, 15vmin, 120px); height: 1px;
    background: linear-gradient(90deg, transparent, var(--tome-gold), transparent);
    margin: clamp(4px, 1vmin, 8px) 0;
  }
  .subtitle {
    font-family: var(--tome-font-body);
    color: var(--tome-gold-bright);
    font-size: clamp(var(--tome-text-caption), 2vmin, var(--tome-text-chrome));
    letter-spacing: 0.2em;
    opacity: 0.7; margin: 0; text-transform: uppercase;
    text-align: center;
    max-width: 90%;
  }
</style>
