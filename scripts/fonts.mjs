import { readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const get = (url, out) => execSync(`curl -sS -A "${UA}" -o "${out}" "${url}" --max-time 40`);
const css = (url, out) => { mkdirSync('scripts/.fonts-cache', { recursive: true }); get(url, out); return readFileSync(out, 'utf8'); };

/* Newsreader — the body face. Full latin + latin-ext (the ı, ş, ğ the app's own
   dish names need). Google serves ONE variable file per style+subset, so the
   three weights all point at the same download. */
const nr = css(
  'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600;6..72,800&display=swap',
  'scripts/.fonts-cache/newsreader.css'
);

/* Newsreader ITALIC, cut down like Caveat. The whole of the site's italic is
   seven short lines — the store note, the pricing line, the phone's "hands-off"
   caption and the legal datestamp — and the full face was 62 KB of latin plus
   38 KB of latin-ext for them. The set below is deliberately wider than those
   seven lines so an ordinary copy edit does not need a re-cut; `npm run verify`
   checks the shipped file against every string that actually lands in an
   italic slot, so a character that falls outside it fails the build rather
   than reaching a visitor as a tofu box. */
const ITALIC_TEXT =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
  ' ,.;:!?-–—’‘“”"\'()[]/&%+@*#' +
  'çÇğĞıİöÖşŞüÜâÂîÎûÛ';
/* Note the missing opsz axis. Asking for it returns a variable file that is
   48.9 KB even cut to this text, because the axis machinery survives the
   subset; without it Google serves 19.0 KB. The italic is only ever set at
   11.5-14px, which is one end of an optical-size range, so there is nothing
   for the axis to do here. */
const nri = css(
  'https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@1,400&text=' +
    encodeURIComponent(ITALIC_TEXT),
  'scripts/.fonts-cache/newsreader-italic.css'
);

/* Caveat — four margin notes and nothing else, so it is cut to the characters
   that actually appear. `text=` returns a single tiny face with no unicode-range.
   The Turkish set is in here too: a missing ğ or ş comes out as a tofu box. */
const CAVEAT_TEXT =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,.!?—→’' +
  'çÇğĞıİöÖşŞüÜâÂîÎûÛ';   // the notes are written in both languages
const cv = css(
  'https://fonts.googleapis.com/css2?family=Caveat:wght@600&text=' + encodeURIComponent(CAVEAT_TEXT),
  'scripts/.fonts-cache/caveat.css'
);

/* THE LOCK-UP, as a static 800 instance of the nine characters it uses.
   Nothing on the site loads this — it is 2 KB for `npm run assets`, which
   draws the share card's wordmark as outlines and cannot instance a variable
   axis (fontkit reads the file but getVariation() is broken on a subset). The
   card is the most-seen image of the site; it should be set in the real
   weight, not in the 400 outlines walked out with a stroke. */
const WORDMARK = 'B\u0131g Spice';
const wm = css(
  'https://fonts.googleapis.com/css2?family=Newsreader:wght@800&text=' + encodeURIComponent(WORDMARK),
  'scripts/.fonts-cache/wordmark.css'
);
{
  const url = /src:\s*url\((https:[^)]+)\)/.exec(wm)?.[1];
  if (!url) throw new Error('no wordmark face came back from Google Fonts');
  get(url, 'scripts/wordmark-800.woff2');
}

const faces = [];
const files = new Map(); // url -> filename

function collect(cssText, family, keepSubsets) {
  for (const b of cssText.split('@font-face').slice(1)) {
    const style = /font-style:\s*([a-z]+)/.exec(b)?.[1] ?? 'normal';
    const weight = /font-weight:\s*([0-9]+)/.exec(b)?.[1] ?? '400';
    const url = /src:\s*url\((https:[^)]+)\)/.exec(b)?.[1];
    const range = /unicode-range:\s*([^;]+)/.exec(b)?.[1]?.trim() ?? null;
    if (!url) continue;
    let subset = 'all';
    if (keepSubsets) {
      if (range && range.startsWith('U+0000-00FF')) subset = 'latin';
      else if (range && range.startsWith('U+0100-02BA')) subset = 'latin-ext';
      else continue;
      if (!keepSubsets.includes(subset)) continue;
    }
    if (!files.has(url)) files.set(url, `${family.toLowerCase()}-${style}-${subset}.woff2`);
    faces.push({ family, style, weight, file: files.get(url), range });
  }
}

collect(nr, 'Newsreader', ['latin', 'latin-ext']);
collect(nri, 'Newsreader', null);   /* the italic came back as one cut file */
collect(cv, 'Caveat', null);

for (const [url, file] of files) get(url, `public/fonts/${file}`);

const out = faces.map((f) =>
  `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};` +
  `font-display:swap;src:url('/fonts/${f.file}') format('woff2')` +
  (f.range ? `;unicode-range:${f.range}` : '') + '}'
);
writeFileSync('src/styles/fonts.css', out.join('\n') + '\n');

let total = 0;
for (const file of new Set(files.values())) total += statSync(`public/fonts/${file}`).size;
console.log(`faces ${faces.length} · files ${new Set(files.values()).size} · ${(total / 1024).toFixed(0)} KB`);
for (const file of new Set(files.values())) console.log(' ', file, (statSync(`public/fonts/${file}`).size / 1024).toFixed(1) + ' KB');
console.log(`  scripts/wordmark-800.woff2 ${(statSync('scripts/wordmark-800.woff2').size / 1024).toFixed(1)} KB (build only, never shipped)`);
