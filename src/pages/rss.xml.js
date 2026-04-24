import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const posts = (
    await getCollection("writings", ({ data }) => !data.draft)
  ).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: "Justice — Writings",
    description: "Notes from the long derivation. Ontology, agents, AuDHD systems thinking.",
    site: context.site ?? "https://dyllan.to",
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      categories: post.data.tags,
      link: `/writings/${post.id}/`,
    })),
    customData: "<language>en-us</language>",
  });
}
