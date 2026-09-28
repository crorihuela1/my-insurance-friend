import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { assertCompliantText, fonts } from './og';
import { site } from './data';
import type { Lang } from './types';

/**
 * Instagram feed cards, 1080x1350 (4:5 - the tallest ratio the feed allows, so
 * it occupies the most screen on a phone).
 *
 * Three layouts keyed to post kind, so a feed of these does not read as one
 * template repeated: `local` leads with the town, `faq` leads with the
 * question, `fact` leads with the citation. Same palette as the OG cards.
 */
const NAVY = '#172554';
const NAVY_SOFT = '#1e3a8a';
const GREEN = '#25d366';
const SLATE = '#c7d2e5';

export interface SocialCard {
  id: string;
  kind: 'local' | 'faq' | 'fact';
  lang: Lang;
  /** Big text - the hook. */
  headline: string;
  /** Small text above the headline: town, service, or "NJ". */
  eyebrow?: string;
  /** Small text below: citation, county, or supporting line. */
  footnote?: string;
}

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
  type,
  props: children === undefined ? { style } : { style, children },
});

/** No text measurement in Satori, so size comes from length. */
function headlineSize(text: string, kind: SocialCard['kind']): number {
  const base = kind === 'fact' ? 62 : 70;
  if (text.length <= 40) return base + 12;
  if (text.length <= 70) return base;
  if (text.length <= 110) return base - 12;
  if (text.length <= 160) return base - 22;
  return base - 30;
}

function card(c: SocialCard) {
  const cta = c.lang === 'es' ? 'Escríbenos por WhatsApp' : 'Message us on WhatsApp';
  // The fact layout is inverted - light card, dark text - so citation-led posts
  // stand out against the navy ones in a grid.
  const inverted = c.kind === 'fact';
  const bg = inverted ? '#f1f5f9' : NAVY;
  const fg = inverted ? NAVY : '#ffffff';
  const muted = inverted ? '#475569' : SLATE;

  return el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      width: '1080px',
      height: '1350px',
      backgroundColor: bg,
      // Satori rejects backgroundImage: 'none' outright, so the property has to
      // be omitted rather than set to none on the inverted layout.
      ...(inverted
        ? {}
        : { backgroundImage: `radial-gradient(circle at 80% 12%, ${NAVY_SOFT} 0%, ${NAVY} 60%)` }),
      padding: '84px 76px',
      fontFamily: 'Inter',
    },
    [
      // header
      el('div', { display: 'flex', alignItems: 'center' }, [
        el('div', {
          display: 'flex',
          width: '22px',
          height: '22px',
          borderRadius: '11px',
          backgroundColor: GREEN,
          marginRight: '18px',
        }),
        el(
          'div',
          { display: 'flex', fontSize: '34px', fontWeight: 700, color: fg },
          site.brand.name,
        ),
      ]),

      // body
      el(
        'div',
        { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' },
        [
          c.eyebrow
            ? el(
                'div',
                {
                  display: 'flex',
                  fontSize: '30px',
                  fontWeight: 700,
                  color: GREEN,
                  marginBottom: '26px',
                  letterSpacing: '1.5px',
                },
                c.eyebrow.toUpperCase(),
              )
            : el('div', { display: 'flex' }),
          el(
            'div',
            {
              display: 'flex',
              fontSize: `${headlineSize(c.headline, c.kind)}px`,
              fontWeight: 800,
              color: fg,
              lineHeight: 1.14,
              letterSpacing: '-1.5px',
            },
            c.headline,
          ),
          c.footnote
            ? el(
                'div',
                { display: 'flex', fontSize: '28px', color: muted, marginTop: '34px', lineHeight: 1.35 },
                c.footnote,
              )
            : el('div', { display: 'flex' }),
        ],
      ),

      // footer
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el(
          'div',
          {
            display: 'flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: GREEN,
            color: '#04331a',
            fontSize: '31px',
            fontWeight: 700,
            borderRadius: '16px',
            padding: '20px 34px',
          },
          cta,
        ),
        el(
          'div',
          { display: 'flex', fontSize: '23px', color: muted, marginTop: '26px', lineHeight: 1.4 },
          c.lang === 'es'
            ? 'No somos agencia con licencia. Te conectamos con agentes con licencia en NJ y NY.'
            : 'Not a licensed agency. We connect you with licensed agents in NJ and NY.',
        ),
      ]),
    ],
  );
}

export async function renderSocialCard(c: SocialCard): Promise<Buffer> {
  assertCompliantText([c.headline, c.eyebrow, c.footnote], c.id);
  const svg = await satori(card(c) as never, { width: 1080, height: 1350, fonts });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } }).render().asPng());
}
