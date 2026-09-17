#!/usr/bin/env node
/**
 * Fails the build if any page in dist/ breaks a hard compliance requirement.
 * This runs on BUILT HTML, not source, so copy that sneaks in through MDX,
 * a component default or a data file is caught the same as hardcoded text.
 *
 * Checks:
 *   1. No forbidden phrase (advice, premium quotes, false licensure claims).
 *   2. Every page renders the disclaimer.
 *   3. Any page with an affiliate link also carries the affiliate disclosure.
 *   4. No TCPA consent checkbox is pre-checked.
 *   5. Title <= 60 and meta description <= 155 characters.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = 'dist';
const rules = JSON.parse(await readFile(new URL('./compliance-rules.json', import.meta.url), 'utf8'));

/** Words that flip the meaning of a following phrase. */
const NEGATORS = /\b(no|not|never|nunca|tampoco|jamás|sin ser|ni)\s+$/i;

const errors = [];
const warnings = [];

async function htmlFiles(dir) {
  let out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    console.error(`\x1b[31mcompliance: ${dir}/ not found. Run "npm run build:only" first.\x1b[0m`);
    process.exit(1);
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(await htmlFiles(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

/** Strip tags and JSON-LD so we match visible copy, not markup or schema. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

function attr(html, re) {
  const m = html.match(re);
  return m ? decodeEntities(m[1]) : null;
}

/** Titles are measured as a reader sees them, so "&#39;" counts as one char. */
function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');
}

const files = await htmlFiles(DIST);
if (files.length === 0) {
  console.error('\x1b[31mcompliance: no HTML files in dist/.\x1b[0m');
  process.exit(1);
}

for (const file of files) {
  const rel = relative(DIST, file);
  const html = await readFile(file, 'utf8');
  const text = visibleText(html).toLowerCase();

  // 1. Forbidden phrases. A phrase directly negated ("no somos una agencia con
  //    licencia") is the correct thing to say, so it is reported as a warning
  //    rather than failing the build - but it is never silently ignored.
  for (const rule of rules.forbidden) {
    const needle = rule.pattern.toLowerCase();
    let from = 0;
    let idx;
    while ((idx = text.indexOf(needle, from)) !== -1) {
      from = idx + needle.length;
      const before = text.slice(Math.max(0, idx - 14), idx);
      if (NEGATORS.test(before)) {
        warnings.push(`${rel}: "${rule.pattern}" appears negated ("...${before.trim()}${rule.pattern}"). Allowed, but read it.`);
      } else {
        errors.push(`${rel}: forbidden phrase "${rule.pattern}" - ${rule.why}`);
      }
    }
  }

  // 2. Disclaimer on every page
  if (!html.includes('data-disclaimer')) {
    errors.push(`${rel}: no <Disclaimer /> rendered. Required on every page.`);
  }

  // 3. Affiliate disclosure where affiliate links exist
  const hasAffiliate = rules.affiliate_markers.some((m) => html.includes(m));
  if (hasAffiliate && !html.includes('data-affiliate-disclosure')) {
    errors.push(`${rel}: has an affiliate link but no <AffiliateDisclosure />. FTC requires it above the first link.`);
  }

  // 4. TCPA checkbox must never ship pre-checked
  const consentTags = html.match(/<input[^>]*name="tcpa_consent"[^>]*>/gi) ?? [];
  for (const tag of consentTags) {
    if (/\bchecked\b/i.test(tag)) {
      errors.push(`${rel}: TCPA consent checkbox is pre-checked. It must be unchecked by default.`);
    }
  }

  // 5. Title and description length
  const title = attr(html, /<title>([\s\S]*?)<\/title>/i);
  if (title && title.length > 60) {
    warnings.push(`${rel}: <title> is ${title.length} chars (max 60): ${title}`);
  }
  const desc = attr(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  if (desc && desc.length > 155) {
    warnings.push(`${rel}: meta description is ${desc.length} chars (max 155).`);
  }
  if (!desc) warnings.push(`${rel}: missing meta description.`);
}

for (const w of warnings) console.warn(`\x1b[33mwarn\x1b[0m  ${w}`);
for (const e of errors) console.error(`\x1b[31mfail\x1b[0m  ${e}`);

console.log(
  `\ncompliance: scanned ${files.length} page(s) - ${errors.length} error(s), ${warnings.length} warning(s)`,
);

if (errors.length > 0) {
  console.error('\x1b[31m\nBuild failed compliance lint.\x1b[0m');
  process.exit(1);
}
console.log('\x1b[32mcompliance: passed\x1b[0m');
