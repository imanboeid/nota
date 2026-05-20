import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

// Hybrid output: most pages prerender, only /api/* runs as a server function.
export default defineConfig({
  output: 'server',
  adapter: netlify({
    edgeMiddleware: false
  }),
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false })
  ],
  vite: {
    ssr: {
      noExternal: ['lucide-react']
    }
  }
});
