import { services, site, towns } from './data';
import type { Lang, Service, Town } from './types';

/**
 * Single source of truth for every URL on the site. Page routes, hreflang pairs,
 * internal links, breadcrumbs and the sitemap all derive from here, so they
 * cannot drift apart.
 */

export function townServicePath(service: Service, town: Town, lang: Lang): string {
  const pattern = lang === 'es' ? service.url_pattern_es : service.url_pattern_en;
  return `/${lang}/${pattern.replace('{town}', town.slug)}`;
}

export function townHubPath(town: Town, lang: Lang): string {
  return lang === 'es' ? `/es/seguros-en-${town.slug}` : `/en/insurance-${town.slug}`;
}

export function serviceHubPath(service: Service, lang: Lang): string {
  return `/${lang}/${lang === 'es' ? service.slug_es : service.slug_en}`;
}

export function stateHubPath(lang: Lang): string {
  return lang === 'es' ? '/es/seguros-nj' : '/en/nj-insurance';
}

export function guidePath(slug: { es: string; en: string }, lang: Lang): string {
  return `/${lang}/guias/${lang === 'es' ? slug.es : slug.en}`.replace(
    '/en/guias/',
    '/en/guides/',
  );
}

export function homePath(lang: Lang): string {
  return `/${lang}`;
}

export function absolute(path: string): string {
  return new URL(path, site.brand.domain).href;
}

export const otherLang = (lang: Lang): Lang => (lang === 'es' ? 'en' : 'es');

/** Every town x service route, for getStaticPaths and for the similarity checker. */
export function allTownServiceRoutes(): Array<{ town: Town; service: Service; lang: Lang; path: string }> {
  const out: Array<{ town: Town; service: Service; lang: Lang; path: string }> = [];
  for (const town of towns) {
    for (const service of services) {
      for (const lang of ['es', 'en'] as Lang[]) {
        out.push({ town, service, lang, path: townServicePath(service, town, lang) });
      }
    }
  }
  return out;
}
