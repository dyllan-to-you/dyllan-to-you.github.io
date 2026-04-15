<script lang="ts">
/** @type {'tl' | 'tr' | 'br' | 'bl'} */
let { position } = $props();

const rotations = { tl: 0, tr: 90, br: 180, bl: 270 };
const offsets = {
  tl: "top: 8px; left: 8px",
  tr: "top: 8px; right: 8px",
  br: "bottom: 8px; right: 8px",
  bl: "bottom: 8px; left: 8px",
};
</script>

<svg
  viewBox="0 0 50 50"
  class="corner"
  style="{offsets[position]}; transform: rotate({rotations[position]}deg)"
  xmlns="http://www.w3.org/2000/svg"
>
  <path class="stroke-gold" d="M5 0 L5 5 Q5 15 10 20 L15 25 Q20 30 20 35 L20 40"/>
  <path class="stroke-gold" d="M0 5 L5 5 Q15 5 20 10 L25 15 Q30 20 35 20 L40 20"/>
  <circle class="node-gold" cx="5" cy="5" r="2"/>
  <circle class="node-copper" cx="20" cy="20" r="1.5"/>
</svg>

<style>
  .corner {
    position: absolute;
    width: 50px;
    height: 50px;
    opacity: 0.5;
  }
  .stroke-gold {
    fill: none;
    stroke: var(--tome-gold);
    stroke-width: 1;
  }
  .node-gold {
    fill: var(--tome-gold);
    opacity: 0.7;
  }
  .node-copper {
    fill: var(--tome-copper);
    opacity: 0.5;
  }
</style>
