import townsJson from '../data/towns.json';
import servicesJson from '../data/services.json';
import factsJson from '../data/legal_facts.json';
import siteJson from '../data/site.json';
import type { Lang, LegalFact, Service, Town } from './types';

export const site = siteJson;
export const towns = townsJson.towns as Town[];
export const services = servicesJson.services as Service[];
export const legalFacts = factsJson.facts as LegalFact[];

export function getTown(slug: string): Town {
  const t = towns.find((x) => x.slug === slug);
  if (!t) throw new Error(`Unknown town slug: ${slug}. Add it to src/data/towns.json.`);
  return t;
}

export function getService(slugEn: string): Service {
  const s = services.find((x) => x.slug_en === slugEn);
  if (!s) throw new Error(`Unknown service: ${slugEn}. Add it to src/data/services.json.`);
  return s;
}

export function getFact(id: string): LegalFact {
  const f = legalFacts.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown legal fact id: ${id}. Add it to src/data/legal_facts.json.`);
  return f;
}

export function factText(id: string, lang: Lang): string {
  const f = getFact(id);
  return lang === 'es' ? f.text_es : f.text_en;
}

/** Facts for a service, filtered to the state the town is in (plus anything shared). */
export function factsFor(service: Service, town: Town): LegalFact[] {
  return service.legal_facts.map(getFact).filter((f) => f.jurisdiction === town.state);
}

export function townName(town: Town, lang: Lang): string {
  return lang === 'es' ? town.name_es : town.name_en;
}

export function serviceName(service: Service, lang: Lang): string {
  return lang === 'es' ? service.name_es : service.name_en;
}

export function countyName(town: Town, lang: Lang): string {
  return lang === 'es' ? town.county_es : `${town.county} County`;
}

export function angle(town: Town, serviceSlugEn: string, lang: Lang): string {
  const a = town.angles?.[serviceSlugEn];
  if (!a) throw new Error(`Town ${town.slug} is missing an angle for service ${serviceSlugEn}.`);
  return a[lang];
}

export function nearbyTowns(town: Town): Town[] {
  return town.nearby_slugs.map(getTown);
}

/** Towns grouped by county, for pillar-guide internal linking. */
export function townsByCounty(state?: 'NJ' | 'NY'): Map<string, Town[]> {
  const out = new Map<string, Town[]>();
  for (const t of towns) {
    if (state && t.state !== state) continue;
    const key = `${t.county}|${t.state}`;
    if (!out.has(key)) out.set(key, []);
    out.get(key)!.push(t);
  }
  return out;
}
