#!/usr/bin/env node
/**
 * Verifies every internal link in dist/ resolves to a real file. A site that
 * links its own TCPA consent to a missing privacy policy is not launchable, so
 * this runs as part of the build.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = 'dist';

async function walk(dir) {
  let out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(await walk(p));
    else out.push(p);
  }
  return out;
}

const all = await walk(DIST).catch(() => []);
if (!all.length) {
  console.error('check-links: dist/ is empty. Run "npm run build:only" first.');
  process.exit(1);
}
const pages = all.filter((f) => f.endsWith('.html'));
const known = new Set(all.map((f) => '/' + relative(DIST, f).split('\\').join('/')));

async function exists(path) {
  // build.format 'file' emits /es/foo.html and serves it at /es/foo.
  if (known.has(path) || known.has(`${path}.html`) || known.has(`${path}/index.html`)) return true;
  try {
    await stat(join(DIST, path));
    return true;
  } catch {
    return false;
  }
}

const broken = new Map();
let checked = 0;

for (const page of pages) {
  const html = await readFile(page, 'utf8');
  const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    // Skip external, anchors, and non-http schemes (tel:, mailto:, wa.me).
    if (/^(https?:)?\/\//.test(href) || /^(#|tel:|mailto:|data:|javascript:)/.test(href)) continue;
    if (!href.startsWith('/')) continue;
    const clean = href.split('#')[0].split('?')[0];
    if (!clean || clean === '/') continue;
    checked++;
    if (!(await exists(clean))) {
      if (!broken.has(clean)) broken.set(clean, new Set());
      broken.get(clean).add(relative(DIST, page));
    }
  }
}

console.log(`check-links: ${pages.length} page(s), ${checked} internal link(s) checked`);

if (broken.size === 0) {
  console.log('\x1b[32mcheck-links: no broken internal links\x1b[0m');
} else {
  for (const [target, sources] of [...broken].sort()) {
    const list = [...sources];
    console.error(
      `\x1b[31mbroken\x1b[0m ${target}  <- ${list.slice(0, 3).join(', ')}${list.length > 3 ? ` (+${list.length - 3} more)` : ''}`,
    );
  }
  console.error(`\n\x1b[31m${broken.size} broken link target(s).\x1b[0m`);
  process.exit(1);
}
