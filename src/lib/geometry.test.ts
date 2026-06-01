import { describe, expect, it } from "vitest";
import { type Animation, DEPTH, isAnimating, isFlippedFor, transformFor, transitionFor } from "./geometry";

const TOTAL = 8; // a representative book size

// A forward flip of the single leaf [2,2], begun when 2 leaves were flipped.
const anim: Animation = { from: 2, to: 2, forward: true, startFlipped: 2, staggerMs: 0 };
// A forward multi-leaf cascade [1,3], begun at flipped=1, with stagger.
const cascade: Animation = { from: 1, to: 3, forward: true, startFlipped: 1, staggerMs: 210 };

describe("isAnimating", () => {
  it("is false with no animation", () => {
    expect(isAnimating(2, null)).toBe(false);
  });
  it("is true for a leaf inside the animating range (inclusive)", () => {
    expect(isAnimating(1, cascade)).toBe(true);
    expect(isAnimating(3, cascade)).toBe(true);
  });
  it("is false for a leaf outside the range", () => {
    expect(isAnimating(0, cascade)).toBe(false);
    expect(isAnimating(4, cascade)).toBe(false);
  });
});

describe("isFlippedFor", () => {
  it("with no animation, a leaf is flipped iff its index < flipped", () => {
    expect(isFlippedFor(0, 3, null)).toBe(true);
    expect(isFlippedFor(2, 3, null)).toBe(true);
    expect(isFlippedFor(3, 3, null)).toBe(false);
    expect(isFlippedFor(5, 3, null)).toBe(false);
  });

  it("an animating leaf follows the LIVE flipped target", () => {
    // flipped already moved to 3; leaf 2 is animating → i < flipped → true.
    expect(isFlippedFor(2, 3, anim)).toBe(true);
    // a backward flip: flipped moved to 2; leaf 2 animating → 2 < 2 → false.
    const back: Animation = { from: 2, to: 2, forward: false, startFlipped: 3, staggerMs: 0 };
    expect(isFlippedFor(2, 2, back)).toBe(false);
  });

  it("a non-animating leaf during an animation follows startFlipped", () => {
    // cascade started at flipped=1; leaf 0 is NOT animating → i < startFlipped.
    expect(isFlippedFor(0, 4, cascade)).toBe(true); // 0 < 1
    expect(isFlippedFor(5, 4, cascade)).toBe(false); // 5 < 1 is false
  });
});

describe("transformFor", () => {
  it("landscape: an unflipped leaf has no rotation, depth = (total - i) * DEPTH", () => {
    // leaf 5, flipped=3, no anim → not flipped → onLeft=false.
    const z = (TOTAL - 5) * DEPTH;
    expect(transformFor(5, 3, null, false, TOTAL)).toBe(`translateZ(${z}px) rotateY(0deg)`);
  });

  it("landscape: a flipped leaf rotates -180deg, depth = i * DEPTH", () => {
    // leaf 1, flipped=3, no anim → flipped → onLeft=true.
    const z = 1 * DEPTH;
    expect(transformFor(1, 3, null, false, TOTAL)).toBe(`translateZ(${z}px) rotateY(-180deg)`);
  });

  it("portrait: unflipped leaf is angle 0", () => {
    const z = (TOTAL - 5) * DEPTH;
    expect(transformFor(5, 3, null, true, TOTAL)).toBe(`translateZ(${z}px) rotateX(0deg)`);
  });

  it("portrait: flipped leaf angle = 180 - i*0.4", () => {
    const z = 2 * DEPTH;
    const angle = 180 - 2 * 0.4; // 179.2
    expect(transformFor(2, 3, null, true, TOTAL)).toBe(`translateZ(${z}px) rotateX(${angle}deg)`);
  });

  it("respects an injected depth override", () => {
    expect(transformFor(1, 3, null, false, TOTAL, 5)).toBe("translateZ(5px) rotateY(-180deg)");
  });
});

describe("transitionFor", () => {
  it("returns 'none' for a non-animating leaf", () => {
    expect(transitionFor(5, cascade, false, 600, "ease")).toBe("none");
    expect(transitionFor(2, null, false, 600, "ease")).toBe("none");
  });

  it("returns 'none' under reduced motion even when animating", () => {
    expect(transitionFor(2, cascade, true, 600, "ease")).toBe("none");
  });

  it("single-leaf flip has zero stagger delay", () => {
    expect(transitionFor(2, anim, false, 600, "EASE")).toBe("transform 600ms EASE 0ms");
  });

  it("multi-leaf forward cascade staggers by position within the range", () => {
    // cascade [1,3], steps = 2, staggerMs = 210.
    // leaf 1 (pos 0): delay 0; leaf 2 (pos 1): 105ms; leaf 3 (pos 2): 210ms.
    expect(transitionFor(1, cascade, false, 600, "E")).toBe("transform 600ms E 0ms");
    expect(transitionFor(2, cascade, false, 600, "E")).toBe("transform 600ms E 105ms");
    expect(transitionFor(3, cascade, false, 600, "E")).toBe("transform 600ms E 210ms");
  });

  it("backward cascade staggers from the far end (pos = to - i)", () => {
    const backCascade: Animation = { from: 1, to: 3, forward: false, startFlipped: 4, staggerMs: 210 };
    // leaf 3 (pos 0): 0ms; leaf 1 (pos 2): 210ms.
    expect(transitionFor(3, backCascade, false, 600, "E")).toBe("transform 600ms E 0ms");
    expect(transitionFor(1, backCascade, false, 600, "E")).toBe("transform 600ms E 210ms");
  });
});
