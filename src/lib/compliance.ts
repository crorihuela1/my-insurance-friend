import { site } from './data';
import type { Lang } from './types';

/**
 * Legally sensitive copy. CONSENT_VERSION is stored alongside every lead, so if
 * you change consent_text you MUST bump the version in src/data/site.json -
 * otherwise stored consent records point at text that no longer exists.
 */
export const CONSENT_VERSION = site.forms.consent_version;

const BRAND = site.brand.name;

export const disclaimer = {
  es: `${BRAND} no es una agencia de seguros ni un corredor con licencia, y no vende, emite ni administra pólizas. Te conectamos con agentes y agencias con licencia en Nueva Jersey y Nueva York. Podemos recibir una tarifa fija de referido o de publicidad por esa conexión. Esa tarifa no depende de si compras una póliza, de qué póliza compras ni de cuánto pagas. La información de este sitio es educativa y general; no es asesoría de seguros. Solo un agente con licencia puede evaluar tu situación y recomendarte coberturas.`,
  en: `${BRAND} is not a licensed insurance agency or broker, and does not sell, issue or service policies. We connect you with licensed agents and agencies in New Jersey and New York. We may receive a flat referral or advertising fee for that connection. That fee does not depend on whether you buy a policy, which policy you buy, or what you pay. Information on this site is educational and general; it is not insurance advice. Only a licensed agent can evaluate your situation and recommend coverage.`,
} as const;

export const affiliateDisclosure = {
  es: `Algunos enlaces de esta página son enlaces de afiliado. Si compras a través de ellos, ${BRAND} puede recibir una comisión sin costo adicional para ti. Esto no cambia el precio que pagas ni el orden en que presentamos las opciones.`,
  en: `Some links on this page are affiliate links. If you buy through them, ${BRAND} may earn a commission at no additional cost to you. This does not change the price you pay or the order in which we present options.`,
} as const;

/**
 * TCPA prior express written consent. Must be unchecked by default, must name
 * the company, must disclose automated technology, must not be a condition of
 * purchase, and must link to the privacy policy.
 */
export const consentText = {
  es: `Al marcar esta casilla doy mi consentimiento expreso por escrito para que ${BRAND} y los agentes de seguros con licencia a los que me refiera me contacten al número de teléfono que proporcioné, incluyendo llamadas y mensajes de texto (SMS) enviados con sistemas de marcación automática o voz pregrabada. Entiendo que dar este consentimiento no es condición para comprar ningún producto o servicio, que pueden aplicar tarifas de mensajes y datos de mi compañía telefónica, y que puedo revocarlo en cualquier momento respondiendo STOP a un mensaje o pidiéndolo por escrito. He leído la Política de Privacidad y los Términos.`,
  en: `By checking this box I give my express written consent for ${BRAND} and the licensed insurance agents it refers me to to contact me at the phone number I provided, including calls and text messages (SMS) sent using automated dialing technology or a prerecorded voice. I understand that giving this consent is not a condition of purchasing any product or service, that message and data rates may apply from my carrier, and that I may revoke it at any time by replying STOP to a message or requesting it in writing. I have read the Privacy Policy and Terms.`,
} as const;

export const consentLinks = {
  es: { privacy: '/es/privacidad', terms: '/es/terminos', disclaimer: '/es/aviso-legal' },
  en: { privacy: '/en/privacy', terms: '/en/terms', disclaimer: '/en/disclaimer' },
} as const;

export function disclaimerText(lang: Lang): string {
  return disclaimer[lang];
}
