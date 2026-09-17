#!/usr/bin/env node
/**
 * Emits one MDX file per town x service x language into
 * src/content/town-service/, skipping any page marked `source: reference` so
 * hand-written copy is never overwritten.
 *
 * Output is deterministic: every variant choice is seeded off the page slug, so
 * re-running produces byte-identical files and git stays quiet. Generated pages
 * render through the same TownServiceLayout as the reference pages.
 *
 *   npm run generate:towns          # write files
 *   npm run generate:towns -- --dry # report what would change, write nothing
 *
 * After generating, always run: npm run build && npm run similarity
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildBody } from './templates/sections.mjs';
import { pick, wrap } from './templates/util.mjs';

const OUT = 'src/content/town-service';
const DRY = process.argv.includes('--dry');
const UPDATED = new Date().toISOString().slice(0, 10);

const towns = JSON.parse(await readFile('src/data/towns.json', 'utf8')).towns;
const services = JSON.parse(await readFile('src/data/services.json', 'utf8')).services;
const facts = JSON.parse(await readFile('src/data/legal_facts.json', 'utf8')).facts;

// --- ledes ------------------------------------------------------------------

const LEDE = {
  es: {
    'contractor-insurance': [
      'Si trabajas por tu cuenta en {town} y un general contractor te pidió el certificado de seguro, esta página te explica qué necesitas, qué exige la ley de {state} y qué puedes esperar pagar.',
      'Lo que un contratista de {town} necesita para registrarse, para entrar a una obra y para no perder un trabajo por un papel: requisitos, rangos de precio y cómo sacar tu COI.',
      'Seguro para contratistas en {town}: qué pide el estado, qué pide tu cliente, cuánto cuesta en rangos reales y cómo te conectamos con un agente con licencia.',
    ],
    'cheap-auto-insurance': [
      'En {town} el carro no es opcional. Esta página explica qué exige {state}, qué mueve el precio de verdad y qué opciones hay si tienes ITIN o licencia extranjera.',
      'Qué cuesta asegurar un carro en {town}, por qué el precio sale como sale, y qué documentos aceptan las aseguradoras. Sin letra chica.',
      'Seguro de auto barato en {town}: los mínimos que exige {state}, los rangos de precio reales, y cómo cotizar en español por WhatsApp.',
    ],
    'renters-insurance': [
      'Si rentas en {town}, el seguro del dueño no cubre tus cosas. Esta página explica qué sí cubre una póliza de inquilino, qué deja fuera y cuánto cuesta.',
      'Qué pasa si se inunda el apartamento de abajo, si hay un incendio en la unidad de al lado, o si el landlord te pide comprobante antes de firmar. Seguro de inquilinos en {town}.',
      'Seguro de inquilinos en {town}: qué cubre, qué no cubre (ojo con la inundación), cuánto cuesta y cómo conseguirlo el mismo día.',
    ],
  },
  en: {
    'contractor-insurance': [
      'If you run your own crew in {town} and a general contractor just asked for your certificate of insurance, this page covers what you need, what {state} law requires, and what you can expect to pay.',
      'What a {town} contractor needs to register, to get on a job site, and to avoid losing work over paperwork: requirements, price ranges, and how to get your COI.',
      'Contractor insurance in {town}: what the state requires, what your client requires, real price ranges, and how we connect you with a licensed agent.',
    ],
    'cheap-auto-insurance': [
      'In {town} a car is not optional. This page explains what {state} requires, what actually moves the price, and the options if you have an ITIN or a foreign license.',
      'What it costs to insure a car in {town}, why the price comes out the way it does, and which documents carriers accept. No fine print.',
      'Cheap auto insurance in {town}: the minimums {state} requires, real price ranges, and how to get quoted in English or Spanish.',
    ],
    'renters-insurance': [
      "If you rent in {town}, the landlord's policy does not cover your belongings. This page explains what a renters policy does cover, what it excludes, and what it costs.",
      'What happens if the apartment below floods, if there is a fire next door, or if the landlord wants proof before signing. Renters insurance in {town}.',
      'Renters insurance in {town}: what it covers, what it does not (watch out for flood), what it costs, and how to get it the same day.',
    ],
  },
};

// --- generate ---------------------------------------------------------------

/** Existing files marked `source: reference` are hand-written and off limits. */
const existing = await readdir(OUT).catch(() => []);
const reference = new Set();
for (const file of existing) {
  if (!file.endsWith('.mdx')) continue;
  const raw = await readFile(join(OUT, file), 'utf8');
  if (/^source:\s*reference\s*$/m.test(raw)) reference.add(file);
}

let written = 0;
let skipped = 0;
let unchanged = 0;

for (const town of towns) {
  for (const service of services) {
    for (const lang of ['es', 'en']) {
      const filename = `${service.slug_en}-${town.slug}-${lang}.mdx`;

      if (reference.has(filename)) {
        skipped++;
        continue;
      }

      const angle = town.angles?.[service.slug_en]?.[lang];
      if (!angle) {
        console.error(`\x1b[31mmissing angle\x1b[0m ${town.slug} / ${service.slug_en} / ${lang}`);
        process.exitCode = 1;
        continue;
      }

      // Facts are filtered to the town's own state: a NJ statute has no business
      // on a Queens page.
      const factIds = service.legal_facts.filter((id) => {
        const f = facts.find((x) => x.id === id);
        return f && f.jurisdiction === town.state;
      });

      const name = lang === 'es' ? town.name_es : town.name_en;
      const stateName = lang === 'es'
        ? (town.state === 'NJ' ? 'Nueva Jersey' : 'Nueva York')
        : (town.state === 'NJ' ? 'New Jersey' : 'New York');

      const lede = pick(LEDE[lang][service.slug_en], `${town.slug}:${service.slug_en}:${lang}:lede`)
        .replace(/\{town\}/g, name)
        .replace(/\{state\}/g, stateName);

      const body = buildBody({ town, service, lang, angle, factIds, nearby: town.nearby_slugs.map((s) => towns.find((t) => t.slug === s)).filter(Boolean) });

      // title/description are intentionally omitted: seo.ts computes and clamps
      // them to 60/155, so generated pages can never breach the limits.
      const frontmatter = [
        '---',
        `town: ${town.slug}`,
        `service: ${service.slug_en}`,
        `lang: ${lang}`,
        `lede: ${JSON.stringify(lede)}`,
        `updated: ${UPDATED}`,
        'source: generated',
        '---',
      ].join('\n');

      const imports = factIds.length ? `\nimport Fact from '../../components/Fact.astro';\n` : '';
      const contents = `${frontmatter}\n${imports}\n${wrap(body)}\n`;

      const path = join(OUT, filename);
      const prev = await readFile(path, 'utf8').catch(() => null);
      // Ignore the `updated:` line when diffing so a re-run doesn't touch every
      // file just because the date changed.
      const strip = (s) => (s ?? '').replace(/^updated:.*$/m, '');
      if (prev !== null && strip(prev) === strip(contents)) {
        unchanged++;
        continue;
      }

      if (!DRY) await writeFile(path, contents);
      written++;
    }
  }
}

const verb = DRY ? 'would write' : 'wrote';
console.log(`generate-town-pages: ${verb} ${written}, unchanged ${unchanged}, skipped ${skipped} reference page(s)`);
console.log(`total routes: ${towns.length * services.length * 2}`);
if (!DRY) console.log('\nNext: npm run build && npm run similarity');
