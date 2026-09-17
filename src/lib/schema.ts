import { absolute, townServicePath } from './urls';
import { countyName, site, towns, townName } from './data';
import type { Lang, Service, ServiceFaq, Town } from './types';

/**
 * schema.org builders. Everything returns a plain object; the layout serializes
 * them into a single @graph so we emit one script tag per page rather than four.
 */

export function localBusiness(lang: Lang) {
  const a = site.contact.address;
  return {
    '@type': 'InsuranceAgency',
    '@id': `${site.brand.domain}/#organization`,
    name: site.brand.name,
    url: site.brand.domain,
    telephone: site.contact.phone_e164,
    email: site.contact.email,
    description: lang === 'es' ? site.brand.tagline_es : site.brand.tagline_en,
    address: {
      '@type': 'PostalAddress',
      streetAddress: a.street,
      addressLocality: a.locality,
      addressRegion: a.region,
      postalCode: a.postal_code,
      addressCountry: a.country,
    },
    areaServed: towns.map((t) => ({
      '@type': 'City',
      name: townName(t, lang),
      containedInPlace: { '@type': 'AdministrativeArea', name: `${t.county} County, ${t.state}` },
      geo: { '@type': 'GeoCoordinates', latitude: t.lat, longitude: t.lng },
    })),
    availableLanguage: [
      { '@type': 'Language', name: 'Spanish', alternateName: 'es' },
      { '@type': 'Language', name: 'English', alternateName: 'en' },
    ],
  };
}

export function faqPage(faq: ServiceFaq[], lang: Lang, pageUrl: string) {
  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: lang === 'es' ? f.q_es : f.q_en,
      acceptedAnswer: { '@type': 'Answer', text: lang === 'es' ? f.a_es : f.a_en },
    })),
  };
}

export function breadcrumbs(items: Array<{ name: string; path: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

export function articleSchema(opts: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  lang: Lang;
}) {
  return {
    '@type': 'Article',
    '@id': `${opts.url}#article`,
    headline: opts.headline,
    description: opts.description,
    inLanguage: opts.lang === 'es' ? 'es-US' : 'en-US',
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
    publisher: { '@id': `${site.brand.domain}/#organization` },
    author: { '@id': `${site.brand.domain}/#organization` },
  };
}

/** Service offering scoped to one town, used on town x service pages. */
export function serviceSchema(service: Service, town: Town, lang: Lang) {
  const url = absolute(townServicePath(service, town, lang));
  return {
    '@type': 'Service',
    '@id': `${url}#service`,
    name: lang === 'es' ? service.name_es : service.name_en,
    serviceType: lang === 'es' ? service.name_es : service.name_en,
    provider: { '@id': `${site.brand.domain}/#organization` },
    areaServed: {
      '@type': 'City',
      name: townName(town, lang),
      containedInPlace: { '@type': 'AdministrativeArea', name: countyName(town, 'en') },
    },
    audience: {
      '@type': 'Audience',
      audienceType: lang === 'es' ? service.audience_es : service.audience_en,
    },
  };
}

export function graph(nodes: object[]) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
}
