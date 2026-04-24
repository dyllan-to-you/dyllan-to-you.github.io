<script lang="ts">
/**
 * Variant N cover sigil: K's A/B alternation × L's per-bucket radial wave.
 *
 * Geometry (tangent-chord): 4 halving rings 128 → 64 → 32 → 16, each sparse
 * with drawSlots at even indices of its N-grid. Each ring renders twice —
 * set A at α, set B at α + π/N_k (HALF a triangle's angular width). Set A
 * and set B overlap by half the triangle width; together they cover 75%
 * of the ring's angular extent, with 25% empty.
 *
 * Animation (compound via SVG's multiplicative opacity inheritance):
 *   - Parent <g class="n-set-a/b">: K's slow counter-phase A↔B alternation
 *     at 6s with per-ring cascade (inner rings lead outer rings).
 *   - Child <path>: L's per-bucket radial wave at 5s with WIDER keyframes
 *     (0.15 → 1 → 0.15). Delay = r_norm · 0.9·period (positive, +
 *     fill-mode: backwards) → monotonic outward sweep.
 *   - Different periods (6 vs 5) beat at LCM 30s.
 *
 * viewBox units = CSS pixels at 1:1 (box 260 × sigil 260 CSS px).
 */

let { idPrefix = "s" }: { idPrefix?: string } = $props();

const clipId = `${idPrefix}-photo-clip`;
const coronaId = `${idPrefix}-corona`;

const R_PHOTO = 70;
const R_MAX = 128;
const MIN_SIZE = 1.0;
const WAVE_PERIOD = 5;
const ALT_PERIOD = 6;
const WAVE_SPAN = WAVE_PERIOD * 0.9;
const N_LOCAL_RADIAL = 12;
const N_ANGULAR = 6;

// Tangent-chord growth factor.
function Gt(N: number): number {
  return 1 + Math.sqrt(3) * Math.tan(Math.PI / N);
}

type Ring = {
  N: number;
  alpha: number;
  rBase: number;
  rApex: number;
  drawSlots: number[];
};

function buildSunRingsN(r0: number, N1: number, M: 1 | 2, K: number, rMax: number): Ring[] {
  const rings: Ring[] = [];
  let N = N1;
  let R = r0;
  let alpha = 0;
  for (let k = 0; k < K; k++) {
    const rApex = R * Gt(N);
    if (rApex > rMax) break;
    const drawSlots = Array.from({ length: Math.floor(N / 2) }, (_, i) => i * 2);
    rings.push({
      N,
      alpha,
      rBase: R / Math.cos(Math.PI / N),
      rApex,
      drawSlots,
    });
    R = rApex;
    const nextN = N / M;
    if (!Number.isInteger(nextN) || nextN < 3) break;
    alpha = alpha + Math.PI / N - Math.PI / nextN;
    N = nextN;
  }
  return rings;
}

function triVerts(
  ring: Ring, j: number
): [[number, number], [number, number], [number, number]] {
  const step = (2 * Math.PI) / ring.N;
  const t1 = ring.alpha + j * step;
  const t2 = ring.alpha + (j + 1) * step;
  const ta = ring.alpha + (j + 0.5) * step;
  return [
    [ring.rBase * Math.cos(t1), ring.rBase * Math.sin(t1)],
    [ring.rBase * Math.cos(t2), ring.rBase * Math.sin(t2)],
    [ring.rApex * Math.cos(ta), ring.rApex * Math.sin(ta)],
  ];
}

type Leaf = { d: string; r: number; angle: number };

function sierpinskiLeaves(
  A: [number, number], B: [number, number], C: [number, number], minSize: number
): Leaf[] {
  const out: Leaf[] = [];
  const stack: [[number, number], [number, number], [number, number]][] = [[A, B, C]];
  while (stack.length > 0) {
    const [p, q, r] = stack.pop()!;
    const dx = p[0] - q[0], dy = p[1] - q[1];
    if (dx * dx + dy * dy <= minSize * minSize) {
      const cx = (p[0] + q[0] + r[0]) / 3;
      const cy = (p[1] + q[1] + r[1]) / 3;
      out.push({
        d:
          `M${p[0].toFixed(2)} ${p[1].toFixed(2)}` +
          `L${q[0].toFixed(2)} ${q[1].toFixed(2)}` +
          `L${r[0].toFixed(2)} ${r[1].toFixed(2)}Z`,
        r: Math.sqrt(cx * cx + cy * cy),
        angle: Math.atan2(cy, cx),
      });
      continue;
    }
    const mPQ: [number, number] = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const mPR: [number, number] = [(p[0] + r[0]) / 2, (p[1] + r[1]) / 2];
    const mQR: [number, number] = [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2];
    stack.push([p, mPQ, mPR]);
    stack.push([mPQ, q, mQR]);
    stack.push([mPR, mQR, r]);
  }
  return out;
}

type Bucket2D = { d: string; rAvg: number };

function bucketizeRing2D(ring: Ring, minSize: number): Bucket2D[] {
  const ringMin = ring.rBase * Math.cos(Math.PI / ring.N);
  const ringMax = ring.rApex;
  const ringRange = Math.max(1e-6, ringMax - ringMin);
  const key = (ri: number, ai: number) => ri * N_ANGULAR + ai;
  const data: Record<number, { d: string; rSum: number; count: number }> = {};
  for (const j of ring.drawSlots) {
    const [A, B, C] = triVerts(ring, j);
    const leaves = sierpinskiLeaves(A, B, C, minSize);
    for (const lf of leaves) {
      const rLocal = (lf.r - ringMin) / ringRange;
      const ri = Math.max(0, Math.min(N_LOCAL_RADIAL - 1, Math.floor(rLocal * N_LOCAL_RADIAL)));
      const aT = (lf.angle + Math.PI) / (2 * Math.PI);
      const ai = Math.max(0, Math.min(N_ANGULAR - 1, Math.floor(aT * N_ANGULAR)));
      const k = key(ri, ai);
      if (!data[k]) data[k] = { d: "", rSum: 0, count: 0 };
      data[k].d += lf.d;
      data[k].rSum += lf.r;
      data[k].count++;
    }
  }
  return Object.values(data).map(v => ({
    d: v.d,
    rAvg: v.rSum / v.count,
  }));
}

const GRADIENT = ["#B7410E", "#CF6C1C", "#E0932C", "#D4AF37", "#F0D96D", "#F5E99F"];
function gradientAt(t: number): string {
  t = Math.max(0, Math.min(1, t));
  const idx = t * (GRADIENT.length - 1);
  const i = Math.min(Math.floor(idx), GRADIENT.length - 2);
  const f = idx - i;
  const hx = (s: string, n: number) => parseInt(s.slice(1 + n * 2, 3 + n * 2), 16);
  const to2 = (x: number) => Math.round(x).toString(16).padStart(2, "0");
  const r = hx(GRADIENT[i], 0) + f * (hx(GRADIENT[i + 1], 0) - hx(GRADIENT[i], 0));
  const g = hx(GRADIENT[i], 1) + f * (hx(GRADIENT[i + 1], 1) - hx(GRADIENT[i], 1));
  const b = hx(GRADIENT[i], 2) + f * (hx(GRADIENT[i + 1], 2) - hx(GRADIENT[i], 2));
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

const rings = buildSunRingsN(R_PHOTO, 128, 2, 4, R_MAX);
const rFinal = rings.length > 0 ? rings[rings.length - 1].rApex : R_PHOTO;

type PathItem = { d: string; color: string; delay: number };
type RingRendering = { setA: PathItem[]; setB: PathItem[]; layerDelay: number };

const ringRenderings: RingRendering[] = rings.map((ring, i) => {
  const bucketsA = bucketizeRing2D(ring, MIN_SIZE);
  const ringB: Ring = { ...ring, alpha: ring.alpha + Math.PI / ring.N };
  const bucketsB = bucketizeRing2D(ringB, MIN_SIZE);
  const layerDelay = (i * ALT_PERIOD) / Math.max(1, rings.length);
  const makeItem = (b: Bucket2D): PathItem => {
    const rT = (b.rAvg - R_PHOTO) / Math.max(1e-6, rFinal - R_PHOTO);
    return { d: b.d, color: gradientAt(rT), delay: rT * WAVE_SPAN };
  };
  return {
    setA: bucketsA.map(makeItem),
    setB: bucketsB.map(makeItem),
    layerDelay,
  };
});
</script>

<svg viewBox="-130 -130 260 260" class="sigil" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id={clipId}>
      <circle cx="0" cy="0" r={R_PHOTO}/>
    </clipPath>
    <radialGradient id={coronaId} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(232, 214, 140, 0.48)"/>
      <stop offset="30%" stop-color="rgba(232, 214, 140, 0.30)"/>
      <stop offset="55%" stop-color="rgba(201, 168, 76, 0.16)"/>
      <stop offset="80%" stop-color="rgba(201, 168, 76, 0.04)"/>
      <stop offset="100%" stop-color="rgba(201, 168, 76, 0)"/>
    </radialGradient>
  </defs>

  <!-- Warm corona behind the photo + inner sun band -->
  <circle cx="0" cy="0" r="90" fill="url(#{coronaId})"/>

  <!-- Variant N rings: sparse halving with set A + set B (π/N_k shift),
       compound K × L animation. -->
  {#each ringRenderings as ring}
    <g class="mix-n-ring" shape-rendering="geometricPrecision">
      <g class="n-set-a" style="animation-delay: {ring.layerDelay.toFixed(3)}s">
        {#each ring.setA as p}
          <path d={p.d} fill={p.color} stroke={p.color}
                stroke-width="0.08" stroke-linejoin="miter"
                style="animation-delay: {p.delay.toFixed(3)}s"/>
        {/each}
      </g>
      <g class="n-set-b" style="animation-delay: {ring.layerDelay.toFixed(3)}s">
        {#each ring.setB as p}
          <path d={p.d} fill={p.color} stroke={p.color}
                stroke-width="0.08" stroke-linejoin="miter"
                style="animation-delay: {p.delay.toFixed(3)}s"/>
        {/each}
      </g>
    </g>
  {/each}

  <!-- Photo, clipped to the inner circle. 240×240 placement centers
       the face (45%, 32%) at the origin. -->
  <g clip-path="url(#{clipId})">
    <image href="/hatman.jpg" x="-108" y="-77" width="240" height="240"
           preserveAspectRatio="xMidYMid slice"/>
  </g>

  <!-- Whisper-thin photo outline (just for leather-edge definition) -->
  <circle cx="0" cy="0" r={R_PHOTO} fill="none"
          stroke="rgba(201, 168, 76, 0.35)" stroke-width="0.5"/>
</svg>

<style>
  .sigil {
    width: 260px;
    height: 260px;
  }

  /* Variant N: K's A/B alternation on parent <g>, L's radial wave on paths */
  .n-set-a, .n-set-b {
    animation-duration: 6s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
    animation-fill-mode: backwards;
  }
  .n-set-a { animation-name: setPulseA; }
  .n-set-b { animation-name: setPulseB; }
  .mix-n-ring path {
    animation: radiateOutWide 5s linear infinite;
    animation-fill-mode: backwards;
  }

  @keyframes setPulseA {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.05; }
  }
  @keyframes setPulseB {
    0%, 100% { opacity: 0.05; }
    50%      { opacity: 1; }
  }
  @keyframes radiateOutWide {
    0%, 100% { opacity: 0.15; }
    50%      { opacity: 1; }
  }
</style>
