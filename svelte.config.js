import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Consumed by Soul core's `-S`/`--studio` flag, which dynamically
    // imports this package's `build/handler.js` and mounts it at `/studio`
    // on its own Express app (see soul/src/server.js). Both the adapter
    // and this base path are part of that integration contract -- do not
    // change either without also updating soul core's mount code.
    adapter: adapter({
      envPrefix: 'STUDIO_',
    }),
    paths: {
      base: '/studio',
    },
  },
};

export default config;
