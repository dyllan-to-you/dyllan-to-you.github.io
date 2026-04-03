<script>
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
      <stop offset="0%" class="stop-bright"/>
      <stop offset="100%" class="stop-gold"/>
    </radialGradient>
  </defs>

  <!-- Concentric rings -->
  <circle class="ring-outer" cx="100" cy="100" r="85"/>
  <circle class="ring-mid" cx="100" cy="100" r="75"/>
  <circle class="ring-inner" cx="100" cy="100" r="65"/>

  <!-- Hexagonal radial spokes + node points -->
  {#each hexAngles as angle, i}
    {@const r = angle * DEG}
    {@const ox = 100 + 80 * Math.cos(r)}
    {@const oy = 100 + 80 * Math.sin(r)}
    <g>
      <line class="spoke" x1={100 + 45 * Math.cos(r)} y1={100 + 45 * Math.sin(r)} x2={ox} y2={oy}/>
      <circle class="spoke-ring" cx={ox} cy={oy} r="3" filter="url(#{glow})"/>
      <circle class="spoke-dot" cx={ox} cy={oy} r="1.2"/>
    </g>
  {/each}

  <!-- Star of David -->
  <polygon class="star" points="100,40 148,125 52,125" stroke="url(#{grad})"/>
  <polygon class="star" points="100,160 52,75 148,75" stroke="url(#{grad})"/>

  <!-- Pentagonal vine paths -->
  {#each pentAngles as angle, i}
    {@const r1 = angle * DEG}
    {@const r2 = (angle + 36) * DEG}
    <g>
      <path class="vine-path" d="M{100 + 55 * Math.cos(r1)},{100 + 55 * Math.sin(r1)} Q{100 + 20 * Math.cos(r1 + 0.3)},{100 + 20 * Math.sin(r1 + 0.3)} {100 + 35 * Math.cos(r2)},{100 + 35 * Math.sin(r2)}"/>
      <circle class="vine-dot" cx={100 + 55 * Math.cos(r1)} cy={100 + 55 * Math.sin(r1)} r="1"/>
    </g>
  {/each}

  <!-- Central core -->
  <circle class="core-ring" cx="100" cy="100" r="8" filter="url(#{glow})"/>
  <circle class="core-dot" cx="100" cy="100" r="3"/>
</svg>

<style>
  .sigil {
    width: 140px;
    height: 140px;
  }

  /* Gradient stops — CSS can style these via stop-color */
  .stop-bright { stop-color: var(--tome-gold-bright); }
  .stop-gold   { stop-color: var(--tome-gold); }

  /* Rings */
  .ring-outer { fill: none; stroke: var(--tome-gold); stroke-width: 1.5; opacity: 0.5; }
  .ring-mid   { fill: none; stroke: var(--tome-gold); stroke-width: 0.5; opacity: 0.3; }
  .ring-inner { fill: none; stroke: var(--tome-copper); stroke-width: 0.8; opacity: 0.4; }

  /* Spokes */
  .spoke      { stroke: var(--tome-gold); stroke-width: 1; opacity: 0.6; }
  .spoke-ring { fill: none; stroke: var(--tome-gold-bright); stroke-width: 0.8; opacity: 0.7; }
  .spoke-dot  { fill: var(--tome-gold-bright); opacity: 0.8; }

  /* Star */
  .star { fill: none; stroke-width: 1.5; opacity: 0.7; }

  /* Vines */
  .vine-path { fill: none; stroke: var(--tome-term-green); stroke-width: 0.8; opacity: 0.4; }
  .vine-dot  { fill: var(--tome-term-green); opacity: 0.5; }

  /* Core */
  .core-ring { fill: none; stroke: var(--tome-gold-bright); stroke-width: 1.5; }
  .core-dot  { fill: var(--tome-gold-bright); opacity: 0.9; }
</style>
