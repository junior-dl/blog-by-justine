// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Pages are rendered on request so posts come straight from the database.
  // Public pages send CDN cache headers (60 s), so they stay fast.
  output: 'server',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()]
  }
});
