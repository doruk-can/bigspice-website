/**
 * A copy of dist/ that opens straight from the filesystem — no server.
 *
 * The real site is served from a web root, so every asset is an absolute path
 * ("/fonts/…"). Under file:// those resolve to the disk root and 404. This
 * rewrites them to paths relative to each page's own depth, and points the
 * page links at the actual index.html files.
 *
 * The scroll script survives because Astro inlines it — an inline module runs
 * under file://, where an external one would be blocked by CORS. The fonts do
 * NOT survive that way: a font fetch is always CORS-mode and file:// has a null
 * origin, so every browser would quietly fall back to Georgia. They are inlined
 * as data URIs instead, which is why these files are fat and the real build
 * is not.
 *
 *   npm run local     →  local-preview/index.html
 */
import { cpSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';

const SRC = 'dist';
const OUT = 'local-preview';

if (!existsSync(SRC)) {
  console.error('No dist/ — run `npm run build` first.');
  process.exit(1);
}
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
cpSync(SRC, OUT, { recursive: true });

/** [file on disk, how deep it sits] */
const PAGES = [
  [`${OUT}/index.html`, 0],
  [`${OUT}/404.html`, 0],
  [`${OUT}/privacy/index.html`, 1],
  [`${OUT}/terms/index.html`, 1],
  [`${OUT}/tr/index.html`, 1],
  [`${OUT}/tr/privacy/index.html`, 2],
  [`${OUT}/tr/terms/index.html`, 2],
];

/** Every route the site links to, longest first so /tr/privacy wins over /tr. */
const ROUTES = [
  ['/tr/privacy', 'tr/privacy/index.html'],
  ['/tr/terms', 'tr/terms/index.html'],
  ['/privacy', 'privacy/index.html'],
  ['/terms', 'terms/index.html'],
  ['/tr', 'tr/index.html'],
  ['/', 'index.html'],
];

/* woff2 → data URI, so the preview is set in the real face */
const FONTS = Object.fromEntries(
  readdirSync(`${SRC}/fonts`).map((f) => [f, readFileSync(`${SRC}/fonts/${f}`).toString('base64')])
);

for (const [file, depth] of PAGES) {
  if (!existsSync(file)) continue;
  const up = depth === 0 ? '' : '../'.repeat(depth);
  let h = readFileSync(file, 'utf8');

  // page links first, before the blanket asset rewrite
  for (const [route, file] of ROUTES) {
    h = h.replaceAll(`href="${route}"`, `href="${up}${file}"`);
    h = h.replaceAll(`href="${route}#`, `href="${up}${file}#`);
  }

  // every remaining absolute asset path, in attributes and in the inlined CSS
  h = h.replaceAll('href="/', `href="${up}`);
  h = h.replaceAll('src="/', `src="${up}`);
  h = h.replaceAll("url('/", `url('${up}`);
  h = h.replaceAll('url("/', `url("${up}`);
  h = h.replaceAll('url(/', `url(${up}`);

  /* the preload would fail CORS from file:// and log a warning for nothing */
  h = h.replace(/<link rel="preload"[^>]*as="font"[^>]*>/g, '');

  for (const [name, b64] of Object.entries(FONTS)) {
    h = h.replaceAll(`url(${up}fonts/${name})`, `url(data:font/woff2;base64,${b64})`);
    h = h.replaceAll(`url('${up}fonts/${name}')`, `url('data:font/woff2;base64,${b64}')`);
  }

  writeFileSync(file, h);
}

const left = PAGES.filter(([f]) => existsSync(f))
  .flatMap(([f]) => (readFileSync(f, 'utf8').match(/(?:href|src)="\/[^"]*"/g) || []));
const stillLinked = PAGES.filter(([f]) => existsSync(f))
  .flatMap(([f]) => (readFileSync(f, 'utf8').match(/url\([^)]*\.woff2\)/g) || []));

console.log(`local-preview/ ready — ${PAGES.filter(([f]) => existsSync(f)).length} pages rewritten`);
console.log(left.length ? `  WARNING, still absolute: ${[...new Set(left)].join(', ')}` : '  no absolute paths left');
console.log(stillLinked.length ? `  WARNING, font not inlined: ${[...new Set(stillLinked)].join(', ')}` : `  ${Object.keys(FONTS).length} fonts inlined as data URIs`);
console.log(`\n  open "${process.cwd()}/local-preview/index.html"`);
