import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import rehypeSlug from 'rehype-slug';

export default defineConfig({
  integrations: [svelte()],
  site: 'https://dyllan.to',
  markdown: {
    rehypePlugins: [rehypeSlug],
  },
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 200,
      },
    },
  },
});
