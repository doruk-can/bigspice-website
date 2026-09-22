/**
 * Look at the real thing, in a real Chrome.
 *
 * There is no local server: every request is fulfilled straight from dist/ by
 * request interception, so the page loads over a real http:// origin with real
 * absolute paths and real fonts, without opening a port.
 *
 *   npm run shots              light
 *   npm run shots -- --dark    dark
 *   npm run shots -- --motion  with prefers-reduced-motion: reduce
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = 'dist';
const ORIGIN = 'http://bigspice.test';
const dark = process.argv.includes('--dark');
const reduced = process.argv.includes('--motion');
const tag = (dark ? 'dark' : 'light') + (reduced ? '-reduced' : '');
const WIDTHS = [1440, 1100, 820, 390, 360];

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.json': 'application/json',
};

function resolve(pathname) {
  let p = decodeURIComponent(pathname);
  const tries = [join(ROOT, p), join(ROOT, p, 'index.html'), join(ROOT, p + '.html')];
  if (p.endsWith('/')) tries.unshift(join(ROOT, p, 'index.html'));
  for (const f of tries) {
    try { if (existsSync(f) && statSync(f).isFile()) return f; } catch {}
  }
  return null;
}

mkdirSync('shots', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir: 'vendor/.chrome',
  args: ['--hide-scrollbars', '--force-device-scale-factor=1', '--disable-crashpad',
         '--no-first-run', '--no-default-browser-check', '--disable-gpu',
         '--disable-features=Crashpad'],
});

const report = [];
const consoleErrors = [];

for (const w of WIDTHS) {
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${w}px: ${m.text()}`); });
  page.on('pageerror', (e) => consoleErrors.push(`${w}px: ${e.message}`));

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = new URL(req.url());
    if (u.origin !== ORIGIN) return req.abort();
    const file = resolve(u.pathname);
    if (!file) return req.respond({ status: 404, body: 'not found' });
    req.respond({ status: 200, contentType: TYPES[extname(file)] ?? 'application/octet-stream', body: readFileSync(file) });
  });

  const features = [{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }];
  if (reduced) features.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  await page.emulateMediaFeatures(features);
  await page.setViewport({ width: w, height: w > 500 ? 900 : 780, deviceScaleFactor: 1 });
  await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 200));

  const m = await page.evaluate(() => {
    const d = document.documentElement;
    const over = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (getComputedStyle(el).position === 'fixed') continue;
      if (r.right > d.clientWidth + 1 || r.left < -1) {
        over.push(`${el.tagName.toLowerCase()}.${(el.getAttribute('class') || '—').split(' ')[0]} ${Math.round(r.left)}..${Math.round(r.right)}`);
      }
    }
    return { scrollW: d.scrollWidth, clientW: d.clientWidth, pageH: d.scrollHeight, overflow: [...new Set(over)].slice(0, 6) };
  });

  const shot = async (name, scrollTo) => {
    await page.evaluate(scrollTo);
    await new Promise((r) => setTimeout(r, 420));
    await page.screenshot({ path: `shots/${tag}-${w}-${name}.png` });
  };

  await shot('hero', () => window.scrollTo(0, 0));

  // mid-journey: the third throw in flight over the pinned pot
  await shot('journey', () => {
    const c = document.querySelector('[data-card="3"]').getBoundingClientRect();
    window.scrollTo(0, c.top + window.scrollY - window.innerHeight * 0.55);
  });

  const clash = await page.evaluate(() => {
    const pot = document.querySelector('[data-pot]').getBoundingClientRect();
    const hits = [];
    for (const c of document.querySelectorAll('[data-card]')) {
      const r = c.getBoundingClientRect();
      const ix = Math.min(pot.right, r.right) - Math.max(pot.left, r.left);
      const iy = Math.min(pot.bottom, r.bottom) - Math.max(pot.top, r.top);
      if (ix > 4 && iy > 4) hits.push(`card ${c.dataset.card} ${Math.round(ix)}x${Math.round(iy)}`);
    }
    return hits;
  });

  await shot('finale', () => {
    const s = document.querySelector('[data-scene]').getBoundingClientRect();
    window.scrollTo(0, s.top + window.scrollY - window.innerHeight * 0.30);
  });

  await shot('foot', () => window.scrollTo(0, document.documentElement.scrollHeight));

  report.push({ w, ...m, potOverCard: clash });
  await page.close();
}

// the legal pages, one width, just to see the type
const page = await browser.newPage();
await page.setRequestInterception(true);
page.on('request', (req) => {
  const u = new URL(req.url());
  if (u.origin !== ORIGIN) return req.abort();
  const file = resolve(u.pathname);
  if (!file) return req.respond({ status: 404, body: 'not found' });
  req.respond({ status: 200, contentType: TYPES[extname(file)] ?? 'application/octet-stream', body: readFileSync(file) });
});
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }]);
await page.setViewport({ width: 1100, height: 900 });
for (const p of ['privacy', 'terms']) {
  await page.goto(`${ORIGIN}/${p}`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `shots/${tag}-${p}.png` });
}
await page.close();

await browser.close();

console.log(`\n── ${tag} ──`);
for (const r of report) {
  const bad = r.scrollW > r.clientW + 1;
  console.log(
    `${String(r.w).padStart(5)}px  page ${String(r.pageH).padStart(5)}px  ` +
    `h-scroll ${bad ? `YES (${r.scrollW} > ${r.clientW})` : 'no '}  ` +
    `pot-over-card ${r.potOverCard.length ? r.potOverCard.join(', ') : 'none'}`
  );
  if (r.overflow.length) console.log('         out of frame:', r.overflow.join(' | '));
}
if (consoleErrors.length) { console.log('\nconsole errors:'); consoleErrors.forEach((e) => console.log('  ' + e)); }
else console.log('\nconsole: clean');
