import { describe, expect, it } from "vitest";
import { BACK_SLUG, indexForPath, pathForIndex } from "./routing";

// A representative slug table: index 0 is the cover (empty slug), then the
// interior leaves. `total` is the leaf count; `total` itself maps to /back.
const SLUGS = ["", "epigraph", "resume", "now", "colophon"];
const TOTAL = SLUGS.length; // 5

describe("indexForPath", () => {
  it("maps root '/' to the cover (0)", () => {
    expect(indexForPath("/", SLUGS, TOTAL)).toBe(0);
    expect(indexForPath("", SLUGS, TOTAL)).toBe(0);
    expect(indexForPath("///", SLUGS, TOTAL)).toBe(0);
  });

  it("maps the virtual back slug to total", () => {
    expect(indexForPath(`/${BACK_SLUG}`, SLUGS, TOTAL)).toBe(TOTAL);
    expect(indexForPath("back", SLUGS, TOTAL)).toBe(TOTAL);
  });

  it("maps a known slug to its index", () => {
    expect(indexForPath("/epigraph", SLUGS, TOTAL)).toBe(1);
    expect(indexForPath("/colophon", SLUGS, TOTAL)).toBe(4);
  });

  it("strips leading/trailing slashes before matching", () => {
    expect(indexForPath("/resume/", SLUGS, TOTAL)).toBe(2);
  });

  it("returns -1 for an unknown path (fail visibly, no silent cover-collapse)", () => {
    expect(indexForPath("/does-not-exist", SLUGS, TOTAL)).toBe(-1);
    expect(indexForPath("/writings/ghost", SLUGS, TOTAL)).toBe(-1);
  });
});

describe("pathForIndex", () => {
  it("maps total to /back", () => {
    expect(pathForIndex(TOTAL, SLUGS, TOTAL)).toBe(`/${BACK_SLUG}`);
  });

  it("maps the cover index (empty slug) to '/'", () => {
    expect(pathForIndex(0, SLUGS, TOTAL)).toBe("/");
  });

  it("maps an interior index to /<slug>", () => {
    expect(pathForIndex(1, SLUGS, TOTAL)).toBe("/epigraph");
    expect(pathForIndex(4, SLUGS, TOTAL)).toBe("/colophon");
  });

  it("round-trips index → path → index for known leaves", () => {
    for (let i = 0; i <= TOTAL; i++) {
      expect(indexForPath(pathForIndex(i, SLUGS, TOTAL), SLUGS, TOTAL)).toBe(i);
    }
  });
});
