import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';
import rehypeSlug from 'rehype-slug';

export default defineConfig({
  integrations: [mdx(), svelte()],
  site: 'https://dyllan.to',
  markdown: {
    rehypePlugins: [rehypeSlug],
  },
});
