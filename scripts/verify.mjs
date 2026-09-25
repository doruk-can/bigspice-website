/**
 * What can be checked without a browser: contrast maths against the real
 * tokens, the arithmetic of every fixed width at every breakpoint, the shape
 * of the built HTML, and what each page actually weighs.
 *
 *   npm run verify
 */
import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { SITE } from '../src/lib/site.mjs';

let fails = 0;
const bad = (m) => { fails++; console.log('  FAIL  ' + m); };
const ok = (m) => console.log('  ok    ' + m);

/* ── 1 · contrast ──────────────────────────────────────────────────────── */
const hex = (h) => {
  h = h.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const over = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const L = {
  paper: '#F6F1E7', card: '#FBF8F1', ink: '#1F1B17', inkSoft: '#6B6158',
  red: '#C2422C', ochre: '#E9C46A',
};
const D = {
  paper: '#1C1916', card: '#221E1A', ink: '#EDE6D9', inkSoft: '#A89E92',
  red: '#E0684F', ochre: '#D9B35A',
};

console.log('\n── contrast (WCAG AA: 4.5 for body, 3.0 at 24px+) ──');
const pairs = [
  ['light body on paper', L.inkSoft, L.paper, 4.5],
  ['light body on card', L.inkSoft, L.card, 4.5],
  ['light ink on paper', L.ink, L.paper, 4.5],
  ['light red link on paper', L.red, L.paper, 4.5],
  ['light red note on card', L.red, L.card, 4.5],
  ['dark body on paper', D.inkSoft, D.paper, 4.5],
  ['dark body on card', D.inkSoft, D.card, 4.5],
  ['dark ink on paper', D.ink, D.paper, 4.5],
  ['dark red link on paper', D.red, D.paper, 4.5],
  ['dark red note on card', D.red, D.card, 4.5],
];
for (const [name, fg, bg, min] of pairs) {
  const r = ratio(hex(fg), hex(bg));
  (r >= min ? ok : bad)(`${name.padEnd(26)} ${r.toFixed(2)}:1  (needs ${min})`);
}
/* the ochre band is a fixed light colour in both themes */
for (const [name, a, min] of [['ochre kicker (ink 1.0)', 1, 4.5], ['ochre lede (ink .9)', 0.9, 4.5], ['ochre note (ink .88)', 0.88, 4.5]]) {
  const r = ratio(over(hex('#1F1B17'), a, hex('#E9C46A')), hex('#E9C46A'));
  (r >= min ? ok : bad)(`${name.padEnd(26)} ${r.toFixed(2)}:1  (needs ${min})`);
}

/* ── 2 · layout arithmetic ─────────────────────────────────────────────── */
console.log('\n── widths: does anything exceed its container? ──');
const gutter = (vw) => Math.min(48, Math.max(20, vw * 0.042));
const inner = (vw) => Math.min(1140, vw) - 2 * gutter(vw);
const cardW = (vw) => (vw <= 1099 ? Math.min(inner(vw), 520) : 360);
const potW = (vw) => (vw <= 420 ? 84 : vw <= 760 ? 96 : vw <= 1099 ? 120 : 156);
const pathW = (vw) => (vw <= 760 ? 132 : vw <= 1099 ? 150 : 300);
const amp = (vw) => (vw <= 1099 ? 34 : 60);
const reach = (vw) => Math.min(320, vw / 2 - 46);
const tossW = (vw) => (vw <= 420 ? 34 : vw <= 760 ? 40 : 54);

for (const vw of [1440, 1100, 820, 390, 360]) {
  const box = inner(vw);
  const centre = vw / 2;
  const potEdge = centre + amp(vw) + potW(vw) / 2;
  const tossEdge = centre + reach(vw) + tossW(vw) / 2;
  const pathEdge = centre + pathW(vw) / 2;
  const rows = [
    ['card', cardW(vw), box],
    ['pot at full drift', potEdge, vw],
    ['thrown ingredient', tossEdge, vw],
    ['dotted path', pathEdge, vw],
  ];
  /* above 1100 the cards sit beside the lane, so the pot must never reach one */
  if (vw >= 1100) {
    const cardRight = gutter(vw) + (vw - 2 * gutter(vw) > 1140 ? (vw - 1140) / 2 : 0) + cardW(vw);
    const potLeft = centre - amp(vw) - potW(vw) / 2;
    rows.push(['pot clear of card', cardRight, potLeft]);
  }
  const worst = rows.filter(([, v, lim]) => v > lim + 0.5);
  if (worst.length) bad(`${vw}px → ` + worst.map(([n, v, lim]) => `${n} ${v.toFixed(0)} > ${lim.toFixed(0)}`).join(', '));
  else ok(`${String(vw).padStart(4)}px  card ${cardW(vw).toFixed(0)} ≤ ${box.toFixed(0)} · pot reaches ${potEdge.toFixed(0)} · throw reaches ${tossEdge.toFixed(0)} · all inside ${vw}`);
}

/* the pot band on phones must clear the sticky nav */
const NAV = 64, POT_TOP = NAV + 52;
const potH = (vw) => potW(vw) * (132 / 160);
for (const vw of [390, 360]) {
  const top = POT_TOP - potH(vw) / 2;
  (top >= NAV + 4 ? ok : bad)(`${vw}px  pot band starts at ${top.toFixed(0)}px, nav ends at ${NAV}px`);
}

/* ── 2b · does the nav bar actually fit? ───────────────────────────────── */
/* The header is the one row on the site with no room to wrap: a fixed 64px
   band holding the lock-up, three page links and the language switch. Turkish
   labels are ~25% wider than the English ones, so the bar that fits at 360px
   in English can overflow in Turkish and nothing on the page would say so.
   This measures it from the real woff2 files and the real strings in copy.ts. */
console.log('\n── the nav bar at phone widths (measured from the shipped font) ──');
const fk = await import('fontkit');
const { copy: COPY } = await import('../src/lib/copy.ts');
const faces = [
  fk.openSync('public/fonts/newsreader-normal-latin.woff2'),
  fk.openSync('public/fonts/newsreader-normal-latin-ext.woff2'),
];
/** the lock-up at `px`, from the real 800 instance */
const WM = fk.openSync('scripts/wordmark-800.woff2');
const wordmarkW = (px, ls) =>
  [...'B\u0131g\u00A0Spice'].reduce((w, ch) => {
    const cp = ch.codePointAt(0);
    const g = WM.hasGlyphForCodePoint(cp) ? WM.layout(ch).advanceWidth : WM.layout(' ').advanceWidth;
    return w + (g / WM.unitsPerEm) * px + ls * px;
  }, 0);

/** advance width of `text` at `px`, with CSS letter-spacing in em */
const textW = (text, px, ls = 0) => {
  let w = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const f = faces.find((x) => x.hasGlyphForCodePoint(cp)) || faces[0];
    w += (f.layout(ch).advanceWidth / f.unitsPerEm) * px + ls * px;
  }
  return w;
};

const navFit = (vw, lang) => {
  const small = vw <= 420;                       /* the @media (max-width: 420px) block */
  const t = COPY[lang];
  const ulGap = small ? 8 : Math.min(28, Math.max(14, vw * 0.026));
  /* The toque hangs off a zero-width inline box, so only the letters take
     advance. The lock-up is weight 800; getVariation() is broken on the
     shipped subset, so this measures the static 800 instance that
     `npm run fonts` saves for the share card — no allowance, no guess. */
  /* the brand is a badge now: the wordmark plus its own horizontal padding */
  const brand = wordmarkW(small ? 16 : 20, -0.024) + (small ? 18 : 26);
  const links =
    [t.nav.home, t.nav.privacy, t.nav.terms].reduce((n, s2) => n + textW(s2, small ? 14 : 15) + 4, 0) +
    ulGap * 2;
  /* the header switch is a globe and nothing else: hairline, padding, icon */
  const sw = 1 + (small ? 10 : 16) + (small ? 16 : 17) + (small ? 4 : 6);
  const used = brand + (small ? 10 : 24) + links + (small ? 8 : 16) + sw;
  return { used, box: inner(vw), brand, links, sw };
};

for (const vw of [1440, 820, 480, 420, 390, 375, 360]) {
  for (const lang of ['en', 'tr']) {
    const { used, box, brand, links, sw } = navFit(vw, lang);
    const slack = box - used;
    /* 8px of daylight, not zero: a hinted font rounds against you */
    (slack >= 8 ? ok : bad)(
      `${String(vw).padStart(4)}px ${lang}  lock-up ${brand.toFixed(0)} + pages ${links.toFixed(0)} + switch ${sw.toFixed(0)}` +
      ` = ${used.toFixed(0)} in ${box.toFixed(0)}  (${slack >= 0 ? '' : 'OVER by '}${Math.abs(slack).toFixed(0)}px ${slack >= 0 ? 'to spare' : ''})`
    );
  }
}

/* ── 2c · does any wash sit outside its own ink line? ──────────────────── */
/* The drawing language is an ink contour with a watercolour wash under it, and
   several parts offset the wash a unit or two on purpose. What is NOT the
   language is a wash that is a different SIZE from its contour: the head was
   drawn 56x52 against a line of 54x50 and spilled 4 units of skin past the
   outline, which reads as a misprint. Fills and lines are paired greedily by
   nearest centre so the two hand poses, and the plate's own inner ring, are
   not mistaken for each other. */
console.log('\n── ink line vs watercolour wash ──');
{
  const ART = [
    'src/components/chef/Body.astro', 'src/components/chef/Face.astro',
    'src/components/chef/Arm.astro', 'src/components/chef/Lid.astro',
    'src/components/Pot.astro', 'src/components/Sprites.astro',
  ];
  const attrs = (t) => Object.fromEntries([...t.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  const shift = (a) => {
    const m = /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/.exec(a.transform || '');
    return m ? [parseFloat(m[1]), parseFloat(m[2])] : [0, 0];
  };
  const spills = [];
  for (const file of ART) {
    const src = readFileSync(file, 'utf8');
    for (const [tag, rx, ry] of [['ellipse', 'rx', 'ry'], ['circle', 'r', 'r']]) {
      const shapes = [...src.matchAll(new RegExp(`<${tag}\\b([^>]*)/?>`, 'g'))].map((m) => attrs(m[1]));
      const box = (a) => {
        const [dx, dy] = shift(a);
        return { x: +a.cx + dx, y: +a.cy + dy, rx: +(a[rx] ?? 0), ry: +(a[ry] ?? 0) };
      };
      const fills = shapes.filter((a) => a.fill && a.fill !== 'none' && !a.stroke).map(box);
      const lines = shapes.filter((a) => a.stroke && (a.fill ?? 'none') === 'none').map(box);
      const taken = new Set();
      for (const f of fills) {
        let best = -1, bestD = 6;                       /* same shape, not a neighbour */
        lines.forEach((l, i) => {
          const d = Math.hypot(f.x - l.x, f.y - l.y);
          if (!taken.has(i) && d < bestD) { bestD = d; best = i; }
        });
        if (best < 0) continue;
        taken.add(best);
        const l = lines[best];
        const out = Math.max(
          f.x + f.rx - (l.x + l.rx), l.x - l.rx - (f.x - f.rx),
          f.y + f.ry - (l.y + l.ry), l.y - l.ry - (f.y - f.ry),
        );
        if (out > 2.2) spills.push(`${file.split('/').pop()} ${tag} at (${l.x.toFixed(0)},${l.y.toFixed(0)}) spills ${out.toFixed(1)}u`);
      }
    }
  }
  if (spills.length) bad(spills.join(' · '));
  else ok('every wash sits inside its own contour (offsets under 2.2u are the house style)');
}

/* ── 3 · the built HTML ────────────────────────────────────────────────── */
console.log('\n── built pages ──');
/* build.format is 'file', so every route is one .html answered directly at
   its own path — no /privacy/ and no 301 from /privacy to it. */
const pages = {
  '/': 'dist/index.html',
  '/support': 'dist/support.html',
  '/privacy': 'dist/privacy.html',
  '/terms': 'dist/terms.html',
  '/tr': 'dist/tr.html',
  '/tr/support': 'dist/tr/support.html',
  '/tr/privacy': 'dist/tr/privacy.html',
  '/tr/terms': 'dist/tr/terms.html',
  '/404': 'dist/404.html',
};
for (const [route, file] of Object.entries(pages)) {
  const h = readFileSync(file, 'utf8');
  const need = [
    ['<title>', /<title>[^<]{10,}<\/title>/],
    ['meta description', /<meta name="description" content="[^"]{40,}"/],
    ['canonical', /<link rel="canonical"/],
    ['og:image', /<meta property="og:image" content="[^"]+og(-tr)?\.png"/],
    ['twitter card', /<meta name="twitter:card"/],
    ['one h1', null],
    ['lang', /<html lang="(en|tr)"/],
    ['hreflang en', /hreflang="en"/],
    ['hreflang tr', /hreflang="tr"/],
    ['x-default', /hreflang="x-default"/],
    ['skip link', /class="skip"/],
  ];
  const missing = [];
  for (const [name, re] of need) {
    if (name === 'one h1') { if ((h.match(/<h1[\s>]/g) || []).length !== 1) missing.push('exactly one h1'); continue; }
    if (!re.test(h)) missing.push(name);
  }
  /* Google renders roughly 600px of title and 920px of description; in
     characters that is about 60 and 155. Past that it truncates mid-word and
     the tail is wasted. Both were over before anyone measured them. */
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const dec = (t) => t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  if ([...dec(title)].length > 60) missing.push(`title ${[...dec(title)].length} chars (max 60)`);
  if ([...dec(desc)].length > 158) missing.push(`description ${[...dec(desc)].length} chars (max 158)`);

  const imgNoAlt = (h.match(/<img(?![^>]*\balt=)[^>]*>/g) || []).length;
  if (imgNoAlt) missing.push(`${imgNoAlt} img without alt`);
  const emptyHref = (h.match(/href="#"/g) || []).length;
  if (emptyHref) missing.push(`${emptyHref} dead href="#"`);
  /* placeholders have their own section below, which names them */
  /* the share card is per-language; a /tr page carrying the English card is
     the kind of thing nobody notices until it is on someone's timeline */
  const wantCard = route.startsWith('/tr') ? 'og-tr.png' : 'og.png';
  if (!h.includes(`content="${new URL(wantCard, 'https://bigspice.app/').href}"`)) missing.push(`wrong og card (wants ${wantCard})`);
  if (missing.length) bad(`${route}: ${missing.join(', ')}`);
  else ok(`${route.padEnd(12)} title ${String([...dec(title)].length).padStart(2)}c · desc ${String([...dec(desc)].length).padStart(3)}c · head complete, one h1, alts, no dead links`);
}

/* ── 3b · the page draws the pot twice ─────────────────────────────────── */
/* The journey pot fills as you scroll; the one in his hands is the finished
   one. The script only ever drives the first four `.rest` groups, so if the
   stylesheet stops making the finale's four visible, the lid comes off an
   empty pot at the climax of the whole page and nothing here would say so. */
{
  const h = readFileSync('dist/index.html', 'utf8');
  const markup = h.replace(/<style>[\s\S]*?<\/style>/g, '');
  const style = h.slice(h.indexOf('<style>'));
  const lane = markup.slice(markup.indexOf('data-potlane'), markup.indexOf('data-scene'));
  const scene = markup.slice(markup.indexOf('data-scene'));
  const count = (s2) => (s2.match(/class="rest"/g) || []).length;
  const driven = (markup.match(/data-toss=/g) || []).length;
  const problems = [];
  if (count(lane) !== driven) problems.push(`${count(lane)} rests in the lane pot but ${driven} throws drive them`);
  if (count(scene) && !/\.scene \.rest\{[^}]*opacity:\s*1/.test(style))
    problems.push(`${count(scene)} rests in the pot he holds and nothing makes them visible`);
  if (problems.length) bad(problems.join(' · '));
  else ok(`pot filled twice: ${count(lane)} driven by the scroll, ${count(scene)} standing full in his hands`);
}

/* ── 3c · the structured data ──────────────────────────────────────────── */
/* This is the only thing on the site written for a machine rather than a
   person, so nothing about it is visible when it breaks. Three things are
   worth failing over: it has to parse, every @id it points at has to exist,
   and it must never claim a rating, a review or a download count — the app
   has none, Google demotes sites for saying otherwise, and it would be a lie
   whether or not it were caught. */
console.log('\n── structured data ──');
{
  const FORBIDDEN = ['aggregateRating', 'ratingValue', 'reviewCount', 'ratingCount', 'review', 'award'];
  for (const [route, file] of Object.entries(pages)) {
    const h = readFileSync(file, 'utf8');
    const raw = (h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
    if (!raw) {
      (route === '/404' ? ok : bad)(`${route.padEnd(12)} ${route === '/404' ? 'no JSON-LD, which is right for a 404' : 'NO JSON-LD'}`);
      continue;
    }
    let data;
    try { data = JSON.parse(raw); } catch (e) { bad(`${route} JSON-LD does not parse: ${e.message}`); continue; }
    const graph = data['@graph'] || [data];
    const defined = new Set(graph.map((n) => n['@id']).filter(Boolean));
    const refs = [];
    const lies = [];
    const walk = (n, top) => {
      if (Array.isArray(n)) return n.forEach((v) => walk(v, top));
      if (!n || typeof n !== 'object') return;
      const keys = Object.keys(n);
      if (!top && keys.length === 1 && keys[0] === '@id') refs.push(n['@id']);
      for (const [k, v] of Object.entries(n)) {
        if (FORBIDDEN.includes(k)) lies.push(k);
        if (k !== '@id') walk(v, false);
      }
    };
    graph.forEach((n) => walk(n, true));
    const dangling = [...new Set(refs)].filter((r) => !defined.has(r));
    const problems = [];
    if (dangling.length) problems.push(`@id points at nothing: ${dangling.join(', ')}`);
    if (lies.length) problems.push(`claims it cannot back: ${[...new Set(lies)].join(', ')}`);
    if (problems.length) bad(`${route}: ${problems.join(' · ')}`);
    else ok(`${route.padEnd(12)} ${graph.map((n) => n['@type']).join(' + ')}`);
  }
}

/* ── 3d · the legal documents ──────────────────────────────────────────── */
/* legal/README.md §1.2 item 11: "No placeholders in production. The build
   should fail if any [BRACKETED PLACEHOLDER] from section 2 is still in the
   text." Three of the five cannot be answered by anyone but the founder, so
   this names them rather than just failing. The date a human edits lives in
   the two markdown files; the date a machine publishes is legalUpdatedISO and
   it goes into <lastmod> and into dateModified — nothing else joins them. */
console.log('\n── the legal documents ──');
{
  const { unfilled } = await import('../src/lib/legal.ts');
  const open = unfilled();
  if (open.length) {
    bad(`${open.length} placeholder(s) nobody has answered: ${open.join(' ')} — fill them in src/lib/site.mjs (see legal/README.md section 2)`);
  } else ok('every placeholder in the legal source is filled');

  /* and none of them reached a built page, whatever their source */
  const leaked = [];
  for (const [route, file] of Object.entries(pages)) {
    const found = (readFileSync(file, 'utf8').match(/\[[A-Z][A-Z ._-]{3,}\]/g) || []);
    if (found.length) leaked.push(`${route}: ${[...new Set(found)].join(' ')}`);
  }
  if (leaked.length) bad(`placeholders reached a public page — ${leaked.join(' · ')}`);
  else ok('no bracketed placeholder is on any built page');

  /* legal/README.md is the founder's handoff note and it says, in its own
     table, "No. Never publish it". It lives outside src/ and public/ so Astro
     has no reason to emit it — but the cost of being wrong about that is a
     public page listing every unfixed legal risk before launch. */
  if (existsSync('dist/legal') || existsSync('dist/README.md')) bad('the legal handoff folder reached dist/ — it must never be published');
  else ok('legal/README.md is not in the build, which is where it must stay');

  /* The site and the documents must name the SAME mailbox. The documents send
     every data, rights and rights-holder request to it and the statutory
     clocks start when mail arrives — a footer pointing somewhere else is a
     missed deadline waiting to happen. */
  const inDocs = new Set();
  for (const f of ['privacy-policy.md', 'terms-of-use.md']) {
    for (const m of readFileSync(`legal/${f}`, 'utf8').matchAll(/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/gi)) inDocs.add(m[0]);
  }
  if (!inDocs.has(SITE.email)) bad(`the site writes to ${SITE.email} but the documents say ${[...inDocs].join(', ')}`);
  else if (inDocs.size > 1) bad(`the documents name more than one mailbox: ${[...inDocs].join(', ')}`);
  else ok(`the site and both documents send mail to ${SITE.email}`);

  /* Each document's date now comes from the document itself, so the two can
     no longer drift — but they still have to REACH the page. This checks that
     what a crawler is told matches what the reader is shown. */
  const { lastUpdatedISO } = await import('../src/lib/legal.ts');
  const DOC = { '/privacy': 'privacy-policy.md', '/terms': 'terms-of-use.md' };
  const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
  for (const [route, file] of Object.entries(DOC)) {
    const want = lastUpdatedISO(readFileSync(`legal/${file}`, 'utf8'));
    const wrong = [];
    for (const prefix of ['', '/tr']) {
      const h = readFileSync(pages[prefix + route], 'utf8');
      if (!h.includes(`"dateModified":"${want}"`) && !h.includes(`"dateModified": "${want}"`))
        wrong.push(`${prefix + route} dateModified`);
    }
    const loc = new RegExp(`<loc>[^<]*${route}</loc>\\s*<lastmod>([^<]*)</lastmod>`);
    const inMap = loc.exec(sitemap)?.[1];
    if (inMap !== want) wrong.push(`sitemap lastmod is ${inMap ?? 'missing'}`);
    if (wrong.length) bad(`${file} says ${want} but ${wrong.join(' · ')}`);
    else ok(`${route.padEnd(12)} dated ${want}, and that is what the sitemap and both pages publish`);
  }

  /* legal/README.md §1.2 items 5 and 10, and Privacy section 14 — which does
     not merely ask for this, it STATES it as a fact to the reader: these two
     pages load no third-party analytics, ads, embeds, fonts or widgets. The
     site has to keep making that true. `target="_blank"` is also out: it
     behaves badly inside the in-app browser sheet the app opens them in. */
  for (const route of ['/privacy', '/terms', '/tr/privacy', '/tr/terms']) {
    const h = readFileSync(pages[route], 'utf8');
    const third = [...h.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)]
      .map((m) => m[1])
      .filter((u) => !u.startsWith(SITE.url) && !u.startsWith('https://schema.org'));
    const problems = [];
    if (third.length) problems.push(`loads ${[...new Set(third)].join(', ')}`);
    if (/target="_blank"/.test(h)) problems.push('has target="_blank"');
    if (!h.includes(`mailto:${SITE.email}`)) problems.push('no mailto: link');
    if (problems.length) bad(`${route}: ${problems.join(' · ')}`);
    else ok(`${route.padEnd(12)} nothing third-party, no target=_blank, mailto present`);
  }

  /* the anchors the App, the store listing and /support deep-link to */
  const ANCHORS = {
    '/privacy': ['who-we-are','what-we-collect','on-your-device','ai-features','legal-bases','sharing','no-sale-no-ads-no-tracking','international-transfers','retention','security','your-rights','deleting-your-data','eea-uk','turkey-kvkk','us-states','children','permissions','website','changes','contact-and-complaints'],
    '/terms': ['about-these-terms','eligibility','license','accounts','subscriptions','fair-usage','attempts-count','ai-features','food-safety','imported-content','your-content','acceptable-use','intellectual-property','timers-and-notifications','availability-and-changes','third-party-services','disclaimers','limitation-of-liability','indemnity','termination','governing-law-and-disputes','app-store-terms','export-and-sanctions','changes-to-these-terms','general','contact'],
  };
  for (const [route, ids] of Object.entries(ANCHORS)) {
    for (const prefix of ['', '/tr']) {
      const h = readFileSync(pages[prefix + route], 'utf8');
      const gone = ids.filter((id) => !h.includes(`id="${id}"`));
      if (gone.length) bad(`${prefix + route} lost ${gone.length} anchor(s): ${gone.join(' ')}`);
      else ok(`${(prefix + route).padEnd(12)} all ${ids.length} anchors present — the App deep-links to these`);
    }
  }
}

/* ── 3e · can the cut fonts actually spell what they are given? ────────── */
/* Two faces ship as subsets: Caveat, which only ever sets the four margin
   notes, and Newsreader italic, cut from 62 KB to 19 by the same trick. A
   subset is a trap the moment somebody edits a string — a character outside
   the cut renders as a tofu box, silently, in the browser only. So rather
   than compare the cut list to itself, this asks the SHIPPED woff2 whether it
   has a glyph for every character the site actually puts through it. */
console.log('\n── the cut fonts against the text they are given ──');
{
  const fk = await import('fontkit');
  const face = (f) => fk.openSync(`dist/fonts/${f}`);
  const CAVEAT = face('caveat-normal-all.woff2');
  const ITALIC = face('newsreader-italic-all.woff2');

  /* every string the stylesheet renders in each cut face */
  const notes = [];
  const italics = [];
  for (const lang of ['en', 'tr']) {
    const c = COPY[lang];
    c.journey.features.forEach((f) => notes.push([`${lang} note`, f.note]));       /* .note */
    italics.push([`${lang} stores.comingSoon`, c.stores.comingSoon]);              /* .stores-note */
    italics.push([`${lang} stores.pricing`, c.stores.pricing]);
    italics.push([`${lang} phone.meta`, c.phone.meta]);                            /* .phone .p-meta */
  }
  for (const f of ['privacy-policy.md', 'terms-of-use.md']) {
    /* .legal .doc h1 + p — the "Last updated" and "Effective" lines, which are
       the third and fifth lines of each handed-over document */
    const lines = readFileSync(`legal/${f}`, 'utf8').split('\n');
    italics.push([`${f} updated`, lines[2]], [`${f} effective`, lines[4]]);
  }

  const missing = (font, text) =>
    [...new Set([...text])].filter((ch) => !font.hasGlyphForCodePoint(ch.codePointAt(0)));

  const holes = [];
  for (const [what, text] of notes) {
    const m = missing(CAVEAT, text);
    if (m.length) holes.push(`Caveat has no ${m.map((c) => JSON.stringify(c)).join(' ')} for ${what}`);
  }
  for (const [what, text] of italics) {
    const m = missing(ITALIC, text);
    if (m.length) holes.push(`the italic has no ${m.map((c) => JSON.stringify(c)).join(' ')} for ${what}`);
  }
  if (holes.length) bad(holes.join(' · ') + ' — widen the text= in scripts/fonts.mjs and re-run npm run fonts');
  else ok(`${notes.length} margin notes and ${italics.length} italic strings, every character present in the cut faces`);
}

/* ── 4 · weight ────────────────────────────────────────────────────────── */
console.log('\n── weight ──');
const gz = (f) => gzipSync(readFileSync(f)).length;
let js = 0;
for (const [route, file] of Object.entries(pages)) {
  console.log(`  ${route.padEnd(9)} ${String(statSync(file).size).padStart(6)} B raw  ${String(gz(file)).padStart(6)} B gzip`);
}
const html = readFileSync('dist/index.html', 'utf8');
for (const m of html.matchAll(/<script(?![^>]*application\/ld)[^>]*>([\s\S]*?)<\/script>/g)) js += gzipSync(Buffer.from(m[1])).length;
(js < 15 * 1024 ? ok : bad)(`client JS ${js} B gzip (budget 15360 B)`);
/* This is the one number in the repo that says what the site costs to load,
   and it used to filter on `latin.` — which quietly excluded Caveat, whose
   filename has no `latin` in it and which the four margin notes DO fetch. */
const F = (f) => statSync(join('dist/fonts', f)).size / 1024;
const EN = ['newsreader-normal-latin.woff2', 'newsreader-italic-all.woff2', 'caveat-normal-all.woff2'];
const TR = [...EN, 'newsreader-normal-latin-ext.woff2'];
console.log(`  fonts a first English visit fetches: ${EN.reduce((n, f) => n + F(f), 0).toFixed(0)} KB`);
console.log(`  fonts a first Turkish visit fetches: ${TR.reduce((n, f) => n + F(f), 0).toFixed(0)} KB (ş and ğ live in latin-ext)`);
console.log(`    of which Newsreader italic: ${F('newsreader-italic-all.woff2').toFixed(0)} KB, cut to the italic text`);

console.log(fails ? `\n${fails} FAILING\n` : '\nall checks pass\n');
process.exit(fails ? 1 : 0);
