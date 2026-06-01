/**
 * Shared HTML escaping.
 *
 * Covers exactly the four entities the renderers need (& < > "). `&` is
 * replaced first so the other substitutions can't double-encode it; the
 * remaining three are order-independent. Output is byte-identical to the
 * two escapers this replaced (BookLayout's escapeHtml, writing.ts's escapeAttr).
 */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
