/**
 * Cloudflare Pages Function serving POST /api/lead.
 *
 * Runs on the same origin as the site, so the form needs no CORS and no API
 * key in the browser. Responsibilities:
 *   - reject bots (honeypot) and incomplete submissions
 *   - refuse anything without TCPA consent, and record exactly what was consented to
 *   - hash the IP rather than store it
 *   - forward a normalized payload to the CRM webhook (Go High Level)
 *
 * Required binding (Cloudflare dashboard > Settings > Environment variables):
 *   CRM_WEBHOOK_URL  - the Go High Level inbound webhook URL (mark as Secret)
 * Optional:
 *   IP_HASH_SALT     - random string; without it IP hashes are not peppered
 *   LEADS_KV         - KV namespace; when bound, every lead is also stored as a
 *                      durable consent record independent of the CRM
 */

interface Env {
  CRM_WEBHOOK_URL: string;
  IP_HASH_SALT?: string;
  LEADS_KV?: KVNamespace;
}

const REQUIRED = ['name', 'phone', 'city'] as const;

/** Truncate free text so a pasted essay can't bloat the CRM record. */
const clip = (v: FormDataEntryValue | null, max = 300): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Digits only, so "(973) 555-0100" and "9735550100" dedupe to one contact. */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits ? `+${digits}` : '';
}

function wantsJson(request: Request): boolean {
  return (request.headers.get('Accept') ?? '').includes('application/json');
}

function respond(request: Request, ok: boolean, status: number, redirectTo: string, message: string) {
  if (wantsJson(request)) {
    return new Response(JSON.stringify({ ok, message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // No-JS path: native form POST, so send the browser somewhere sensible.
  return Response.redirect(redirectTo, 303);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const origin = new URL(request.url).origin;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return respond(request, false, 400, `${origin}/es`, 'Malformed form submission.');
  }

  const redirectTo = new URL(clip(form.get('redirect_to'), 200) || '/es', origin).toString();

  // Honeypot: a real person never sees this field, so any value means a bot.
  // Return 200 so the bot believes it succeeded and doesn't retry.
  if (clip(form.get('website'))) {
    return respond(request, true, 200, redirectTo, 'ok');
  }

  for (const field of REQUIRED) {
    if (!clip(form.get(field))) {
      return respond(request, false, 422, redirectTo, `Missing required field: ${field}`);
    }
  }

  // TCPA: no consent, no lead. This is not a soft validation.
  if (clip(form.get('tcpa_consent')) !== 'yes') {
    return respond(request, false, 422, redirectTo, 'TCPA consent is required.');
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  const salt = env.IP_HASH_SALT ?? '';
  const ipHash = ip ? await sha256Hex(`${salt}:${ip}`) : '';

  // The form sends this when JS is available; fall back to server time otherwise.
  const consentTimestamp = clip(form.get('consent_timestamp'), 40) || new Date().toISOString();

  const cf = (request as Request & { cf?: IncomingRequestCfProperties }).cf;

  const lead = {
    // Contact
    name: clip(form.get('name'), 120),
    phone: normalizePhone(clip(form.get('phone'), 40)),
    phone_raw: clip(form.get('phone'), 40),
    city: clip(form.get('city'), 120),

    // Qualifying facts (no coverage preferences are collected, by design)
    business_type: clip(form.get('business_type'), 200),
    has_insurance: clip(form.get('has_insurance'), 10),
    needs_coi: clip(form.get('needs_coi'), 10),
    best_time: clip(form.get('best_time'), 20),
    preferred_language: clip(form.get('preferred_language'), 5) || 'es',

    // Attribution
    page_slug: clip(form.get('page_slug'), 200),
    page_language: clip(form.get('page_language'), 5),
    referrer: clip(form.get('referrer'), 500),
    utm_source: clip(form.get('utm_source'), 120),
    utm_medium: clip(form.get('utm_medium'), 120),
    utm_campaign: clip(form.get('utm_campaign'), 120),
    utm_term: clip(form.get('utm_term'), 120),
    utm_content: clip(form.get('utm_content'), 120),
    gclid: clip(form.get('gclid'), 200),

    // Consent record - what they agreed to, when, and in which language
    tcpa_consent: true,
    consent_timestamp: consentTimestamp,
    consent_version: clip(form.get('consent_version'), 40),
    consent_text: clip(form.get('consent_text'), 2000),
    consent_language: clip(form.get('page_language'), 5),

    // Provenance
    ip_hash: ipHash,
    user_agent: (request.headers.get('User-Agent') ?? '').slice(0, 400),
    client_tz: clip(form.get('client_tz'), 60),
    country: cf?.country ?? '',
    region: cf?.region ?? '',
    submitted_at: new Date().toISOString(),
  };

  // Durable consent record, independent of whether the CRM accepted it. TCPA
  // disputes are won with this, so it is written before the CRM call.
  if (env.LEADS_KV) {
    const key = `lead:${lead.submitted_at}:${lead.ip_hash.slice(0, 12) || 'anon'}`;
    context.waitUntil(
      env.LEADS_KV.put(key, JSON.stringify(lead), {
        // 5 years - TCPA claims have a 4-year federal statute of limitations.
        expirationTtl: 60 * 60 * 24 * 365 * 5,
      }),
    );
  }

  if (!env.CRM_WEBHOOK_URL) {
    console.error('CRM_WEBHOOK_URL is not configured; lead was not forwarded.');
    return respond(request, false, 500, redirectTo, 'Lead capture is not configured.');
  }

  try {
    const res = await fetch(env.CRM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    if (!res.ok) {
      console.error(`CRM webhook returned ${res.status}`);
      // The consent record is already stored, so report failure honestly
      // rather than pretending the lead landed.
      return respond(request, false, 502, redirectTo, 'Could not reach the CRM.');
    }
  } catch (err) {
    console.error('CRM webhook threw:', err);
    return respond(request, false, 502, redirectTo, 'Could not reach the CRM.');
  }

  return respond(request, true, 200, redirectTo, 'ok');
};

/** Anything other than POST on this path. */
export const onRequest: PagesFunction<Env> = async ({ request, next }) => {
  if (request.method === 'POST') return next();
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
};
