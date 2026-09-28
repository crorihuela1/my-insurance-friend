import { readFileSync } from 'node:fs';
import type { APIRoute } from 'astro';
import { renderSocialCard, type SocialCard } from '../../lib/social-card';

/**
 * Instagram cards, generated into the site build at /social/<post-id>.png.
 *
 * They live on the site rather than in a separate bucket because the Instagram
 * Content Publishing API fetches media from a public URL - it will not accept
 * uploaded bytes. Building them here means the URL in social/queue.json is
 * already correct and needs no hosting step.
 *
 * Source of truth is social/queue.json, so run `npm run social` before the
 * site build. A missing or stale queue yields no images rather than an error,
 * since the site itself does not depend on them.
 */
interface QueuePost {
  id: string;
  platform: string;
  kind: SocialCard['kind'];
  lang: SocialCard['lang'];
  media_kind?: string;
  card?: { eyebrow?: string; headline: string; footnote?: string };
}

function loadQueue(): QueuePost[] {
  try {
    return (JSON.parse(readFileSync('social/queue.json', 'utf8')).posts ?? []) as QueuePost[];
  } catch {
    console.warn('[social cards] social/queue.json not found - run "npm run social" first.');
    return [];
  }
}

export function getStaticPaths() {
  return loadQueue()
    .filter((p) => p.card && p.media_kind === 'image')
    .map((p) => ({
      params: { id: p.id },
      props: {
        card: {
          id: p.id,
          kind: p.kind,
          lang: p.lang,
          headline: p.card!.headline,
          eyebrow: p.card!.eyebrow,
          footnote: p.card!.footnote,
        } satisfies SocialCard,
      },
    }));
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderSocialCard((props as { card: SocialCard }).card);
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
