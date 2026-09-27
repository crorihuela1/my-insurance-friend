import type { APIRoute } from 'astro';
import { IS_PRODUCTION, SITE_URL } from '../lib/env';

/**
 * Generated rather than static, so the sitemap line always matches the origin
 * this build was made for, and so a preview deploy cannot invite crawlers.
 */
export const GET: APIRoute = () => {
  const body = IS_PRODUCTION
    ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap-index.xml\n`
    : `# Non-production build (SITE_ENV is not "production"). Indexing disabled.\nUser-agent: *\nDisallow: /\n`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
