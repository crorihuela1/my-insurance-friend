import type { Lang } from './types';

/**
 * Every visible UI string lives here, in both languages. Spanish is written in
 * neutral Latin American register using "tu" form. "aseguranza" appears in
 * headings and CTAs because that is what this audience searches for; body copy
 * uses "seguro".
 */
const strings = {
  es: {
    // Navigation and chrome
    nav_services: 'Seguros',
    nav_towns: 'Ciudades',
    nav_guides: 'Guías',
    nav_about: 'Quiénes somos',
    nav_contact: 'Contacto',
    skip_to_content: 'Saltar al contenido',
    lang_switch: 'English',
    lang_switch_aria: 'Ver esta página en inglés',

    // CTAs
    cta_whatsapp: 'Cotización gratis por WhatsApp',
    cta_whatsapp_short: 'WhatsApp',
    cta_call: 'Llámanos',
    cta_call_short: 'Llamar',
    cta_form: 'Pide tu cotización',
    cta_sticky_aria: 'Contacto rápido',
    response_promise: 'Te contactamos en menos de 5 minutos en horario laboral.',

    // Section headings
    h_local_reality: 'Cómo es esto en',
    h_what_law_requires: 'Qué exige la ley',
    h_cost: 'Cuánto cuesta, en rangos',
    h_process: 'Cómo funciona con nosotros',
    h_faq: 'Preguntas frecuentes',
    h_nearby: 'Ciudades cercanas',
    h_other_services: 'Otros seguros en',
    h_form: 'Pide tu cotización gratis',
    h_guide_related: 'Guía relacionada',

    // Form
    f_name: 'Nombre',
    f_phone: 'Teléfono',
    f_city: 'Ciudad',
    f_business_type: 'Tipo de negocio o vehículo',
    f_has_insurance: '¿Tienes seguro actualmente?',
    f_needs_coi: '¿Necesitas un COI para un trabajo?',
    f_best_time: 'Mejor hora para contactarte',
    f_language: 'Idioma preferido',
    f_yes: 'Sí',
    f_no: 'No',
    f_time_morning: 'Mañana (8am–12pm)',
    f_time_afternoon: 'Tarde (12pm–5pm)',
    f_time_evening: 'Noche (5pm–7pm)',
    f_time_any: 'Cualquier hora',
    f_lang_es: 'Español',
    f_lang_en: 'Inglés',
    f_submit: 'Enviar y recibir cotización',
    f_submitting: 'Enviando…',
    f_required: 'obligatorio',
    f_select: 'Selecciona una opción',
    f_error_generic: 'No pudimos enviar tu mensaje. Escríbenos por WhatsApp y te atendemos igual.',
    f_error_required: 'Completa los campos obligatorios y acepta el consentimiento.',

    // Compliance
    disclaimer_title: 'Aviso importante',
    affiliate_title: 'Divulgación de afiliados',
    breadcrumb_home: 'Inicio',
    fact_source: 'Fuente',
    last_updated: 'Actualizado',
  },
  en: {
    nav_services: 'Insurance',
    nav_towns: 'Cities',
    nav_guides: 'Guides',
    nav_about: 'About us',
    nav_contact: 'Contact',
    skip_to_content: 'Skip to content',
    lang_switch: 'Español',
    lang_switch_aria: 'View this page in Spanish',

    cta_whatsapp: 'Free quote on WhatsApp',
    cta_whatsapp_short: 'WhatsApp',
    cta_call: 'Call us',
    cta_call_short: 'Call',
    cta_form: 'Request your quote',
    cta_sticky_aria: 'Quick contact',
    response_promise: 'We contact you in under 5 minutes during business hours.',

    h_local_reality: 'What this looks like in',
    h_what_law_requires: 'What the law requires',
    h_cost: 'What it costs, in ranges',
    h_process: 'How it works with us',
    h_faq: 'Frequently asked questions',
    h_nearby: 'Nearby cities',
    h_other_services: 'Other insurance in',
    h_form: 'Request your free quote',
    h_guide_related: 'Related guide',

    f_name: 'Name',
    f_phone: 'Phone',
    f_city: 'City',
    f_business_type: 'Business type or vehicle',
    f_has_insurance: 'Do you currently have insurance?',
    f_needs_coi: 'Do you need a COI for a job?',
    f_best_time: 'Best time to reach you',
    f_language: 'Preferred language',
    f_yes: 'Yes',
    f_no: 'No',
    f_time_morning: 'Morning (8am–12pm)',
    f_time_afternoon: 'Afternoon (12pm–5pm)',
    f_time_evening: 'Evening (5pm–7pm)',
    f_time_any: 'Any time',
    f_lang_es: 'Spanish',
    f_lang_en: 'English',
    f_submit: 'Send and get my quote',
    f_submitting: 'Sending…',
    f_required: 'required',
    f_select: 'Select an option',
    f_error_generic: "We couldn't send your message. Message us on WhatsApp and we'll help you there.",
    f_error_required: 'Please complete the required fields and accept the consent.',

    disclaimer_title: 'Important notice',
    affiliate_title: 'Affiliate disclosure',
    breadcrumb_home: 'Home',
    fact_source: 'Source',
    last_updated: 'Updated',
  },
} as const;

export type StringKey = keyof (typeof strings)['es'];

export function t(lang: Lang, key: StringKey): string {
  return strings[lang][key];
}
