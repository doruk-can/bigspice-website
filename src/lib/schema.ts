/**
 * THE JSON-LD, in one place.
 *
 * This is what Google reads to decide that "Big Spice" is a THING — an app,
 * made by a company, with a site — rather than two words on a page. It is the
 * difference between ranking for the brand and being outranked on it.
 *
 * Two rules, both absolute:
 *
 *   1. EVERY CLAIM IS TRUE. No ratings, no review counts, no download
 *      numbers, no awards, no screenshots of a screen that does not exist.
 *      Google demotes sites for structured data that does not match the page,
 *      and the claim would be a lie whether or not it were caught.
 *   2. NOTHING IS SAID TWICE. The visible strings come from copy.ts and the
 *      URLs from site.mjs, so a change in either follows through to here.
 *
 * Nodes carry @id so they can reference each other: one Organization, one
 * WebSite, one app, and a WebPage per legal document that says which site it
 * belongs to and how you get to it.
 */
import { SITE } from './site.mjs';
import { copy, href, LOCALES, type Locale } from './copy';

const ID = {
  org: `${SITE.url}/#org`,
  site: `${SITE.url}/#website`,
  app: `${SITE.url}/#app`,
};

const bcp = (lang: Locale) => (lang === 'tr' ? 'tr-TR' : 'en-US');

/** The company. `sameAs` appears only once there is somewhere to point at. */
function organization() {
  const stores = [SITE.appStore.href, SITE.playStore.href].filter(Boolean);
  return {
    '@type': 'Organization',
    '@id': ID.org,
    name: SITE.company,
    url: `${SITE.url}/`,
    email: SITE.email,
    logo: { '@type': 'ImageObject', url: `${SITE.url}/apple-touch-icon.png`, width: 180, height: 180 },
    ...(stores.length ? { sameAs: stores } : {}),
  };
}

function website() {
  return {
    '@type': 'WebSite',
    '@id': ID.site,
    url: `${SITE.url}/`,
    name: SITE.name,
    inLanguage: LOCALES.map(bcp),
    publisher: { '@id': ID.org },
  };
}

/**
 * The app itself. MobileApplication, because it is only a phone app — there
 * is no web or desktop version to claim.
 *
 * `offers` is written ONLY when a store listing exists. Describing a price for
 * something nobody can buy yet is the kind of structured data that is true on
 * the day it is written and false the moment anyone checks.
 */
function application(lang: Locale) {
  const t = copy[lang];
  const stores = [SITE.appStore.href, SITE.playStore.href].filter(Boolean) as string[];
  return {
    '@type': 'MobileApplication',
    '@id': ID.app,
    name: SITE.name,
    url: `${SITE.url}${href(lang, '/')}`,
    description: t.meta.description,
    applicationCategory: 'LifestyleApplication',
    applicationSubCategory: 'Cooking',
    /* repeated value, not a comma-joined string: as one string it named a
       single platform literally called "iOS, Android" */
    operatingSystem: ['iOS', 'Android'],
    inLanguage: LOCALES.map(bcp),
    image: `${SITE.url}${lang === 'en' ? '/og.png' : `/og-${lang}.png`}`,
    /* the four things it does, in the language of the page, from copy.ts */
    featureList: t.journey.features.map((f) => f.eyebrow),
    publisher: { '@id': ID.org },
    isPartOf: { '@id': ID.site },
    ...(stores.length
      ? {
          sameAs: stores,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            description: 'Free to download. Pro is a paid subscription.',
          },
        }
      : {}),
  };
}

/** The home page of either language. */
export function homeSchema(lang: Locale) {
  return {
    '@context': 'https://schema.org',
    '@graph': [organization(), website(), application(lang)],
  };
}

/**
 * A legal page. The breadcrumb is the part that earns something visible: it
 * is what puts "bigspice.app › Privacy" in the result instead of a raw URL.
 */
/**
 * The support page. FAQPage is included because every answer is genuinely on
 * the page as visible text, which is the only condition under which the markup
 * is honest. Be clear-eyed about the payoff, though: since August 2023 Google
 * has shown FAQ rich results only for government and health sites, so this
 * earns nothing in a Google result today. It stays because it is true, because
 * other engines and assistants still read it, and because the answers
 * themselves are what rank — not the markup around them.
 */
export function supportSchema(lang: Locale) {
  const t = copy[lang];
  const url = `${SITE.url}${href(lang, '/support')}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization(),
      website(),
      application(lang),
      {
        '@type': ['WebPage', 'FAQPage'],
        '@id': `${url}#page`,
        url,
        name: t.meta.supportTitle,
        description: t.meta.supportDescription,
        inLanguage: bcp(lang),
        isPartOf: { '@id': ID.site },
        about: { '@id': ID.app },
        publisher: { '@id': ID.org },
        mainEntity: t.support.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#crumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t.nav.home, item: `${SITE.url}${href(lang, '/')}` },
          { '@type': 'ListItem', position: 2, name: t.nav.support, item: url },
        ],
      },
    ],
  };
}

export function legalSchema(lang: Locale, path: '/privacy' | '/terms', title: string, description: string, updatedISO: string) {
  const t = copy[lang];
  const url = `${SITE.url}${href(lang, path)}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization(),
      website(),
      /* The app node rides along on every page, not just the home ones: it is
         the entity Google is being asked to recognise when someone types the
         brand, and `about` below would otherwise point at nothing. */
      application(lang),
      {
        '@type': 'WebPage',
        '@id': `${url}#page`,
        url,
        name: title,
        description,
        inLanguage: bcp(lang),
        isPartOf: { '@id': ID.site },
        about: { '@id': ID.app },
        publisher: { '@id': ID.org },
        dateModified: updatedISO,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#crumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t.nav.home, item: `${SITE.url}${href(lang, '/')}` },
          { '@type': 'ListItem', position: 2, name: path === '/privacy' ? t.nav.privacy : t.nav.terms, item: url },
        ],
      },
    ],
  };
}
