/**
 * The two public legal documents.
 *
 * The source of truth is `legal/` at the project root — the folder the legal
 * drafting handed over, with its own README (which must NEVER be published).
 * Nothing here copies or rewrites that text: the pages import the markdown
 * directly and this module only fills the bracketed placeholders the handoff
 * left, from the one config file.
 *
 * `legal/README.md` §1.2 item 11: "No placeholders in production. The build
 * should fail if any [BRACKETED PLACEHOLDER] from section 2 is still in the
 * text." `npm run verify` does exactly that, and names the ones still missing.
 */
import { SITE } from './site.mjs';

/** What each placeholder in the source becomes. `null` = nobody knows yet. */
export const FILLS: Record<string, string | null> = {
  '[LEGAL ENTITY NAME]': SITE.company,
  '[CONTACT EMAIL]': SITE.email,
  '[REGISTERED ADDRESS]': SITE.legal.registeredAddress,
  '[GOVERNING LAW]': SITE.legal.governingLaw,
  '[EFFECTIVE DATE]': SITE.legal.effectiveDate,
};

const MONTHS = ['January','February','March','April','May','June','July','August',
                'September','October','November','December'];

/**
 * The date a document says it was last updated, read out of the document.
 *
 * There used to be a second copy of this in site.mjs, and the two drifted the
 * first time one document was edited without the other — which is the whole
 * problem with writing a fact down twice. Now <lastmod> and every page's
 * dateModified come from the only place that can be right: the line the
 * reader sees at the top of the page.
 */
export function lastUpdatedISO(markdown: string): string {
  const m = /Last updated:\s*([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/.exec(markdown);
  if (!m) throw new Error('no "Last updated: Month D, YYYY" line in the document');
  const month = MONTHS.indexOf(m[1]);
  if (month < 0) throw new Error(`unknown month "${m[1]}"`);
  return `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

/** The placeholders that are still unfilled, in the order they must be fixed. */
export function unfilled(): string[] {
  return Object.entries(FILLS).filter(([, v]) => !v).map(([k]) => k);
}

/**
 * Fill what is known and leave the rest standing, loudly. A page that shipped
 * with an invisible gap where its registered address should be would be worse
 * than one that shows the bracket — and the bracket is what verify greps for.
 */
export function fill(html: string): string {
  let out = html;
  for (const [token, value] of Object.entries(FILLS)) {
    if (!value) continue;
    out = out.split(token).join(value);
  }
  return out;
}
