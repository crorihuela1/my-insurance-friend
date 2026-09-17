import { countyName, serviceName, site, townName } from './data';
import type { Lang, Service, Town } from './types';

export const TITLE_MAX = 60;
export const DESC_MAX = 155;

/** Truncate on a word boundary so we never ship a title cut mid-word. */
export function clamp(s: string, max: number): string {
  const clean = s.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/**
 * Spanish titles lead with the search phrase, then the CTA. English titles lead
 * with the service and town. Both keep town + service + state inside 60 chars.
 */
export function townServiceTitle(service: Service, town: Town, lang: Lang): string {
  const name = townName(town, lang);
  if (lang === 'es') {
    return clamp(`${service.name_es} en ${name} ${town.state} | Cotiza por WhatsApp`, TITLE_MAX);
  }
  return clamp(`${service.name_en} in ${name}, ${town.state} | Free Quote`, TITLE_MAX);
}

export function townServiceDescription(service: Service, town: Town, lang: Lang): string {
  const name = townName(town, lang);
  const county = countyName(town, lang);
  if (lang === 'es') {
    return clamp(
      `${service.name_es} en ${name}, ${county}. Qué exige la ley de ${town.state}, rangos de precio reales y cómo te conectamos con un agente con licencia. En español, por WhatsApp.`,
      DESC_MAX,
    );
  }
  return clamp(
    `${service.name_en} in ${name}, ${county}. What ${town.state} law requires, real price ranges, and how we connect you with a licensed agent. Bilingual, over WhatsApp.`,
    DESC_MAX,
  );
}

/** H1 differs from the <title> on purpose: title targets the query, H1 reads naturally. */
export function townServiceH1(service: Service, town: Town, lang: Lang): string {
  const name = townName(town, lang);
  return lang === 'es'
    ? `${service.name_es} en ${name}, ${town.state}`
    : `${service.name_en} in ${name}, ${town.state}`;
}

export function ogImagePath(slugPath: string): string {
  // Satori-generated OG image, one per page, keyed off the page path.
  return `/og${slugPath}.png`;
}

export function siteName(lang: Lang): string {
  return lang === 'es' ? `${site.brand.name}` : `${site.brand.name}`;
}
