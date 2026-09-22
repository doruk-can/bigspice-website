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
