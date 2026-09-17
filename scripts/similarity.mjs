#!/usr/bin/env node
/**
 * Reports near-duplicate pages. Programmatic SEO dies when 96 pages share the
 * same paragraphs, so this compares the BODY COPY of every built page against
 * every other and flags any pair above the threshold.
 *
 * Method: w-shingling with Jaccard similarity over 5-word shingles. Chrome
 * (header, footer, FAQ, form, disclaimer) is identical by design and would
 * swamp the signal, so it is stripped before comparing - only the MDX body
 * inside .prose-body is measured.
 *
 *   npm run similarity              # default threshold 0.70
 *   npm run similarity -- 0.5       # stricter
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = 'dist';
const THRESHOLD = Number(process.argv[2] ?? 0.7);
const SHINGLE = 5;

async function htmlFiles(dir) {
  let out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    console.error(`similarity: ${dir}/ not found. Run "npm run build:only" first.`);
    process.exit(1);
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(await htmlFiles(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

/** Pull only the article body, so shared chrome doesn't inflate similarity. */
function bodyText(html) {
  const m = html.match(/<div[^>]*class="[^"]*prose-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<section/i);
  const scope = m ? m[1] : html;
  return scope
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shingles(text) {
  const words = text.split(' ').filter(Boolean);
  const set = new Set();
  for (let i = 0; i + SHINGLE <= words.length; i++) {
    set.add(words.slice(i, i + SHINGLE).join(' '));
  }
  return set;
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const s of small) if (large.has(s)) inter++;
  return inter / (a.size + b.size - inter);
}

const files = await htmlFiles(DIST);
const docs = [];

for (const file of files) {
  const html = await readFile(file, 'utf8');
  // Only town x service pages are judged. Hubs and legal pages deliberately
  // share a layout, and including them buries the signal this tool exists for.
  if (!html.includes('data-page-type="town-service"')) continue;
  const text = bodyText(html);
  const words = text.split(' ').filter(Boolean).length;
  // Language is part of identity: an ES and EN twin are not duplicates.
  const lang = (html.match(/<html[^>]*lang="([a-z]{2})/i) ?? [])[1] ?? '??';
  docs.push({ file: relative(DIST, file), words, lang, sh: shingles(text) });
}

const thin = docs.filter((d) => d.words < 600);
const pairs = [];

for (let i = 0; i < docs.length; i++) {
  for (let j = i + 1; j < docs.length; j++) {
    // Only compare same-language pages.
    if (docs[i].lang !== docs[j].lang) continue;
    const score = jaccard(docs[i].sh, docs[j].sh);
    if (score >= THRESHOLD) pairs.push({ a: docs[i].file, b: docs[j].file, score });
  }
}

pairs.sort((x, y) => y.score - x.score);

console.log(`similarity: ${docs.length} town x service page(s) of ${files.length} built, threshold ${THRESHOLD}, ${SHINGLE}-word shingles\n`);

if (thin.length) {
  console.log('\x1b[33mThin pages (body under 600 words):\x1b[0m');
  for (const d of thin) console.log(`  ${d.words.toString().padStart(5)}w  ${d.file}`);
  console.log('');
}

if (pairs.length === 0) {
  console.log('\x1b[32mNo page pair exceeds the similarity threshold.\x1b[0m');
} else {
  console.log(`\x1b[31m${pairs.length} near-duplicate pair(s):\x1b[0m`);
  for (const p of pairs) {
    console.log(`  ${(p.score * 100).toFixed(1)}%  ${p.a}\n         ${p.b}`);
  }
}

const wordCounts = docs.map((d) => d.words).sort((a, b) => a - b);
if (wordCounts.length) {
  const median = wordCounts[Math.floor(wordCounts.length / 2)];
  console.log(`\nbody words: min ${wordCounts[0]}, median ${median}, max ${wordCounts.at(-1)}`);
}

// Reporting tool, not a build gate - exits 0 so it can run in CI for visibility.
