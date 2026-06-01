/**
 * Pure leaf-geometry math for the tome's 3D page-flip engine.
 *
 * Extracted from `Tome.svelte` (D4) so the highest-risk arithmetic — which
 * leaf is flipped, its transform, its transition — is unit-testable in
 * isolation. These functions are PURE: every piece of state they once read off
 * the component (`flipped`, `animation`, `isPortrait`, `prefersReducedMotion`,
 * `total`, `DEPTH`, the timing tokens) is now an explicit argument. The
 * component keeps owning that reactive state and passes it in; nothing here
 * touches Svelte, the DOM, or any token module.
 *
 * NOT extracted: the flip STATE machine (busy/timer/animation lifecycle,
 * goTo) — that stays in the component and is gated separately.
 */

/** A flip-in-progress: the contiguous leaf range [from, to] turning together,
 *  the direction, and the flip count at the moment the animation began. */
export interface Animation {
  from: number;
  to: number;
  forward: boolean;
  startFlipped: number;
  staggerMs: number;
}

/** Depth multiplier (px) per leaf in the preserve-3d stack. Mirrors the
 *  component's `const DEPTH`. */
export const DEPTH = 2;

/** Is leaf `i` part of the currently-animating range? */
export function isAnimating(i: number, animation: Animation | null): boolean {
  return animation !== null && i >= animation.from && i <= animation.to;
}

/**
 * Has leaf `i` been turned to the left (flipped) in the current frame?
 *
 * During an animation the answer follows the LIVE `flipped` target (the leaf
 * is mid-turn toward its new side); outside an animation it follows the
 * pre-animation `startFlipped` snapshot if one lingers, else `flipped`.
 */
export function isFlippedFor(i: number, flipped: number, animation: Animation | null): boolean {
  if (isAnimating(i, animation)) return i < flipped;
  return animation ? i < animation.startFlipped : i < flipped;
}

/**
 * The CSS `transform` for leaf `i`: a translateZ depth plus a rotation.
 * Portrait flips around the top edge (rotateX); landscape around the left
 * edge (rotateY). Flipped leaves stack from the front, unflipped from the back.
 */
export function transformFor(
  i: number,
  flipped: number,
  animation: Animation | null,
  isPortrait: boolean,
  total: number,
  depth = DEPTH,
): string {
  const onLeft = isFlippedFor(i, flipped, animation);
  const z = (onLeft ? i : total - i) * depth;
  if (isPortrait) {
    const angle = onLeft ? 180 - i * 0.4 : 0;
    return `translateZ(${z}px) rotateX(${angle}deg)`;
  }
  const rotation = onLeft ? "rotateY(-180deg)" : "rotateY(0deg)";
  return `translateZ(${z}px) ${rotation}`;
}

/**
 * The CSS `transition` for leaf `i`. Only animating leaves transition; reduced
 * motion snaps (no transition); the per-leaf stagger delay derives from the
 * leaf's position within the turning range so a multi-leaf flip cascades.
 */
export function transitionFor(
  i: number,
  animation: Animation | null,
  prefersReducedMotion: boolean,
  flipMs: number,
  flipEase: string,
): string {
  if (!isAnimating(i, animation) || animation === null) return "none";
  if (prefersReducedMotion) return "none"; // snap, don't flip
  const { from, to, forward, staggerMs } = animation;
  const steps = to - from;
  const pos = forward ? i - from : to - i;
  const delay = steps > 0 ? (pos / steps) * staggerMs : 0;
  return `transform ${flipMs}ms ${flipEase} ${delay}ms`;
}
