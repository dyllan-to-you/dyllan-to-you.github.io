/**
 * Pure path ⇄ leaf-index routing for the tome.
 *
 * Extracted from `Tome.svelte` (D4). Both functions are PURE: the slug table
 * and total leaf count are passed in rather than read off the component's
 * reactive `$derived` state. The component keeps owning that state and calls
 * these with its live values.
 *
 * The "back" slug is virtual: the closed-back state (`flipped === total`) has
 * no page in the registry — the back cover is the verso of the last leaf —
 * but `/back` is still a useful direct link.
 */

export const BACK_SLUG = "back";

/**
 * Map a URL pathname to a leaf index.
 *
 *   ""            → 0      (root → front cover)
 *   "back"        → total  (virtual closed-back state)
 *   a known slug  → its index in `slugs`
 *   anything else → -1     (FAIL VISIBLY — caller decides what -1 means;
 *                           it does NOT silently collapse to the cover)
 *
 * Leading/trailing slashes are stripped before matching.
 */
export function indexForPath(pathname: string, slugs: string[], total: number): number {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  if (clean === "") return 0; // root → cover
  if (clean === BACK_SLUG) return total;
  return slugs.indexOf(clean); // -1 when unknown — intentional
}

/**
 * Map a leaf index back to a URL pathname.
 *
 *   total            → "/back"     (virtual closed-back state)
 *   index with slug  → "/<slug>"
 *   index w/o slug   → "/"         (the cover has an empty slug)
 */
export function pathForIndex(i: number, slugs: string[], total: number): string {
  if (i === total) return `/${BACK_SLUG}`;
  const slug = slugs[i];
  return slug ? `/${slug}` : "/";
}
