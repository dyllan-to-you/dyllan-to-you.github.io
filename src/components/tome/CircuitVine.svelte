<script>
  import { colors } from './tokens.js';

  /** @type {'left' | 'right'} Which side of a spread this page sits on. */
  let { page = 'right' } = $props();
</script>

<svg
  viewBox="0 0 40 500"
  class="vine"
  style:left={page === 'right' ? '0' : 'auto'}
  style:right={page === 'left' ? '0' : 'auto'}
  style:transform={page === 'left' ? 'scaleX(-1)' : 'none'}
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M20 0 L20 30 Q20 50 30 60 L30 80 Q30 100 20 110 L20 160 Q20 180 10 190 L10 220 Q10 240 20 250 L20 300 Q20 320 30 330 L30 360 Q30 380 20 390 L20 440 Q20 460 10 470 L10 500" fill="none" stroke={colors.gold} stroke-width="0.8"/>
  <path d="M20 50 L35 50 M20 110 L5 110 M20 180 L35 180 M20 250 L5 250 M20 330 L35 330 M20 390 L5 390" fill="none" stroke={colors.copper} stroke-width="0.5"/>
  {#each [50,110,180,250,330,390] as y, i}
    <circle cx={i % 2 === 0 ? 35 : 5} cy={y} r="2" fill={colors.gold} opacity="0.6"/>
  {/each}
  {#each [30,160,300,440] as y, i}
    <circle cx="20" cy={y} r="1.5" fill={colors.copper} opacity="0.5"/>
  {/each}
</svg>

<style>
  .vine {
    position: absolute;
    top: 5%;
    height: 90%;
    width: 40px;
    opacity: 0.3;
  }
</style>
