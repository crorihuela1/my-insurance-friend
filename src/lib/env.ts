import { site } from './data';

/**
 * Deploy-time environment.
 *
 * The site is indexable ONLY when SITE_ENV is exactly "production". Every other
 * deploy - preview, staging, a branch build - ships noindex and a robots.txt
 * that disallows everything. This is deliberate: canonical URLs, hreflang and
 * og:image all bake in the domain at build time, so a preview that Google
 * indexes is expensive to undo.
 *
 * Set in Cloudflare Pages > Settings > Environment variables:
 *   SITE_URL   the deploy's real origin, e.g. https://myinsurancefriend.com
 *   SITE_ENV   "production" to allow indexing; anything else (or unset) = preview
 */
const env = (key: string): string | undefined =>
  // import.meta.env is populated by Astro/Vite; process.env covers scripts.
  (import.meta as { env?: Record<string, string | undefined> }).env?.[key] ??
  (typeof process !== 'undefined' ? process.env?.[key] : undefined);

/** The origin this build will be served from, without a trailing slash. */
export const SITE_URL = (env('SITE_URL') ?? site.brand.domain).replace(/\/$/, '');

export const SITE_ENV = env('SITE_ENV') ?? 'preview';

export const IS_PRODUCTION = SITE_ENV === 'production';

/** True when the build still carries placeholder brand data. */
export const HAS_PLACEHOLDERS =
  SITE_URL.includes('example-placeholder') || site.brand.name.includes('PLACEHOLDER');
