#!/usr/bin/env node
/**
 * Publishes queued posts to Facebook Pages, Instagram and TikTok.
 *
 * DRY RUN IS THE DEFAULT. Nothing is posted unless you pass --live.
 *
 *   npm run social:publish              # show what would post, touch nothing
 *   npm run social:publish -- --live    # actually post
 *   npm run social:publish -- --live --platform facebook --max 3
 *
 * A post is eligible when status is "approved", its scheduled_for is in the
 * past (or empty), and it has a media_url if its platform requires one.
 *
 * !! These adapters are written against the documented API shapes but have NOT
 * !! been run against live credentials, because publishing requires Meta
 * !! Business verification and TikTok's audit, which are not in place yet.
 * !! Run with a single post and --live first, and read the response.
 *
 * Required environment:
 *   META_ACCESS_TOKEN     long-lived Page token
 *   FB_PAGE_ID            numeric Page id
 *   IG_USER_ID            Instagram Business account id
 *   TIKTOK_ACCESS_TOKEN   OAuth token with video.publish (audited)
 */
import { readFile, writeFile } from 'node:fs/promises';

const QUEUE = 'social/queue.json';
const GRAPH = 'https://graph.facebook.com/v21.0';

const args = process.argv.slice(2);
const LIVE = args.includes('--live');
const flag = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const ONLY = flag('--platform', null);
const MAX = Number(flag('--max', Infinity));

const env = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing environment variable ${k}`);
  return v;
};

async function api(url, init, label) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    throw new Error(`${label} failed (HTTP ${res.status}): ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

const adapters = {
  /** Page feed post. Text + link, no media required. */
  async facebook(post) {
    const params = new URLSearchParams({
      message: post.caption,
      access_token: env('META_ACCESS_TOKEN'),
    });
    if (post.link) params.set('link', post.link);
    const out = await api(`${GRAPH}/${env('FB_PAGE_ID')}/feed`, { method: 'POST', body: params }, 'facebook');
    return out.id;
  },

  /**
   * Two-step: create a media container from a public image URL, then publish it.
   * The API fetches the image itself, so the URL must be reachable from Meta.
   */
  async instagram(post) {
    const token = env('META_ACCESS_TOKEN');
    const igUser = env('IG_USER_ID');

    const create = new URLSearchParams({
      image_url: post.media_url,
      caption: post.caption,
      access_token: token,
    });
    const container = await api(`${GRAPH}/${igUser}/media`, { method: 'POST', body: create }, 'instagram:create');

    const publish = new URLSearchParams({ creation_id: container.id, access_token: token });
    const out = await api(`${GRAPH}/${igUser}/media_publish`, { method: 'POST', body: publish }, 'instagram:publish');
    return out.id;
  },

  /**
   * Direct post via PULL_FROM_URL. Requires the audited video.publish scope;
   * without the audit this endpoint only lands the video in drafts.
   */
  async tiktok(post) {
    const out = await api(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env('TIKTOK_ACCESS_TOKEN')}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          post_info: {
            title: post.caption.slice(0, 2200),
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_comment: false,
          },
          source_info: { source: 'PULL_FROM_URL', video_url: post.media_url },
        }),
      },
      'tiktok:init',
    );
    return out?.data?.publish_id ?? 'unknown';
  },
};

// --- select ------------------------------------------------------------------
const queue = JSON.parse(await readFile(QUEUE, 'utf8'));
const now = Date.now();
const skipped = [];

const eligible = queue.posts.filter((p) => {
  if (ONLY && p.platform !== ONLY) return false;
  if (p.status !== 'approved') return false;
  if (p.scheduled_for && Date.parse(p.scheduled_for) > now) return false;
  if (p.media_required && !p.media_url) {
    skipped.push(`${p.id}: needs a ${p.media_kind} but media_url is empty`);
    return false;
  }
  return true;
}).slice(0, MAX);

console.log(`publish-social: ${eligible.length} post(s) eligible of ${queue.posts.length} in queue`);
for (const s of skipped.slice(0, 10)) console.warn(`\x1b[33mskip\x1b[0m  ${s}`);
if (skipped.length > 10) console.warn(`      (+${skipped.length - 10} more skipped for missing media)`);

if (!eligible.length) {
  console.log('\nNothing to publish. Set a post\'s status to "approved" in social/queue.json.');
  process.exit(0);
}

if (!LIVE) {
  console.log('\n\x1b[33mDRY RUN\x1b[0m - nothing will be posted. Re-run with --live to publish.\n');
  for (const p of eligible) {
    console.log(`  ${p.platform.padEnd(10)} ${p.id}`);
    console.log(`    ${p.caption.split('\n')[0].slice(0, 90)}…`);
    if (p.media_required) console.log(`    media: ${p.media_url}`);
  }
  process.exit(0);
}

// --- publish -----------------------------------------------------------------
let ok = 0;
let failed = 0;

for (const post of eligible) {
  try {
    const id = await adapters[post.platform](post);
    post.status = 'published';
    post.published_at = new Date().toISOString();
    post.remote_id = id;
    ok++;
    console.log(`\x1b[32mposted\x1b[0m ${post.platform} ${post.id} -> ${id}`);
  } catch (err) {
    post.status = 'failed';
    post.error = String(err.message ?? err);
    failed++;
    console.error(`\x1b[31mfailed\x1b[0m ${post.platform} ${post.id}: ${post.error}`);
  }
  // Write after every post so a crash never loses the record of what went out
  // and causes a duplicate on the next run.
  await writeFile(QUEUE, JSON.stringify(queue, null, 2));
}

console.log(`\npublish-social: ${ok} posted, ${failed} failed`);
if (failed) process.exitCode = 1;
