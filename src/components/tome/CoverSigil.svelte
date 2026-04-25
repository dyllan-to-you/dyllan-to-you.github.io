<script lang="ts">
/**
 * Variant N cover sigil: 4-way A/B/C/D rotation × L's per-bucket radial wave.
 *
 * Geometry (tangent-chord): 4 halving rings 128 → 64 → 32 → 16, each sparse
 * with drawSlots at even indices of its N-grid. Each ring renders four times —
 * set A at α, set B at α + π/N_k, set C at α + 2π/N_k, set D at α + 3π/N_k.
 * A + C tile the ring at integer-step alignment (A even slots, C odd slots).
 * B + D tile the same ring offset by half a triangle width (B fills its even
 * slot pairs, D fills the gaps in between). Every angular position is covered
 * by exactly one A∪C tile and one B∪D tile — full double-layer coverage.
 *
 * Animation (single per-path keyframe with rise-peak-fade-rest):
 *   Every path uses one shared 10s keyframe — 10% rise, 40% peak hold, 10%
 *   fade, 40% rest. Per-path animation-delay combines a set offset (A+C vs
 *   B+D) and a radial offset (rT · WAVE_SPAN). The pattern per set:
 *     inner rises first → outer rises last → all bright at peak →
 *     inner fades first → outer fades last → all dim → next set begins.
 *   The two sets are offset by half a cycle: as A+C's inner starts to fade,
 *   B+D's inner starts to rise. Same per radial position. So one set
 *   radiates outward, then fades from the inside out; the other set takes
 *   over fluidly during that fade.
 *   Ring parity flips which set fires first — even rings (0, 2) start with
 *   A+C, odd rings (1, 3) start with B+D. Adjacent rings always show
 *   opposite sets in the cycle.
 *
 * viewBox units = CSS pixels at 1:1 (box 400 × sigil 400 CSS px). Matches
 * scratch's overlay-large dimensions exactly so the photo:sun:halo proportions
 * read identically between the two surfaces.
 */

let { idPrefix = "s" }: { idPrefix?: string } = $props();

const clipId = `${idPrefix}-photo-clip`;
const coronaId = `${idPrefix}-corona`;

const R_PHOTO = 70;
const R_MAX = 200;
const MIN_SIZE = 1.0;
// One full A+C → B+D cycle. Keyframe shape: 0-10% rise, 10-50% peak hold,
// 50-60% fade, 60-100% rest. Set B+D is delayed by SET_OFFSET = period/2,
// so its inner rises exactly when set A+C's inner starts to fade.
const CYCLE_PERIOD = 10;
const SET_OFFSET = CYCLE_PERIOD / 2;
// Radial wave traversal time. Inner path delay = 0; outer path delay = WAVE_SPAN.
// Must be < (peak-hold duration = 40%·period) so all paths in one set finish
// rising before any path in that set starts fading.
const WAVE_SPAN = CYCLE_PERIOD * 0.3;
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
type RingRendering = {
  setA: PathItem[]; setB: PathItem[]; setC: PathItem[]; setD: PathItem[];
};

const ringRenderings: RingRendering[] = rings.map((ring, i) => {
  const bucketsA = bucketizeRing2D(ring, MIN_SIZE);
  const ringB: Ring = { ...ring, alpha: ring.alpha + Math.PI / ring.N };
  const bucketsB = bucketizeRing2D(ringB, MIN_SIZE);
  const ringC: Ring = { ...ring, alpha: ring.alpha + (2 * Math.PI) / ring.N };
  const bucketsC = bucketizeRing2D(ringC, MIN_SIZE);
  const ringD: Ring = { ...ring, alpha: ring.alpha + (3 * Math.PI) / ring.N };
  const bucketsD = bucketizeRing2D(ringD, MIN_SIZE);
  // Alternate which set fires first by ring parity. Even rings: A+C at offset 0,
  // B+D at offset CYCLE_PERIOD/2. Odd rings: swap. Adjacent rings always show
  // opposite sets at any moment.
  const isEven = i % 2 === 0;
  const acOffset = isEven ? 0 : SET_OFFSET;
  const bdOffset = isEven ? SET_OFFSET : 0;
  const makeItem = (b: Bucket2D, setOffset: number): PathItem => {
    const rT = (b.rAvg - R_PHOTO) / Math.max(1e-6, rFinal - R_PHOTO);
    return { d: b.d, color: gradientAt(rT), delay: setOffset + rT * WAVE_SPAN };
  };
  return {
    setA: bucketsA.map(b => makeItem(b, acOffset)),
    setB: bucketsB.map(b => makeItem(b, bdOffset)),
    setC: bucketsC.map(b => makeItem(b, acOffset)),
    setD: bucketsD.map(b => makeItem(b, bdOffset)),
  };
});
</script>

<svg viewBox="-200 -200 400 400" class="sigil" xmlns="http://www.w3.org/2000/svg">
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
      <g class="n-set-a">
        {#each ring.setA as p}
          <path d={p.d} fill={p.color} stroke={p.color}
                stroke-width="0.08" stroke-linejoin="miter"
                style="animation-delay: {p.delay.toFixed(3)}s"/>
        {/each}
      </g>
      <g class="n-set-b">
        {#each ring.setB as p}
          <path d={p.d} fill={p.color} stroke={p.color}
                stroke-width="0.08" stroke-linejoin="miter"
                style="animation-delay: {p.delay.toFixed(3)}s"/>
        {/each}
      </g>
      <g class="n-set-c">
        {#each ring.setC as p}
          <path d={p.d} fill={p.color} stroke={p.color}
                stroke-width="0.08" stroke-linejoin="miter"
                style="animation-delay: {p.delay.toFixed(3)}s"/>
        {/each}
      </g>
      <g class="n-set-d">
        {#each ring.setD as p}
          <path d={p.d} fill={p.color} stroke={p.color}
                stroke-width="0.08" stroke-linejoin="miter"
                style="animation-delay: {p.delay.toFixed(3)}s"/>
        {/each}
      </g>
    </g>
  {/each}

  <!-- Photo, clipped to the inner circle. Image sized at exactly the visible
       diameter (140 SVG units) so the whole 1080×1080 hatman.jpg shows inside
       the circle — matching scratch's `width: 140; object-fit: cover` framing.
       Placed at (-70, -70) so it's centered at the origin. -->
  <g clip-path="url(#{clipId})">
    <image href="/hatman.jpg" x="-70" y="-70" width="140" height="140"
           preserveAspectRatio="xMidYMid slice"/>
  </g>

  <!-- Whisper-thin photo outline (just for leather-edge definition) -->
  <circle cx="0" cy="0" r={R_PHOTO} fill="none"
          stroke="rgba(201, 168, 76, 0.35)" stroke-width="0.5"/>
</svg>

<style>
  .sigil {
    /* Three-way clamp: never bigger than 560px, never wider than 85vw of the
       device, never taller than 55vh — so on short landscape phones the sigil
       shrinks to leave room for the name + tagline below it. */
    width: min(560px, 85vw, 55vh);
    height: min(560px, 85vw, 55vh);
    aspect-ratio: 1;
  }

  /* Variant N: per-path animation with rise-peak-fade-rest keyframe.
     Each path's animation-delay = setOffset + rT · WAVE_SPAN. One set
     radiates outward, holds at peak, then fades from the inside out;
     as it fades, the other set begins its outward radiate (offset by
     half the cycle). Adjacent rings alternate which set fires first. */
  .mix-n-ring path {
    animation: radiateOutWave 10s linear infinite;
    animation-fill-mode: backwards;
  }
  /* Rise (0-10%) → peak hold (10-30%, = 2s = WAVE_SPAN − 1s) → fade (30-50%)
     → rest (50-100%). Peak hold is 1s shorter than WAVE_SPAN so inner starts
     fading BEFORE outer reaches peak — eliminating any plateau where the
     whole set sits at peak. Fade-end at 50% of cycle = SET_OFFSET, so inner
     B+D begins rising the moment inner A+C finishes fading. */
  @keyframes radiateOutWave {
    0%   { opacity: 0.05; }
    10%  { opacity: 1.00; }
    30%  { opacity: 1.00; }
    50%  { opacity: 0.05; }
    100% { opacity: 0.05; }
  }
</style>
