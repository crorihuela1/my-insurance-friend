import { readFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { site } from './data';
import type { Lang } from './types';

/**
 * Open Graph image generation. One 1200x630 PNG per page, rendered at build
 * time, so a link shared to Facebook, Instagram or WhatsApp shows the town and
 * service rather than a generic card.
 *
 * Satori supports TTF, OTF and WOFF - NOT WOFF2. The site's own font files are
 * woff2, so these load the woff build from @fontsource instead. Same typeface,
 * different container; they are not shipped to browsers.
 */
const FONT_DIR = 'node_modules/@fontsource/inter/files';
const fonts = [
  { name: 'Inter', data: readFileSync(`${FONT_DIR}/inter-latin-400-normal.woff`), weight: 400 as const, style: 'normal' as const },
  { name: 'Inter', data: readFileSync(`${FONT_DIR}/inter-latin-700-normal.woff`), weight: 700 as const, style: 'normal' as const },
  { name: 'Inter', data: readFileSync(`${FONT_DIR}/inter-latin-800-normal.woff`), weight: 800 as const, style: 'normal' as const },
];

/**
 * The compliance lint reads built HTML, so text baked into a PNG is invisible
 * to it. That gap is how a workers' comp guide card shipped with a "free quote
 * on WhatsApp" footer. Card text is therefore checked here, before rendering,
 * against the same rule set - a violation fails the build.
 */
const rules = JSON.parse(readFileSync('scripts/compliance-rules.json', 'utf8')) as {
  forbidden: Array<{ pattern: string; why: string }>;
};
const NEGATORS = /\b(no|not|never|nunca|tampoco|ni)\s+$/i;

function assertCompliant(input: OgInput): void {
  const text = [input.title, input.subtitle, input.cta].filter(Boolean).join(' · ').toLowerCase();
  for (const rule of rules.forbidden) {
    const needle = rule.pattern.toLowerCase();
    let from = 0;
    let i: number;
    while ((i = text.indexOf(needle, from)) !== -1) {
      from = i + needle.length;
      if (NEGATORS.test(text.slice(Math.max(0, i - 14), i))) continue;
      throw new Error(
        `OG image text breaks a compliance rule.\n  card: "${input.title}"\n  phrase: "${rule.pattern}"\n  why: ${rule.why}`,
      );
    }
  }
}

const NAVY = '#172554';
const NAVY_SOFT = '#1e3a8a';
const GREEN = '#25d366';
const SLATE = '#c7d2e5';

/** Satori has no text measurement, so size is chosen from title length. */
function titleSize(title: string): number {
  if (title.length <= 28) return 76;
  if (title.length <= 40) return 64;
  if (title.length <= 56) return 54;
  return 46;
}

export interface OgInput {
  title: string;
  /** County, ZIPs, or a guide's kicker. */
  subtitle?: string;
  /** "NJ" / "NY" / "GUÍA" badge. */
  badge?: string;
  /**
   * Footer call to action. Defaults to the WhatsApp quote line, which is right
   * for product pages. Guides override it: a card headed "How much does
   * workers' comp cost" above "free quote on WhatsApp" reads as an offer to
   * quote workers' comp, which we do not place.
   */
  cta?: string;
  lang: Lang;
}

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
  type,
  props: children === undefined ? { style } : { style, children },
});

function template({ title, subtitle, badge, cta, lang }: OgInput) {
  const ctaText = cta ?? (lang === 'es' ? 'Cotización gratis por WhatsApp' : 'Free quote on WhatsApp');

  return el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      width: '1200px',
      height: '630px',
      backgroundColor: NAVY,
      // A soft radial keeps a flat navy card from looking like a 404 page.
      backgroundImage: `radial-gradient(circle at 78% 18%, ${NAVY_SOFT} 0%, ${NAVY} 58%)`,
      padding: '64px 72px',
      fontFamily: 'Inter',
    },
    [
      // --- header: brand + badge
      el(
        'div',
        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
        [
          el('div', { display: 'flex', alignItems: 'center' }, [
            el('div', {
              display: 'flex',
              width: '18px',
              height: '18px',
              borderRadius: '9px',
              backgroundColor: GREEN,
              marginRight: '16px',
            }),
            el(
              'div',
              { fontSize: '30px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.5px' },
              site.brand.name,
            ),
          ]),
          badge
            ? el(
                'div',
                {
                  display: 'flex',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: NAVY,
                  backgroundColor: '#ffffff',
                  borderRadius: '999px',
                  padding: '8px 22px',
                  letterSpacing: '1px',
                },
                badge,
              )
            : el('div', { display: 'flex' }),
        ],
      ),

      // --- title block, vertically centered
      el(
        'div',
        { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' },
        [
          el(
            'div',
            {
              display: 'flex',
              fontSize: `${titleSize(title)}px`,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.12,
              letterSpacing: '-1.5px',
            },
            title,
          ),
          subtitle
            ? el(
                'div',
                { display: 'flex', fontSize: '28px', color: SLATE, marginTop: '22px', lineHeight: 1.3 },
                subtitle,
              )
            : el('div', { display: 'flex' }),
        ],
      ),

      // --- footer: CTA + phone
      el('div', { display: 'flex', alignItems: 'center', width: '100%' }, [
        el(
          'div',
          {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: GREEN,
            color: '#04331a',
            fontSize: '27px',
            fontWeight: 700,
            borderRadius: '14px',
            padding: '16px 28px',
          },
          ctaText,
        ),
        el(
          'div',
          { display: 'flex', fontSize: '27px', fontWeight: 700, color: '#ffffff', marginLeft: '28px' },
          site.contact.phone_display,
        ),
      ]),
    ],
  );
}

export async function renderOg(input: OgInput): Promise<Buffer> {
  assertCompliant(input);
  const svg = await satori(template(input) as never, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return Buffer.from(png);
}
