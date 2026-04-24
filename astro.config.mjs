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
  // Windows file-watcher is flaky with Astro 6 content collections —
  // native events get dropped mid-flight and dev errors with "collection
  // does not exist or is empty" until restart. Polling is more reliable.
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 400,
      },
    },
  },
});
