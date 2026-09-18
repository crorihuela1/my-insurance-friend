import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { countyName, getService, getTown, services, towns, townName } from '../../lib/data';
import { renderOg, type OgInput } from '../../lib/og';
import {
  guidePath, homePath, serviceHubPath, stateHubPath, townHubPath, townServicePath,
} from '../../lib/urls';
import type { Lang } from '../../lib/types';

/**
 * One Open Graph image per page, rendered at build time.
 *
 * The route mirrors the page path: /es/seguro-para-contratistas-en-paterson is
 * served an image at /og/es/seguro-para-contratistas-en-paterson.png. That
 * mapping lives in seo.ts (ogImagePath) so the page and the image can't drift.
 */

/** Static pages whose titles aren't derivable from data. */
const STATIC: Record<string, { es: [string, string?]; en: [string, string?] }> = {
  home: { es: ['Seguros explicados en español', 'Nueva Jersey y Nueva York'], en: ['Insurance explained plainly', 'New Jersey and New York'] },
  guidesIndex: { es: ['Guías de seguros', 'Con la ley de NJ citada y enlazada'], en: ['Insurance guides', 'NJ law cited and linked'] },
  privacy: { es: ['Política de Privacidad'], en: ['Privacy Policy'] },
  terms: { es: ['Términos de Uso'], en: ['Terms of Use'] },
  disclaimer: { es: ['Aviso Legal', 'Qué somos y qué no somos'], en: ['Disclaimer', 'What we are and what we are not'] },
  about: { es: ['Quiénes somos', 'Servicio de referido, no agencia'], en: ['About us', 'A referral service, not an agency'] },
  thanks: { es: ['¡Gracias!', 'Te contactamos en minutos'], en: ['Thank you', "We'll contact you in minutes"] },
};

const STATIC_PATHS: Array<[string, keyof typeof STATIC, Lang]> = [
  ['/es/privacidad', 'privacy', 'es'], ['/en/privacy', 'privacy', 'en'],
  ['/es/terminos', 'terms', 'es'], ['/en/terms', 'terms', 'en'],
  ['/es/aviso-legal', 'disclaimer', 'es'], ['/en/disclaimer', 'disclaimer', 'en'],
  ['/es/quienes-somos', 'about', 'es'], ['/en/about', 'about', 'en'],
  ['/es/gracias', 'thanks', 'es'], ['/en/thank-you', 'thanks', 'en'],
  ['/es/guias', 'guidesIndex', 'es'], ['/en/guides', 'guidesIndex', 'en'],
];

export async function getStaticPaths() {
  const out: Array<{ params: { slug: string }; props: OgInput }> = [];
  const langs: Lang[] = ['es', 'en'];
  // The route file is [...slug].png.ts, so the .png is appended by Astro.
  const add = (path: string, props: OgInput) =>
    out.push({ params: { slug: path.replace(/^\//, '') }, props });

  // Town x service - the pages that actually get shared.
  for (const entry of await getCollection('town-service')) {
    const town = getTown(entry.data.town);
    const service = getService(entry.data.service);
    const lang = entry.data.lang as Lang;
    add(townServicePath(service, town, lang), {
      lang,
      badge: town.state,
      title: `${lang === 'es' ? service.name_es : service.name_en} ${lang === 'es' ? 'en' : 'in'} ${townName(town, lang)}`,
      subtitle: `${countyName(town, lang)} · ${town.zip_list.slice(0, 4).join(' · ')}`,
    });
  }

  // Guides.
  for (const g of await getCollection('guides')) {
    const lang = g.data.lang as Lang;
    add(guidePath({ es: g.data.slug_es, en: g.data.slug_en }, lang), {
      lang,
      badge: lang === 'es' ? 'GUÍA' : 'GUIDE',
      title: g.data.h1,
      subtitle: lang === 'es' ? 'Guía completa, en español' : 'Full guide',
      // Guides are content, not product. No quote CTA on a guide card.
      cta: lang === 'es' ? 'Lee la guía completa' : 'Read the full guide',
    });
  }

  for (const lang of langs) {
    for (const town of towns) {
      add(townHubPath(town, lang), {
        lang,
        badge: town.state,
        title: `${lang === 'es' ? 'Seguros en' : 'Insurance in'} ${townName(town, lang)}`,
        subtitle: `${countyName(town, lang)} · ${services.map((s) => (lang === 'es' ? s.name_es : s.name_en)).join(' · ')}`,
      });
    }
    for (const service of services) {
      add(serviceHubPath(service, lang), {
        lang,
        badge: 'NJ · NY',
        title: lang === 'es' ? service.name_es : service.name_en,
        subtitle: lang === 'es' ? service.lines_label_es : service.lines_label_en,
      });
    }
    add(stateHubPath(lang), {
      lang,
      badge: 'NJ · NY',
      title: lang === 'es' ? 'Seguros en NJ y NY' : 'Insurance in NJ & NY',
      subtitle: `${towns.length} ${lang === 'es' ? 'ciudades' : 'cities'} · ${services.length} ${lang === 'es' ? 'tipos de seguro' : 'insurance types'}`,
    });
    const home = STATIC.home[lang];
    add(homePath(lang), { lang, badge: 'NJ · NY', title: home[0], subtitle: home[1] });
  }

  for (const [path, key, lang] of STATIC_PATHS) {
    const [title, subtitle] = STATIC[key][lang];
    // Legal and about cards are informational too.
    const informational = key !== 'home';
    add(path, {
      lang, title, subtitle,
      ...(informational ? { cta: lang === 'es' ? 'Lee más' : 'Read more' } : {}),
    });
  }

  return out;
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props as OgInput);
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
