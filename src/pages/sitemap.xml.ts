import type { APIRoute } from 'astro';
import { SITE } from '../lib/site.mjs';
import { LOCALES, href } from '../lib/copy';
import { lastUpdatedISO } from '../lib/legal';
import * as privacyDoc from '../../legal/privacy-policy.md';
import * as termsDoc from '../../legal/terms-of-use.md';

/* Each legal page carries its own date on its face, and the two documents are
   edited separately — so each gets its own <lastmod>, read from the document
   rather than from a number kept somewhere else that can fall behind. */
const UPDATED: Record<string, string> = {
  '/privacy': lastUpdatedISO(privacyDoc.rawContent()),
  '/terms': lastUpdatedISO(termsDoc.rawContent()),
};

/** Four pages in two languages, each listing the other as an alternate. */
const PATHS = ['/', '/support', '/privacy', '/terms'];

export const GET: APIRoute = () => {
  const urls = LOCALES.flatMap((lang) =>
    PATHS.map((p) => {
      const loc = `${SITE.url}${href(lang, p)}`;
      const alts = [
        ...LOCALES.map(
          (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE.url}${href(l, p)}"/>`
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE.url}${href('en', p)}"/>`,
      ].join('\n');
      /* Only the legal pages have a date that means anything — they carry one
         on their face. Claiming a lastmod for the home page or for /support
         would be a number invented to look fresh, which is what crawlers
         learn to ignore. */
      const mod = UPDATED[p] ? `    <lastmod>${UPDATED[p]}</lastmod>\n` : '';
      return `  <url>\n    <loc>${loc}</loc>\n${mod}${alts}\n  </url>`;
    })
  );

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
    `xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls.join('\n') +
    `\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
