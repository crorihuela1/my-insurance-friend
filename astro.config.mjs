// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import site from './src/data/site.json' with { type: 'json' };

export default defineConfig({
  // SITE_URL lets a preview deploy use its own origin instead of the
  // placeholder in site.json. See src/lib/env.ts.
  site: (process.env.SITE_URL ?? site.brand.domain).replace(/\/$/, ''),
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-US', en: 'en-US' },
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
