/**
 * Deterministic variant selection. Every choice is seeded off the page's own
 * identity, so regenerating produces byte-identical output and git stays quiet.
 * Never use Math.random() here.
 */
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Pick one variant from a pool, stably, for this page. */
export function pick(pool, seed) {
  return pool[hash(seed) % pool.length];
}

/** Pick `n` distinct items from a pool, stably, preserving pool order. */
export function pickMany(pool, n, seed) {
  if (n >= pool.length) return [...pool];
  const start = hash(seed) % pool.length;
  const out = [];
  for (let i = 0; i < pool.length && out.length < n; i++) {
    out.push(pool[(start + i) % pool.length]);
  }
  // Keep original relative order so lists don't read as shuffled.
  return pool.filter((x) => out.includes(x));
}

/** Join a list into natural prose: "a, b y c" / "a, b and c". */
export function list(items, lang) {
  const conj = lang === 'es' ? 'y' : 'and';
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} ${conj} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} ${conj} ${items.at(-1)}`;
}

/** Wrap prose at ~80 cols so generated MDX diffs stay readable. */
export function wrap(text, width = 80) {
  return text
    .split('\n\n')
    .map((para) => {
      if (para.startsWith('-') || para.startsWith('#') || para.startsWith('<') || /^\d\./.test(para)) {
        return para;
      }
      const words = para.replace(/\s+/g, ' ').trim().split(' ');
      const lines = [];
      let line = '';
      for (const w of words) {
        if ((line + ' ' + w).trim().length > width) {
          lines.push(line.trim());
          line = w;
        } else {
          line += ' ' + w;
        }
      }
      if (line.trim()) lines.push(line.trim());
      return lines.join('\n');
    })
    .join('\n\n');
}
