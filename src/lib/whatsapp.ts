import { site } from './data';
import type { Lang } from './types';

/**
 * WhatsApp deep link with a prefilled message naming the page the visitor came
 * from, so the first message already carries the lead's intent. wa.me works in
 * both the app and WhatsApp Web without any client JS.
 */
export function whatsappUrl(opts: { lang: Lang; context: string; slug: string }): string {
  const { lang, context, slug } = opts;
  const body =
    lang === 'es'
      ? `Hola, vi la página de ${context} y quiero una cotización gratis. (ref: ${slug})`
      : `Hi, I saw your ${context} page and I'd like a free quote. (ref: ${slug})`;
  return `https://wa.me/${site.contact.whatsapp_e164}?text=${encodeURIComponent(body)}`;
}

export function telUrl(): string {
  return `tel:${site.contact.phone_e164}`;
}
