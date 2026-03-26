<script>
  import { colors } from './tokens.js';

  /** @type {string} Unique prefix for SVG IDs to avoid collisions across instances. */
  let { idPrefix = 's' } = $props();

  const glow = `${idPrefix}-glow`;
  const grad = `${idPrefix}-grad`;

  const DEG = Math.PI / 180;
  const hexAngles = [0, 60, 120, 180, 240, 300];
  const pentAngles = [0, 72, 144, 216, 288];
</script>

<svg viewBox="0 0 200 200" class="sigil" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id={glow}>
      <feGaussianBlur stdDeviation="2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id={grad} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color={colors.goldBright}/>
      <stop offset="100%" stop-color={colors.gold}/>
    </radialGradient>
  </defs>

  <!-- Concentric rings -->
  <circle cx="100" cy="100" r="85" fill="none" stroke={colors.gold} stroke-width="1.5" opacity="0.5"/>
  <circle cx="100" cy="100" r="75" fill="none" stroke={colors.gold} stroke-width="0.5" opacity="0.3"/>
  <circle cx="100" cy="100" r="65" fill="none" stroke={colors.copper} stroke-width="0.8" opacity="0.4"/>

  <!-- Hexagonal radial spokes + node points -->
  {#each hexAngles as angle, i}
    {@const r = angle * DEG}
    {@const ox = 100 + 80 * Math.cos(r)}
    {@const oy = 100 + 80 * Math.sin(r)}
    <g>
      <line x1={100 + 45 * Math.cos(r)} y1={100 + 45 * Math.sin(r)} x2={ox} y2={oy} stroke={colors.gold} stroke-width="1" opacity="0.6"/>
      <circle cx={ox} cy={oy} r="3" fill="none" stroke={colors.goldBright} stroke-width="0.8" filter="url(#{glow})" opacity="0.7"/>
      <circle cx={ox} cy={oy} r="1.2" fill={colors.goldBright} opacity="0.8"/>
    </g>
  {/each}

  <!-- Star of David -->
  <polygon points="100,40 148,125 52,125" fill="none" stroke="url(#{grad})" stroke-width="1.5" opacity="0.7"/>
  <polygon points="100,160 52,75 148,75" fill="none" stroke="url(#{grad})" stroke-width="1.5" opacity="0.7"/>

  <!-- Pentagonal vine paths -->
  {#each pentAngles as angle, i}
    {@const r1 = angle * DEG}
    {@const r2 = (angle + 36) * DEG}
    <g>
      <path d="M{100 + 55 * Math.cos(r1)},{100 + 55 * Math.sin(r1)} Q{100 + 20 * Math.cos(r1 + 0.3)},{100 + 20 * Math.sin(r1 + 0.3)} {100 + 35 * Math.cos(r2)},{100 + 35 * Math.sin(r2)}" fill="none" stroke={colors.termGreen} stroke-width="0.8" opacity="0.4"/>
      <circle cx={100 + 55 * Math.cos(r1)} cy={100 + 55 * Math.sin(r1)} r="1" fill={colors.termGreen} opacity="0.5"/>
    </g>
  {/each}

  <!-- Central core -->
  <circle cx="100" cy="100" r="8" fill="none" stroke={colors.goldBright} stroke-width="1.5" filter="url(#{glow})"/>
  <circle cx="100" cy="100" r="3" fill={colors.goldBright} opacity="0.9"/>
</svg>

<style>
  .sigil {
    width: 140px;
    height: 140px;
  }
</style>
