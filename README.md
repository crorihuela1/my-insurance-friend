# my-insurance-friend

Bilingual (Spanish-first) programmatic local SEO site for an insurance referral
business serving NJ and NY. Astro static build, deployed to Cloudflare Pages.

**Phase 1 posture:** this business is *not* a licensed insurance agency. It
connects visitors with licensed NJ/NY agents for a flat referral fee. That
constraint is enforced in code, not just in copy — see [Compliance](#compliance).

---

## Status

| Piece | State |
|---|---|
| Data model (`towns.json`, `services.json`, `legal_facts.json`, `site.json`) | ✅ 12 towns, 4 services, 12 cited facts |
| Page template + components | ✅ one template, all shared components |
| Reference pages | ✅ Paterson × contractor and Paterson × auto, ES + EN |
| Lead capture (Pages Function → CRM) | ✅ built, needs `CRM_WEBHOOK_URL` |
| Compliance lint | ✅ gates `npm run build` |
| Similarity checker | ✅ `npm run similarity` |
| Content queue | ✅ `CONTENT_QUEUE.md`, 30 towns ranked |
| All 96 town × service pages | ✅ generated, 611–1086 words, no pair above 0.70 similarity |
| `scripts/generate-town-pages.mjs` | ✅ deterministic, refuses to overwrite reference pages |
| Home, hubs, legal, thank-you, about | ✅ 142 pages total, 0 broken internal links |
| Social content generator | ✅ 510 posts, all compliance-checked |
| Social API publisher | ⚠️ written, **unverified against live APIs** — see below |
| 4 pillar guides (ES + EN) | ✅ 8 guides, 1,500–2,500 words, length gated in the lint |
| Blog / noticias collection | ⏸ not started |

| OG image generation (Satori) | ⏸ not started |

`PLACEHOLDER` appears throughout `src/data/site.json` and `.env.example`.
Nothing ships until those are replaced.

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:4321/es/seguro-para-contratistas-en-paterson
npm run build          # astro build + compliance lint (lint failure = build failure)
npm run similarity     # near-duplicate report over built HTML
npm run queue          # regenerate CONTENT_QUEUE.md
```

---

## How the content model works

Three JSON files drive everything. **Page copy never hardcodes a fact or a
place name** — it reads from these, so one edit propagates to every page.

```
src/data/towns.json        one row per town       → 8 pages + 1 hub each
src/data/services.json     one row per service    → 2 pages per town per language
src/data/legal_facts.json  one row per claim      → cited inline via <Fact id="…" />
src/data/site.json         brand, contact, affiliates
```

### Add a town

1. Add one row to `src/data/towns.json`.
2. Required: `slug`, `name_en`, `name_es`, `state`, `county`, `county_es`,
   `zip_list`, `hispanic_pct`, `pop`, `lat`, `lng`, `nearby_slugs`,
   `local_notes_es`, `local_notes_en`.
3. **Write the four `angles`** — one per service, `es` and `en`. This is the step
   that decides whether the pages rank. An angle is a specific, checkable local
   fact (which county the crews commute to, what the housing stock is, what
   landlords require, which regulator applies). Generic angles produce
   near-duplicate pages, which is the failure mode this whole site is built to
   avoid. If you can't write four distinct angles, the town isn't ready.
4. `npm run build && npm run similarity`. (Once the page generator lands, run
   `npm run generate:towns` first — see below.)
5. Any pair above 0.70 similarity means the angles are too generic. Rewrite them.

`nearby_slugs` must reference towns that exist — `getTown()` throws at build time
if not, so a typo fails the build rather than shipping a broken link.

### Add a service

1. Add one row to `src/data/services.json` with `slug_en`, `slug_es`,
   `url_pattern_en`, `url_pattern_es` (use `{town}` as the token), names,
   `lines`, `audience_*`, `cost_range_*`, `legal_facts` (ids), and exactly
   **5 FAQ entries** in both languages.
2. Add an `angles` entry for this service to **every** town in `towns.json` —
   the build throws if one is missing, by design.
3. Spanish FAQ questions should use **"aseguranza"** (what this audience
   searches); body copy uses **"seguro"** (what reads as natural).

### Add or update a legal fact

1. Add a row to `src/data/legal_facts.json` with `citation`, `source_url`,
   `effective`, `verify_by`, and `text_es` / `text_en`.
2. Reference it in copy as `<Fact id="your_id" lang="es" />`.
3. Add the id to the relevant service's `legal_facts` array.

**Never write a statute number or a dollar figure directly into MDX.** When NJ
changes the auto minimums again, you want to edit one JSON row, not grep 96
files. `verify_by` tells you when to re-check a citation — the 2026 auto minimum
and the 2025 HIC changes both need review before the end of 2026.

---

## URLs

`src/lib/urls.ts` is the single source of truth. Routes, hreflang pairs,
internal links, breadcrumbs and the sitemap all derive from it, so they cannot
drift apart. Don't hand-write a path anywhere else.

```
/es/seguro-para-contratistas-en-paterson    /en/contractor-insurance-paterson
/es/seguro-de-auto-barato-en-paterson       /en/cheap-auto-insurance-paterson
/es/seguros-en-paterson  (town hub)         /en/insurance-paterson
```

Spanish is primary: `hreflang="x-default"` points at the `/es` URL on every page.

---

## Compliance

These are enforced mechanically, not by remembering to be careful.

**`<Disclaimer />` on every page.** Rendered by `BaseLayout` via the footer, in
the page language. States that we are not a licensed agency, that we connect you
with licensed agents, that we may receive a flat referral or advertising fee, and
that the fee does not depend on whether you buy.

**`npm run lint:compliance` gates the build.** It scans *built HTML* (so copy
that arrives through MDX, a component default or a data file is caught the same
as hardcoded text) and fails on:

- forbidden phrases — advice (`we recommend`, `te recomendamos`), directed
  purchases (`you should buy`), reader-specific premiums (`tu prima será`), and
  false licensure claims. The list lives in `scripts/compliance-rules.json`.
- any page missing the disclaimer
- any page with an affiliate link but no `<AffiliateDisclosure />`
- a TCPA consent checkbox that ships pre-checked
- titles over 60 chars or meta descriptions over 155

Copy may describe **what the law requires**, **what things typically cost in
published ranges**, and **how the process works**. It may not recommend coverage,
quote the reader a premium, or tell them what to buy. That line is the whole
Phase 1 legal posture.

**TCPA consent.** Unchecked by default, in the page language, names the company,
discloses automated calls/SMS, states consent is not a condition of purchase,
links to privacy and terms. The exact text and its version are submitted with
every lead and stored. **If you edit `consentText` in `src/lib/compliance.ts`,
bump `forms.consent_version` in `src/data/site.json`** — otherwise stored consent
records point at text that no longer exists, which defeats the purpose of storing
them.

**FTC affiliate disclosure** renders above the first affiliate link, in the page
language.

---

## Lead capture

`functions/api/lead.ts` is a Cloudflare Pages Function serving `POST /api/lead`,
same-origin with the site (no CORS, no browser-side API key).

It rejects honeypot hits and submissions without TCPA consent, hashes the IP
rather than storing it, normalizes the phone to E.164, and forwards a flat JSON
payload to the Go High Level webhook. The consent record is written to KV
*before* the CRM call, so it survives a CRM outage.

The form works without JavaScript: it natively POSTs and the Function redirects
to the thank-you page. JS only upgrades that to an inline result and adds the
client-side consent timestamp and UTM capture.

### Environment variables

Set in Cloudflare Pages → Settings → Environment variables:

| Name | Required | Notes |
|---|---|---|
| `CRM_WEBHOOK_URL` | yes | Go High Level inbound webhook. **Mark as Secret.** |
| `IP_HASH_SALT` | recommended | `openssl rand -hex 32`. Without it, hashes are unpeppered. |
| `LEADS_KV` | recommended | KV binding for durable consent records. See `wrangler.toml`. |

---

## Performance

Budget: LCP under 2s on 4G, since 80%+ of this traffic is on a phone.

Current town × service page: **~11 KB gzip HTML, ~5 KB gzip CSS, 48 KB font,
~1.1 KB inline JS, zero external JS files.**

- One variable font family, self-hosted, split into `latin` and `latin-ext`. The
  `latin` file covers every Spanish accent (U+0000–00FF), so it is the only file
  on the critical path; `latin-ext` downloads only if a page needs it.
- The only client JS is the lead form, and Astro inlines it. The WhatsApp CTA and
  sticky bar are plain anchors. The FAQ accordion is `<details>`.
- Don't add a second font family or a client-side framework without re-measuring.

---

## Deploy

Cloudflare Pages, connected to this repo:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 22 |

`functions/` deploys automatically as Pages Functions. Because `npm run build`
includes the compliance lint, **a compliance failure fails the deploy** — which
is the point.

Before the first production deploy:

1. Replace every `PLACEHOLDER` in `src/data/site.json` (brand, phone, WhatsApp
   number, address, domain, affiliate URLs).
2. Set `brand.domain` to the real domain — it feeds canonical URLs, hreflang and
   the sitemap.
3. Update the `Sitemap:` line in `public/robots.txt` to match.
4. Set `CRM_WEBHOOK_URL` and `IP_HASH_SALT`.
5. Create the KV namespace and uncomment the binding in `wrangler.toml`.
6. Have a licensed NJ agent or an insurance attorney read the disclaimer, the
   TCPA consent text, and the two reference pages before launch. The lint catches
   phrasing it knows about; it cannot catch a bad legal posture.

---

## Layout

```
src/data/          towns, services, legal facts, site config, expansion pipeline
src/lib/           data access, URL builders, i18n, SEO, schema.org, compliance copy
src/components/    Disclaimer, AffiliateDisclosure, LeadForm, WhatsAppCta,
                   StickyBar, Faq, Fact, Breadcrumbs, NearbyTowns, SiblingServices
src/layouts/       BaseLayout (head, hreflang, schema graph), TownServiceLayout
src/content/       MDX bodies — town-service/ and guides/
src/pages/         routes; [lang]/[slug].astro derives paths from the collection
functions/api/     Cloudflare Pages Function for lead capture
scripts/           compliance lint, similarity report, content queue, page generator
```

Hand-written reference MDX and generator output render through the same
`TownServiceLayout`, so a template change lands on all 96 pages at once.

---

## Why the page generator isn't written yet

`scripts/generate-town-pages.mjs` is deliberately deferred. Its section
templates should be derived *from* the approved reference pages — the four
Paterson MDX files define the section order, the depth, the voice, and how much
of each section comes from `angles` versus shared service copy. Writing the
generator before that copy is signed off means encoding a structure into 92
pages that may still change.

The content collection is already built to receive it: `src/content.config.ts`
tags every entry `source: reference | generated`, and the route derives paths
from the collection, so generated MDX drops in beside the hand-written files and
renders identically. Hand-tuning a page later is just editing its MDX.

When it lands it should, per the brief, flag any two pages above 0.70 shingle
similarity — `npm run similarity` already does exactly that check, so the
generator only needs to emit files and let the existing gate judge them.


---

## Social content

`npm run social` generates post copy from the same data that drives the site, so
a change in `legal_facts.json` updates the posts too. Output lands in `social/`:

- `queue.json` — the working queue. **Edit this**, not the CSV.
- `posts.csv` — the same rows, for review in a spreadsheet.

Currently 510 posts: 288 local (town × service, built on each town's angle), 120
FAQ, 102 legal-fact, across Facebook, Instagram and TikTok in both languages.

**Every caption runs through the same compliance rules as the site.** Social
posts are marketing by an unlicensed entity, so a caption that recommends
coverage or quotes a premium fails the run and nothing is written.

Regenerating preserves anything you filled in by hand — `media_url`, `status`
and `scheduled_for` all carry over, so rewriting copy never wipes your schedule.

### Publishing

```bash
npm run social:publish                    # dry run — shows what would post
npm run social:publish -- --live          # actually post
npm run social:publish -- --live --platform facebook --max 3
```

A post publishes when `status` is `approved`, `scheduled_for` has passed, and it
has a `media_url` if the platform needs one. Dry run is the default.

**The adapters have not been run against live credentials.** Publishing requires
Meta Business verification and TikTok's audit, which are not in place. They are
written to the documented API shapes, but treat the first live run as a test:
use `--max 1` and read the response.

### What each platform will and won't do

| Platform | Reality |
|---|---|
| **Facebook Page** | Works via API once you have a Page token. |
| **Facebook groups** | **Cannot be automated by anyone.** Meta removed third-party Groups publishing in 2020. Since groups are where this audience actually is, this channel stays manual — permanently. |
| **Instagram** | Needs a Business/Creator account linked to a Page, plus app review for `instagram_content_publish`. Media must sit at a public URL; the API fetches it. |
| **TikTok** | Needs app registration and audit. Un-audited apps can only push to drafts, not publish. |
| **WhatsApp Status** | **No API exists.** Disabled in `social.json`. The WhatsApp Business Platform sends templates to contacts who opted in — re-engagement of existing leads, not reach. Don't plan around it. |

The generator produces `media_brief` for every post that needs an image and a
`video_script` (hook / body / close) for every TikTok item. It does not produce
the media itself.

---

## Launch checklist

Everything below is on you, not the code. The build will pass without it, and
the site will be wrong.

1. **Replace every `PLACEHOLDER` in `src/data/site.json`** — brand name, legal
   name, phone, WhatsApp number, email, address, calendar URL.
2. **Set `brand.domain` to the real domain.** It feeds canonical URLs, hreflang,
   the sitemap and every social link. Getting this wrong after launch means
   re-indexing.
3. **Update the `Sitemap:` line in `public/robots.txt`** to match.
4. **Set `CRM_WEBHOOK_URL` and `IP_HASH_SALT`** in Cloudflare Pages. Without the
   webhook the form returns a 500 and leads are lost.
5. **Create the KV namespace** and uncomment the binding in `wrangler.toml`, so
   consent records survive a CRM outage.
6. **Replace the PLACEHOLDER affiliate URLs** in `site.json`, or leave them —
   nothing renders affiliate links yet, and the lint will require the disclosure
   the moment they do.
7. **Have a licensed NJ agent or an insurance attorney read** the disclaimer, the
   TCPA consent text, the privacy policy and two or three town pages. The lint
   catches phrasing it knows about. It cannot catch a bad legal posture.
8. **Re-verify the figures with a 2026 `verify_by` date** in
   `src/data/legal_facts.json` — notably the NJ auto minimum change and the 2025
   HIC requirements.
