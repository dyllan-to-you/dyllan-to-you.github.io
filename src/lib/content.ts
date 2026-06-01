/**
 * Shared publish predicate.
 *
 * The SINGLE source of truth for "does this entry survive the production draft
 * filter?" It MUST be used identically by every route generator and every
 * composer so the set of routes `[...slug].astro` emits is byte-identical to
 * the set of pages `BookLayout.astro` renders. Any divergence re-introduces the
 * split-brain bug where a route renders in dev but 404s in prod (D-DRAFTFILTER).
 *
 * Drafts are visible in dev (`import.meta.env.PROD === false`) and hidden in
 * prod. Both the `pages` and `writings` collections carry a `draft` flag, so a
 * minimal `{ draft }` shape is all this predicate needs.
 *
 * Framework-neutral: no Astro/Svelte imports.
 */
export function isPublished(data: { draft?: boolean }): boolean {
  return import.meta.env.PROD ? !data.draft : true;
}
