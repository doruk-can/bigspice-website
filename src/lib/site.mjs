/**
 * THE ONE CONFIG FILE.
 *
 * Everything that changes when the app ships — the store links, the address
 * people write to, the domain — lives here and nowhere else. Change a value
 * here and the nav, the hero, the footer, the sitemap, the JSON-LD and both
 * legal pages follow.
 */
export const SITE = {
  name: 'Big Spice',
  company: 'Ryon Labs LLC',

  /** Used for canonical URLs, the sitemap and og:url. No trailing slash. */
  url: 'https://bigspice.app',

  /**
   * The one mailbox. It MUST be the address the legal documents name — they
   * send every data request, rights request and rights-holder notice to it,
   * and the statutory clocks (30 days in Turkey, one month under the GDPR,
   * 45 days in California) start when mail arrives there. `npm run verify`
   * fails if this and the documents ever disagree.
   */
  email: 'info@ryonlabs.com',

  /**
   * PLACEHOLDERS — neither listing exists yet.
   * `href: null` renders the badge as a disabled, non-clickable placeholder
   * with a "coming soon" note, so the page never ships a dead link.
   */
  appStore: {
    href: null, // e.g. 'https://apps.apple.com/app/big-spice/id0000000000'
  },
  playStore: {
    href: null, // e.g. 'https://play.google.com/store/apps/details?id=com.ryonlabs.bigspice'
  },

  /* The date people read, and the same date a machine reads. Keep them in
     step: the second one goes into the legal pages' JSON-LD and the sitemap. */
  /**
   * THE LEGAL DOCUMENTS' UNKNOWNS.
   *
   * These were the placeholders legal/README.md section 2 left open, and the
   * answered documents now carry them in full. They are recorded here so the
   * site has them too, and so `fill()` in src/lib/legal.ts stays a working
   * safety net: if an edit ever reintroduces a bracketed token, it is filled
   * from these rather than shipped. `npm run verify` fails on either — a null
   * here, or a bracket on a built page.
   */
  legal: {
    registeredAddress: '30 N Gould St Ste N, Sheridan, WY 82801, USA',
    governingLaw: 'the laws of the State of Wyoming',
    effectiveDate: 'September 23, 2026',
  },

  /**
   * Send a Turkish-speaking visitor to /tr the first time they land on the
   * home page. Set false and the site is English-first for everyone, with the
   * globe in the header as the only way across.
   *
   * We cannot see anyone's COUNTRY: this site is static files on a CDN, and
   * nothing in it runs on a server that could read the request's origin. What
   * the browser does tell us is the language list the person has set on their
   * own device, which is a better signal anyway — a Turk in Berlin wants
   * Turkish, and a visitor in Istanbul reading English wants English.
   */
  autoLanguage: true,

  /* The date people read is written into the four markdown files themselves;
     this is the same date for machines, and it goes into <lastmod> and into
     dateModified. `npm run verify` fails if the two ever disagree. */
  legalUpdatedISO: '2026-09-21',
};

/* The nav's own labels live in copy.ts with every other string — a list of
   them here would be a second source for the same three words. */
