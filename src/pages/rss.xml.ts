/**
 * RSS feed for the writings collection.
 *
 * Discharges the dead `> subscribe: /rss.xml` promise rendered on the writings
 * index page (and the unused `@astrojs/rss` dependency). The feed lists only
 * PUBLISHED writings via the SHARED `isPublished` predicate — byte-identical to
 * the route generator and BookLayout, so the feed can never advertise a writing
 * whose permalink 404s.
 *
 * Links use `entry.id` (the filename → routing key), matching the permalinks
 * `[...slug].astro` generates. With all writings currently `draft:true`, the
 * prod feed is correctly empty-items.
 */
import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { isPublished } from "../lib/content";

export async function GET(context: APIContext) {
  const writings = await getCollection("writings", ({ data }) => isPublished(data));

  return rss({
    title: "dyllan.to — Writings",
    description: "Voice-attributed essays from the long derivation — Dyllan Justice Tô-Yu.",
    // context.site is the configured `site` from astro.config.mjs.
    site: context.site ?? "https://dyllan.to",
    items: writings
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
      .map((entry) => ({
        title: entry.data.title,
        pubDate: entry.data.date,
        description: entry.data.description ?? "",
        link: `/writings/${entry.id}`,
      })),
  });
}
