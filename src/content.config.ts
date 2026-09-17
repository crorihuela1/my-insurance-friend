import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * One MDX file per town x service x language. The four Paterson reference pages
 * are hand-written; scripts/generate-town-pages.mjs emits the rest into this
 * same collection, so hand-tuned and generated pages render identically.
 */
const townService = defineCollection({
  loader: glob({ base: './src/content/town-service', pattern: '**/*.mdx' }),
  schema: z.object({
    town: z.string(),
    service: z.string(),
    lang: z.enum(['es', 'en']),
    /** Optional overrides; SEO defaults are computed from data when omitted. */
    title: z.string().max(60, "Title must be <= 60 chars for SERP truncation.").optional(),
    description: z.string().max(155, "Meta description must be <= 155 chars.").optional(),
    h1: z.string().optional(),
    /** One-sentence hook rendered above the fold, before the first CTA. */
    lede: z.string(),
    updated: z.coerce.date(),
    /** 'reference' = hand-written; 'generated' = emitted by the generator. */
    source: z.enum(['reference', 'generated']).default('generated'),
  }),
});

const guides = defineCollection({
  loader: glob({ base: './src/content/guides', pattern: '**/*.mdx' }),
  schema: z.object({
    lang: z.enum(['es', 'en']),
    slug_es: z.string(),
    slug_en: z.string(),
    title: z.string().max(60, 'Guide title must be <= 60 chars.'),
    description: z.string().max(155, 'Guide meta description must be <= 155 chars.'),
    h1: z.string(),
    lede: z.string(),
    service: z.string().optional(),
    published: z.coerce.date(),
    updated: z.coerce.date(),
  }),
});

export const collections = { 'town-service': townService, guides };
