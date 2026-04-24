<script lang="ts">
/**
 * Rule-strict Sierpiński sun (variant D · halving 128 → 64 → 32 → 16).
 *
 * Invariant: every ring k+1 triangle's 2 base corners coincide exactly
 * with 2 apex positions of ring k. Derivation:
 *   r_apex = r_base · F(N)  where  F(N) = cos(π/N) + √3·sin(π/N)
 * so r_{k+1}^base = r_k^apex and α_{k+1} = α_k + π/N_k.
 *
 * Photo centered at (0,0), clipped to r=70. Rings fill the annulus
 * r ∈ [70, ≈121] with burnt-orange → pale-yellow gradient.
 */

let { idPrefix = "s" }: { idPrefix?: string } = $props();

const clipId = `${idPrefix}-photo-clip`;
const coronaId = `${idPrefix}-corona`;

const R_PHOTO = 70;
const R_MAX = 132;
const MIN_SIZE = 1.5;

function F(N: number): number {
  return Math.cos(Math.PI / N) + Math.sqrt(3) * Math.sin(Math.PI / N);
}

type Ring = { N: number; alpha: number; rBase: number; rApex: number };

function buildSunRings(r0: number, N1: number, M: 1 | 2, K: number, rMax: number): Ring[] {
  const rings: Ring[] = [];
  let N = N1;
  let rBase = r0;
  let alpha = 0;
  for (let k = 0; k < K; k++) {
    const rApex = rBase * F(N);
    if (rApex > rMax) break;
    rings.push({ N, alpha, rBase, rApex });
    alpha += Math.PI / N;
    rBase = rApex;
    const nextN = N / M;
    if (!Number.isInteger(nextN) || nextN < 3) break;
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

function sierpinskiToPixel(
  A: [number, number],
  B: [number, number],
  C: [number, number],
  minSize: number
): string {
  const parts: string[] = [];
  const stack: [[number, number], [number, number], [number, number]][] = [[A, B, C]];
  while (stack.length > 0) {
    const [p, q, r] = stack.pop()!;
    const dx = p[0] - q[0], dy = p[1] - q[1];
    if (dx * dx + dy * dy <= minSize * minSize) {
      parts.push(
        `M ${p[0].toFixed(2)} ${p[1].toFixed(2)} ` +
        `L ${q[0].toFixed(2)} ${q[1].toFixed(2)} ` +
        `L ${r[0].toFixed(2)} ${r[1].toFixed(2)} Z`
      );
      continue;
    }
    const mPQ: [number, number] = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const mPR: [number, number] = [(p[0] + r[0]) / 2, (p[1] + r[1]) / 2];
    const mQR: [number, number] = [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2];
    stack.push([p, mPQ, mPR]);
    stack.push([mPQ, q, mQR]);
    stack.push([mPR, mQR, r]);
  }
  return parts.join(" ");
}

const GRADIENT = ["#B7410E", "#CF6C1C", "#E0932C", "#D4AF37", "#F0D96D", "#F5E99F"];
function ringColor(k: number, K: number): string {
  if (K <= 1) return GRADIENT[0];
  const t = k / (K - 1);
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

const rings = buildSunRings(R_PHOTO, 128, 2, 4, R_MAX);
const ringPaths = rings.map((ring, k) => {
  const color = ringColor(k, rings.length);
  const paths = Array.from({ length: ring.N }, (_, j) => {
    const [A, B, C] = triVerts(ring, j);
    return sierpinskiToPixel(A, B, C, MIN_SIZE);
  });
  return { color, paths };
});
</script>

<svg viewBox="-140 -140 280 280" class="sigil" xmlns="http://www.w3.org/2000/svg">
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

  <!-- Sierpiński sun rings (D · 128 → 64 → 32 → 16) -->
  {#each ringPaths as ring}
    <g fill={ring.color} stroke={ring.color}
       stroke-width="0.25" stroke-linejoin="miter" opacity="0.95">
      {#each ring.paths as d}
        <path {d}/>
      {/each}
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
</style>
