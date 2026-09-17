export type Lang = 'es' | 'en';

export interface Town {
  slug: string;
  name_en: string;
  name_es: string;
  state: 'NJ' | 'NY';
  county: string;
  county_es: string;
  zip_list: string[];
  hispanic_pct: number;
  pop: number;
  lat: number;
  lng: number;
  nearby_slugs: string[];
  local_notes_es: string;
  local_notes_en: string;
  angles: Record<string, { es: string; en: string }>;
}

export interface ServiceFaq {
  q_es: string;
  a_es: string;
  q_en: string;
  a_en: string;
}

export interface Service {
  slug_en: string;
  slug_es: string;
  url_pattern_en: string;
  url_pattern_es: string;
  name_en: string;
  name_es: string;
  search_term_es: string;
  lines: string[];
  lines_label_es: string;
  lines_label_en: string;
  audience_es: string;
  audience_en: string;
  legal_facts: string[];
  cost_range_es: string;
  cost_range_en: string;
  affiliate_partners: string[];
  faq: ServiceFaq[];
}

export interface LegalFact {
  id: string;
  jurisdiction: 'NJ' | 'NY';
  lines: string[];
  citation: string;
  source_url: string;
  effective: string;
  verify_by: string;
  text_es: string;
  text_en: string;
}
