/**
 * The raster assets: the two share cards and the iOS touch icon.
 *
 *   npm run assets          (run `npm run build` first — see below)
 *
 * EVERY piece of text on the card is emitted as OUTLINES from the site's own
 * woff2 via fontkit. librsvg has no Newsreader to resolve and would silently
 * fall back to Georgia — which is exactly what the old card did for its two
 * text lines, so the name was set in Newsreader and the tagline under it was
 * not. Nothing here is <text>.
 *
 * The chef is not redrawn here either. He is lifted out of the built page so
 * there is still exactly one place he is drawn — which means this script needs
 * dist/ to exist. Build, generate, build again:
 *
 *   npm run build && npm run assets && npm run build
 *
 * The second build is only so dist/ picks up the fresh PNGs out of public/.
 */
import sharp from 'sharp';
import * as fontkit from 'fontkit';
import { readFileSync, existsSync } from 'node:fs';

const { copy, LOCALES } = await import('../src/lib/copy.ts');

const OCHRE = '#E9C46A';
const INK = '#1F1B17';
const LINE = '#2E2A26';

/* Both faces: the Turkish card needs ş and ğ, which live in the latin-ext
   subset. Each glyph is taken from whichever file actually has it. */
const FACES = [
  fontkit.openSync('public/fonts/newsreader-normal-latin.woff2'),
  fontkit.openSync('public/fonts/newsreader-normal-latin-ext.woff2'),
];
const font = FACES[0];
const UPM = font.unitsPerEm;
const XH = font.xHeight;
const faceFor = (ch) => FACES.find((f) => f.hasGlyphForCodePoint(ch.codePointAt(0))) || font;

/* The lock-up is weight 800. fontkit cannot instance a variable axis on the
   shipped subset, so `npm run fonts` saves a static 800 cut of the nine
   characters the wordmark uses and the card is set from that — the real
   outlines at the real weight, not the 400 outlines walked out with a stroke,
   which is what this used to do. 1.7 KB, build only, never shipped. */
const WM = fontkit.openSync('scripts/wordmark-800.woff2');
const WM_UPM = WM.unitsPerEm;

const TOQUE_VB = { x: 62, y: 44, w: 118, h: 79 };
const TOQUE = `
  <path d="M78 103 C64 74 92 54 112 64 C120 46 148 50 148 72 C170 70 178 92 160 103 Z" fill="#FDF8EC" transform="translate(2 -2)"/>
  <path d="M78 103 C64 74 92 54 112 64 C120 46 148 50 148 72 C170 70 178 92 160 103 C144 110 92 111 78 103" fill="none" stroke="${LINE}" stroke-width="4.4"/>
  <path d="M78 103 L160 103 L157 121 L82 121 Z" fill="#EFE3CB"/>
  <path d="M78 103 L160 103 L157 121 L82 121 Z" fill="none" stroke="${LINE}" stroke-width="4" stroke-linejoin="round"/>`;

/**
 * A run of text as outlines, baseline-left at (0,0), in `size` pixels.
 * Kerned: the glyphs come from the face's own layout, one run per face.
 */
function textOutline(text, size, color, opacity = 1) {
  const paths = [];
  let x = 0;
  let run = '';
  let runFace = null;
  const flush = () => {
    if (!run) return;
    const { glyphs, positions } = runFace.layout(run);
    const s = size / runFace.unitsPerEm;
    glyphs.forEach((g, i) => {
      const d = g.path.toSVG();
      if (d) paths.push(`<path d="${d}" transform="translate(${(x / s + (positions[i].xOffset || 0)).toFixed(1)} 0)"/>`);
      x += positions[i].xAdvance * s;
    });
    run = '';
  };
  for (const ch of text) {
    const f = faceFor(ch);
    if (f !== runFace) { flush(); runFace = f; }
    run += ch;
  }
  const s = size / (runFace || font).unitsPerEm;
  flush();
  return {
    width: x,
    svg: `<g fill="${color}" fill-opacity="${opacity}"><g transform="scale(${s.toFixed(6)} ${(-s).toFixed(6)})">${paths.join('')}</g></g>`,
  };
}

/** The lock-up — the wordmark with the toque as the tittle of the dotless ı. */
function lockup(size, color) {
  const s = size / WM_UPM;
  const tracking = -0.024 * WM_UPM;
  let x = 0;
  let stem = null;
  const glyphs = [];

  for (const ch of 'Bıg Spice') {
    const g = WM.glyphForCodePoint(ch.codePointAt(0));
    const d = g.path.toSVG();
    if (d) glyphs.push(`<path d="${d}" transform="translate(${x} 0)"/>`);
    if (ch === 'ı') stem = x + g.advanceWidth / 2;
    x += g.advanceWidth + tracking;
  }

  const tqW = 1.15 * WM_UPM;
  const tqH = tqW * (TOQUE_VB.h / TOQUE_VB.w);
  const tqS = tqW / TOQUE_VB.w;
  /* An OPTICAL correction, and the one place this card departs from the CSS.
     `--tq-lift: 1ex + .14em` is tuned for the 23px lock-up in the nav, where
     that .14em gap is 3px and reads as a tittle. At 160px it is 22px and the
     toque floats free of the letter. Display sizes want the gap closed. */
  const lift = (WM.xHeight || XH) + 0.03 * WM_UPM;

  const toque = `
    <g transform="rotate(-8 ${(stem * s).toFixed(2)} ${(-lift * s).toFixed(2)})">
      <g transform="translate(${(stem * s - (tqW * s) / 2).toFixed(2)} ${(-lift * s - tqH * s).toFixed(2)}) scale(${(tqS * s).toFixed(5)}) translate(${-TOQUE_VB.x} ${-TOQUE_VB.y})">
        ${TOQUE}
      </g>
    </g>`;

  return {
    width: (x - tracking) * s,
    capTop: (WM.capHeight || font.capHeight) * s,
    svg:
      `<g fill="${color}">` +
      `<g transform="scale(${s.toFixed(6)} ${(-s).toFixed(6)})">${glyphs.join('')}</g></g>` +
      toque,
  };
}

/* ── the chef, lifted out of the built page ─────────────────────────────── */
function chefFromBuild() {
  const file = 'dist/index.html';
  if (!existsSync(file)) {
    console.error(
      '\n  dist/index.html is missing, and the chef on the card is read from it\n' +
      '  so that he is drawn in exactly one place.\n\n' +
      '    npm run build && npm run assets && npm run build\n'
    );
    process.exit(1);
  }
  const html = readFileSync(file, 'utf8');

  /* resolve the custom properties to literals — librsvg does not do var() */
  const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  const vars = {};
  for (const m of css.match(/:root\s*\{([\s\S]*?)\}/)[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars[m[1]] = m[2].trim();
  }
  const resolve = (str) => {
    let out = str;
    for (let i = 0; i < 8 && /var\(--[\w-]+/.test(out); i++) {
      out = out.replace(/var\((--[\w-]+)(?:\s*,[^)]*)?\)/g, (_, k) => vars[k] ?? '#000');
    }
    return out;
  };

  const defs = html
    .match(/<svg width="0" height="0"[\s\S]*?<\/defs><\/svg>/)[0]
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');
  const inner = html.match(/<svg class="chef pose-point[^"]*"[^>]*>([\s\S]*?)<\/svg>/)[1];

  /* the 3.5° lean is CSS on the page; here it is an attribute */
  return resolve(`${defs}<g transform="rotate(3.5 126 279)">${inner}</g>`);
}

/* ── the share card ─────────────────────────────────────────────────────── */
const W = 1200, H = 630;
const chef = chefFromBuild();

/* He is cropped at the belt and bleeds off the bottom edge, the way a sticker
   is laid on a page rather than placed inside a frame. The crop is deliberate:
   at full length his torso is the weakest drawing in the set, and this is the
   one image of the site that gets seen at 1200px. His pointer runs up into
   the B, which is why the text starts where it does. The crop line is just
   ABOVE his left hand on purpose: half a hand at the edge reads as a stray
   dot, a line running off the edge reads as a figure continuing. */
const CHEF = { x: 10, y: 92, w: 494, h: 538 };
const TEXT_X = 512;

function card(lang) {
  const t = copy[lang];
  const lock = lockup(136, INK);
  const title = textOutline(t.hero.title, 41, INK, 0.9);
  const sub = textOutline(t.meta.ogSub, 27, INK, 0.72);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${OCHRE}"/>
  <svg x="${CHEF.x}" y="${CHEF.y}" width="${CHEF.w}" height="${CHEF.h}" viewBox="58 38 204 222" overflow="visible">${chef}</svg>
  <g transform="translate(${TEXT_X} 348)">${lock.svg}</g>
  <g transform="translate(${TEXT_X} 424)">${title.svg}</g>
  <g transform="translate(${TEXT_X} 480)">${sub.svg}</g>
</svg>`;
}

for (const lang of LOCALES) {
  const out = lang === 'en' ? 'public/og.png' : `public/og-${lang}.png`;
  await sharp(Buffer.from(card(lang))).png({ compressionLevel: 9 }).toFile(out);
  const w = lockup(136, INK).width;
  console.log(`${out}  1200×630 · wordmark ${w.toFixed(0)}px, real 800 outlines`);
}

await sharp(readFileSync('public/favicon.svg'), { density: 900 })
  .resize(180, 180).png({ compressionLevel: 9 }).toFile('public/apple-touch-icon.png');
console.log('public/apple-touch-icon.png  180×180');
