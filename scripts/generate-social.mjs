#!/usr/bin/env node
/**
 * Generates social post copy from the same data that drives the site, so a
 * legal change in legal_facts.json updates the posts too.
 *
 * Produces three kinds of post:
 *   - local:  town x service, built on the town's own angle
 *   - faq:    one question from services.json, answered
 *   - fact:   one cited legal fact, in plain language
 *
 * Every caption is validated against scripts/compliance-rules.json before it is
 * written. Social posts are marketing by an unlicensed entity, so they carry the
 * same restrictions as the site: no recommending coverage, no quoting the reader
 * a premium, no claiming we are licensed. A violation fails the run.
 *
 *   npm run social              # write social/queue.json + social/posts.csv
 *   npm run social -- --limit 40
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { hash, pick } from './templates/util.mjs';

const OUT = 'social';
const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;

const towns = JSON.parse(await readFile('src/data/towns.json', 'utf8')).towns;
const services = JSON.parse(await readFile('src/data/services.json', 'utf8')).services;
const facts = JSON.parse(await readFile('src/data/legal_facts.json', 'utf8')).facts;
const site = JSON.parse(await readFile('src/data/site.json', 'utf8'));
const social = JSON.parse(await readFile('src/data/social.json', 'utf8'));
const rules = JSON.parse(await readFile('scripts/compliance-rules.json', 'utf8'));

const DOMAIN = site.brand.domain.replace(/\/$/, '');
const NEGATORS = /\b(no|not|never|nunca|tampoco|ni)\s+$/i;

/** Same check the site build runs, applied to caption text. */
function complianceErrors(text, where) {
  const lower = text.toLowerCase();
  const out = [];
  for (const rule of rules.forbidden) {
    const needle = rule.pattern.toLowerCase();
    let from = 0;
    let i;
    while ((i = lower.indexOf(needle, from)) !== -1) {
      from = i + needle.length;
      if (NEGATORS.test(lower.slice(Math.max(0, i - 14), i))) continue;
      out.push(`${where}: forbidden phrase "${rule.pattern}" - ${rule.why}`);
    }
  }
  return out;
}

const townUrl = (service, town, lang) =>
  lang === 'es'
    ? `${DOMAIN}/es/${service.url_pattern_es.replace('{town}', town.slug)}`
    : `${DOMAIN}/en/${service.url_pattern_en.replace('{town}', town.slug)}`;

function tags(service, lang, max) {
  const base = lang === 'es' ? social.hashtags.base_es : social.hashtags.base_en;
  const svc = service ? social.hashtags.by_service[service.slug_en][lang] : [];
  return [...svc, ...base].slice(0, max);
}

/** First sentence of the angle, trimmed to a scroll-stopping length. */
function hook(text, max = 180) {
  const first = text.split(/(?<=\.)\s/)[0] ?? text;
  return first.length <= max ? first : `${first.slice(0, max - 1).replace(/\s\S*$/, '')}…`;
}

const items = [];

// --- local: town x service ---------------------------------------------------
for (const town of towns) {
  for (const service of services) {
    for (const lang of ['es', 'en']) {
      const angle = town.angles?.[service.slug_en]?.[lang];
      if (!angle) continue;
      const name = lang === 'es' ? town.name_es : town.name_en;
      const sname = lang === 'es' ? service.name_es : service.name_en;
      const seed = `social:${town.slug}:${service.slug_en}:${lang}`;

      const openers = lang === 'es'
        ? [`${name}, ${town.state}: esto es lo que casi nadie te explica sobre ${sname.toLowerCase()}.`,
           `Si trabajas o vives en ${name}, esto te toca.`,
           `Lo que más nos preguntan en ${name} sobre ${sname.toLowerCase()}:`]
        : [`${name}, ${town.state}: here's what nobody explains about ${sname.toLowerCase()}.`,
           `If you live or work in ${name}, this one's for you.`,
           `The question we get most in ${name} about ${sname.toLowerCase()}:`];

      const closers = lang === 'es'
        ? ['Te conectamos gratis con un agente con licencia. Escríbenos por WhatsApp.',
           'Lo explicamos completo aquí, en español, sin costo:',
           '¿Dudas? Escríbenos por WhatsApp y te conectamos con un agente con licencia.']
        : ['We connect you with a licensed agent, free. Message us on WhatsApp.',
           'Full explanation here, no cost:',
           'Questions? Message us and we connect you with a licensed agent.'];

      items.push({
        kind: 'local',
        lang,
        town: town.slug,
        service: service.slug_en,
        link: townUrl(service, town, lang),
        body: `${pick(openers, seed + ':open')}\n\n${hook(angle, 260)}\n\n${pick(closers, seed + ':close')}`,
        media_brief: lang === 'es'
          ? `Foto o gráfico con el nombre "${name}, ${town.state}" y el texto "${sname}". Mostrar gente real de oficio, no stock corporativo.`
          : `Photo or graphic reading "${name}, ${town.state}" with "${sname}". Real trade workers, not corporate stock.`,
        script_seed: hook(angle, 200),
        serviceRef: service,
      });
    }
  }
}

// --- faq ---------------------------------------------------------------------
for (const service of services) {
  for (const faq of service.faq) {
    for (const lang of ['es', 'en']) {
      const q = lang === 'es' ? faq.q_es : faq.q_en;
      const a = lang === 'es' ? faq.a_es : faq.a_en;
      items.push({
        kind: 'faq',
        lang,
        town: '',
        service: service.slug_en,
        link: `${DOMAIN}/${lang}/${lang === 'es' ? service.slug_es : service.slug_en}`,
        body: `${q}\n\n${hook(a, 320)}\n\n${lang === 'es' ? 'Te conectamos gratis con un agente con licencia en NJ y NY.' : 'We connect you with a licensed NJ/NY agent, free.'}`,
        media_brief: lang === 'es'
          ? `Tarjeta de texto: la pregunta grande arriba, la respuesta corta abajo. Alto contraste, legible en móvil.`
          : `Text card: question large on top, short answer below. High contrast, readable on mobile.`,
        script_seed: q,
        serviceRef: service,
      });
    }
  }
}

// --- fact --------------------------------------------------------------------
for (const fact of facts) {
  for (const lang of ['es', 'en']) {
    const text = lang === 'es' ? fact.text_es : fact.text_en;
    const svc = services.find((s) => s.legal_facts.includes(fact.id));
    items.push({
      kind: 'fact',
      lang,
      town: '',
      service: svc?.slug_en ?? '',
      link: `${DOMAIN}/${lang}`,
      body: `${lang === 'es' ? 'Dato que conviene saber' : 'Worth knowing'} (${fact.jurisdiction}):\n\n${hook(text, 320)}\n\n${lang === 'es' ? 'Fuente' : 'Source'}: ${fact.citation}`,
      media_brief: lang === 'es'
        ? `Tarjeta con la cifra o la fecha clave en grande, y la cita legal pequeña abajo.`
        : `Card with the key figure or date large, legal citation small underneath.`,
      script_seed: hook(text, 200),
      serviceRef: svc ?? null,
    });
  }
}

// --- render per platform -----------------------------------------------------
const posts = [];
const errors = [];

for (const item of items.slice(0, LIMIT)) {
  for (const [platform, cfg] of Object.entries(social.platforms)) {
    if (!cfg.enabled) continue;

    const ht = tags(item.serviceRef, item.lang, cfg.hashtag_max);
    const footer = social.compliance_footer[item.lang];
    const isVideo = cfg.media_kind === 'video';

    let caption = [item.body, item.link, ht.join(' '), footer].filter(Boolean).join('\n\n');
    if (caption.length > cfg.caption_max) {
      // Drop the link first (bio link covers it), then trim the body.
      caption = [item.body, ht.join(' '), footer].join('\n\n');
      if (caption.length > cfg.caption_max) {
        const room = cfg.caption_max - (ht.join(' ').length + footer.length + 8);
        caption = [`${item.body.slice(0, room - 1).replace(/\s\S*$/, '')}…`, ht.join(' '), footer].join('\n\n');
      }
    }

    const id = `${item.kind}-${item.service || 'general'}-${item.town || 'all'}-${item.lang}-${platform}`
      .replace(/-+/g, '-');

    errors.push(...complianceErrors(caption, id));

    posts.push({
      id,
      platform,
      lang: item.lang,
      kind: item.kind,
      town: item.town,
      service: item.service,
      caption,
      chars: caption.length,
      link: item.link,
      media_required: cfg.needs_media,
      media_kind: cfg.media_kind ?? (cfg.needs_media ? 'image' : ''),
      media_brief: cfg.needs_media ? item.media_brief : '',
      // You fill this in. IG and TikTok fetch media from a public URL; the
      // publisher refuses to post a media-required item without one.
      media_url: '',
      video_script: isVideo
        ? (item.lang === 'es'
            ? `GANCHO (0-3s): "${item.script_seed}"\nDESARROLLO (3-25s): explica el punto con un ejemplo concreto de la zona.\nCIERRE (25-30s): "Te conectamos gratis con un agente con licencia. Link en bio."`
            : `HOOK (0-3s): "${item.script_seed}"\nBODY (3-25s): explain the point with one concrete local example.\nCLOSE (25-30s): "We connect you with a licensed agent, free. Link in bio."`)
        : '',
      status: 'draft',
      scheduled_for: '',
    });
  }
}

if (errors.length) {
  for (const e of errors) console.error(`\x1b[31mfail\x1b[0m  ${e}`);
  console.error(`\n\x1b[31m${errors.length} compliance violation(s) in generated captions. Nothing written.\x1b[0m`);
  process.exit(1);
}

const overLimit = posts.filter((p) => {
  const cfg = social.platforms[p.platform];
  return p.chars > cfg.caption_max;
});
if (overLimit.length) {
  console.error(`\x1b[31m${overLimit.length} caption(s) still exceed the platform limit.\x1b[0m`);
  process.exit(1);
}

// Preserve fields a human filled in - regenerating copy must not wipe the
// media URLs and schedule someone entered by hand.
let previous = {};
try {
  const old = JSON.parse(await readFile(`${OUT}/queue.json`, 'utf8'));
  for (const p of old.posts ?? []) previous[p.id] = p;
} catch { /* first run */ }
let carried = 0;
for (const p of posts) {
  const prev = previous[p.id];
  if (!prev) continue;
  if (prev.media_url) { p.media_url = prev.media_url; carried++; }
  if (prev.status && prev.status !== 'draft') p.status = prev.status;
  if (prev.scheduled_for) p.scheduled_for = prev.scheduled_for;
}
if (carried) console.log(`carried over ${carried} media URL(s) from the previous queue`);

await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/queue.json`, JSON.stringify({ generated: new Date().toISOString(), posts }, null, 2));

const cols = ['id', 'platform', 'lang', 'kind', 'town', 'service', 'caption', 'chars', 'link', 'media_required', 'media_kind', 'media_brief', 'media_url', 'video_script', 'status', 'scheduled_for'];
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
await writeFile(`${OUT}/posts.csv`, [cols.join(','), ...posts.map((p) => cols.map((c) => esc(p[c])).join(','))].join('\n'));

const byPlatform = posts.reduce((a, p) => ((a[p.platform] = (a[p.platform] ?? 0) + 1), a), {});
console.log(`generate-social: ${posts.length} post(s) across ${Object.keys(byPlatform).length} platform(s)`);
for (const [k, v] of Object.entries(byPlatform)) console.log(`  ${k.padEnd(11)} ${v}`);
console.log(`\nby kind: ${['local', 'faq', 'fact'].map((k) => `${k} ${posts.filter((p) => p.kind === k).length}`).join(', ')}`);
console.log(`\nwrote ${OUT}/queue.json and ${OUT}/posts.csv`);
console.log('\x1b[32mall captions passed compliance\x1b[0m');
