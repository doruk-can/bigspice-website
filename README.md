# Big Spice — website

Nine pages: `/`, `/support`, `/privacy`, `/terms`, the same four under `/tr`,
and a bilingual 404. Astro (static output), plain CSS, one small vanilla
script. No animation library, no framework in the browser.

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # → dist/
npm run verify     # see below — it checks more than it used to
```

## What is where

| | |
|---|---|
| **Every link and address** | `src/lib/site.mjs` — store URLs, contact email, domain. Nothing else hard-codes them. |
| **Every word, in both languages** | `src/lib/copy.ts` — one object per locale, same shape. A third language is a third object plus a line in `LOCALES`. |
| **Privacy and Terms** | `src/legal/*.md` and `*.tr.md` — markdown, so a lawyer's edit is a one-line diff. |
| **The chef** | `src/components/Chef.astro` + four layer files in `src/components/chef/`. |
| **The pot** | `src/components/Pot.astro`. |
| **Tokens** | the top of `src/styles/global.css`, mirrored from the app's `src/constants/theme.ts`. |
| **Structured data** | `src/lib/schema.ts` — one graph builder per page kind, strings from `copy.ts`, URLs from `site.mjs`. |
| **Deployment headers** | `public/_headers` — read verbatim by Cloudflare Pages. |
| **What can be checked without a browser** | `scripts/verify.mjs` — contrast, every fixed width at every breakpoint, the nav row measured from the shipped woff2, wash-vs-ink-line, title and description lengths, the JSON-LD, page weight. |

## Being found

Nine pages, four of them in each language, plus a 404. What is done and why:

**The two strings a search engine reads first.** `title` puts the brand first —
brand queries are the only ones a site with no backlinks wins on day one — then
says what the thing is, under 60 characters. `description` stays under ~155.
Both were over before anyone measured them: the English description was 190
characters and the Turkish 225, so Google was truncating the tail of every
result. `npm run verify` now fails if either grows back.

**Structured data** lives in `src/lib/schema.ts`, one place, and rides on every
page except the 404: `Organization`, `WebSite`, the `MobileApplication` itself,
and on the inner pages a `WebPage` plus a `BreadcrumbList`. Nodes carry `@id`
and reference each other, so the app entity is reinforced on all eight indexable
pages rather than only the two home pages — which is what a search engine needs
to treat "Big Spice" as a thing rather than as two words.

Two rules govern that file and both are absolute. Every claim is TRUE: no
ratings, no review counts, no download numbers, no screenshots of a screen that
does not exist, and `offers` is written only once a store listing exists,
because a price for something nobody can buy is false the moment anyone checks.
And nothing is said twice: the strings come from `copy.ts`, the URLs from
`site.mjs`. `npm run verify` parses the JSON-LD on every page, fails on an
`@id` that points at nothing, and fails outright on `aggregateRating`,
`reviewCount` and friends.

**`/support`** exists for three reasons in this order: App Store Connect and
Google Play both require a support URL before a listing can go live; a person
with a problem needs somewhere to land; and every question on it is a sentence
somebody types into a search box. Each question is a top-level `h2`, not a
nested `h3`, because a question that is its own heading is a passage a search
engine can rank on its own. Every answer is checked against `src/legal/*.md` —
nothing on that page is invented. It is linked from the footer rather than the
nav: the nav is a fixed 64px band with 13px of slack at 360px in Turkish, and a
fourth link overflows it.

The page carries `FAQPage` markup, which is honest because the answers really
are visible on the page — but be clear-eyed about the payoff. Since August 2023
Google has shown FAQ rich results only for government and health sites, so that
markup earns nothing in a Google result today. It stays because it is true and
because other engines and assistants read it. **The answers are what rank, not
the markup around them.**

**`public/_headers`** is read verbatim by Cloudflare Pages. It holds the fonts
and Astro's hashed assets for a year (the font filenames are stable, so without
it a repeat visitor revalidates 190 KB of woff2 that has not changed) and sends
the headers a static marketing site should send anyway. Page HTML is left to
revalidate, or a deploy would take a day to reach anyone. Core Web Vitals is a
ranking signal and fonts sit on the critical path, so this is an SEO line as
much as a performance one.

Also in place: `hreflang` for both locales plus `x-default` on every page and in
the sitemap; `lastmod` only on the pages that genuinely have a date on their
face; a share card per language with `og:locale:alternate`; `noindex` on the 404
and nowhere else; no third-party scripts, so there is nothing to preconnect to.

**What is still missing, and it is the honest limit of on-page work:** nothing
here creates authority. An unlaunched app on a new domain with no links ranks
for its own name and very little else. The things that would change that are
the store listings themselves, and people writing about it.

**One judgement call left to you.** The home page is 324 words — the thinnest
page on the site and the one you most want to rank — and none of its headings
contain a word anyone searches. The `h1` is "Let me do the boring part."; the
section headings are "Four things, and the pot picks one up from each." and
"Dinner is ready when you are." That is the voice, and it was chosen
deliberately, so it has not been touched. Rewriting any of them for keywords is
a trade of character for traffic and it is not a trade to make quietly.

## Two languages

English lives at the root, Turkish under `/tr` — `/privacy` and `/tr/privacy`,
and so on. Seven pages in all, plus a 404 that speaks both because a mistyped
URL has no language.

`src/components/LangSwitch.astro` is the switch, used twice: at the far right
of the header, outside the list of pages and behind a hairline, and again in
the footer under the language's own name. It is deliberately not a fourth item
in the nav list — it is a control, not a destination. It goes to **the same
page** in the other language, except on the 404, which has no twin and so
offers that language's home instead (`counterpart()` in `src/lib/copy.ts`).
Every page declares `hreflang` for both locales plus `x-default`, and the
sitemap repeats those as `xhtml:link` alternates.

The header is the one row on the site that cannot wrap — a fixed 64px band —
and the Turkish labels run about 25% wider than the English ones. `npm run
verify` rebuilds that row from the shipped woff2 and the real strings in
`copy.ts` at seven widths in both languages, and fails if any of them leaves
under 8px of daylight. It caught a 360px Turkish overflow the first time it
ran. If you change a nav font size, a gap or a label, re-run it.

One thing to know before writing copy: the handwritten margin notes are set in
Caveat, which ships cut down to the characters that actually appear. It covers
A–Z a–z 0–9, space `, . ! ? — ’ →` and the Turkish set. A note using anything
else renders as a tofu box until you widen `CAVEAT_TEXT` in `scripts/fonts.mjs`
and re-run `npm run fonts`.

## The pot's journey

Scrolling the home page runs one continuous shot. The pot pins at a fixed
height; a dotted red-pencil path snakes past it; each feature card throws its
ingredient in as the pot draws level; at the end the chef takes the pot, the
lid goes on, it rattles, and dinner is served.

The path, the pot's sideways drift **and the point each ingredient lands on**
are the same sine, evaluated over the journey's real height, so they cannot
fall out of step at any width. Above 1100px the cards sit beside the lane and
the pot is pinned at `42vh`; below it the pot docks in a band under the nav and
the cards go full width — same four throws, same landing, same finale. Everything
the script writes is a CSS custom property consumed by a `transform` or an
`opacity` — nothing else is touched during a frame, and because the whole thing
is a pure function of scroll position, scrubbing back up rewinds it exactly.

`prefers-reduced-motion: reduce` skips the choreography entirely and shows the
end frames: everything already in the pot, the lid gone, dinner on the plate.

## Handing over the illustrated chef

The vector chef is a stand-in. Replacing him with the watercolour illustration
is **four file swaps and no code change** — nothing outside these files draws
him.

All four are authored in the chef's own coordinate space, `viewBox
"60 40 228 250"`. Deliver SVG if you can; if it has to be raster, deliver at
3× and drop an `<image>` into the same file.

| Layer | File | What it holds | The one thing that must not move |
|---|---|---|---|
| Body | `src/components/chef/Body.astro` | torso, apron, belt, **left** arm, feet | shoulders at `y ≈ 214`; feet baseline `y ≈ 279` |
| Arm | `src/components/chef/Arm.astro` | the **right** arm only, and the pointer stick | **pivot `(162, 218)`** — every arm pose rotates about it, so mark it on the delivery. The stick is its own `p-stick` group, gripped at `(192, 185)` |
| Face | `src/components/chef/Face.astro` | head, moustache, toque, smoked rounds | head centre `(122, 152)`, radii `56 × 52`; it draws over the arms |
| Lid | `src/components/chef/Lid.astro` | the pot lid | authored in the **pot's** space, `viewBox "0 0 160 132"`: knob on `x = 80`, the lid's bottom edge exactly on `y = 40`, which is the pot's rim |

Three poses are needed for the arm and two faces:

| Pose | Where | The right arm | The left arm |
|---|---|---|---|
| `point` | the hero — he is explaining the headline | raised, holding the stick, tip up and to the right at `(235, 145)` | hanging, hand at `(73, 266)` — **below** the belt, see note |
| `wave` | spare — the greeting he has in the app | raised, fingers splayed | hanging, hand at `(81, 251)` |
| `hold` | the finale — both hands round the pot | down and in, hand at `(172, 240)` | down and in, hand at `(76, 242)` |

Faces are `calm` and `grin` (the grin is the moment dinner appears), and
`Face.astro` takes `brows="raised"` for the pointing pose. **On the vector
stand-in that lift is invisible**: his toque band sits at `y 103–121` and the
brows are drawn at `y 108–116`, behind it. The prop is there because the
painted face will have a brow that shows, and the pose asks for it — it is not
dead code, it is a request to the illustrator. If only some of this arrives the
site still works; each missing piece falls back to the vector.

The pointing pose also leans the whole figure `3.5°` about `(126, 279)`, the
point between his feet. That lean is CSS, not art: keep the feet where they are
and it applies itself.

**One thing the painted chef should fix.** His torso is the weakest drawing in
the stand-in: a wide flat coat, a solid apron block, a horizontal belt and two
small feet under it read, at a glance, as a cup on a saucer. The left arm used
to close a loop against it and completed the illusion — that is why it now
hangs clear of the body instead of resting on the hip. The share card crops him
at the belt for the same reason. A torso that is taller than it is wide, with
the apron strings and a fold or two, ends the problem properly.

**The wash.** Every shape is an ink contour with a watercolour wash under it,
and several parts offset the wash a unit or two on purpose — that is the
drawing language. What is not the language is a wash of a *different size* from
its contour: the head shipped as a 56x52 fill against a 54x50 line and spilled
four units of skin past the outline on the right, which on the largest shape in
the figure reads as a plate that slipped in the press rather than as paint.
`npm run verify` now pairs every fill with its nearest contour and fails over
2.2 units of overhang, so a replacement drawing cannot bring the problem back.

**Paint.** The chef carries his own palette (`--fg-*` at the top of
`global.css`), separate from the page tokens, because the character is the
app's licensed colour citizen. In dark mode the page flips but the **ochre
finale band does not**, and inside it the chef is pinned to his light values —
he always stands on a light surface, which is the rule the app already follows.

## Store badges

`public/badges/` holds the **official artwork, unmodified**: Apple's own SVG
and Google's own PNG, straight from their brand pages. Google's PNG carries its
required clear space as built-in padding, which is why the two are sized to
match on the logo rather than on the file. Neither is recoloured or redrawn.
Both marks are black, so each sits on a light chip in every theme.

They render as static placeholders until `appStore.href` / `playStore.href` are
filled in — the page never ships a link that goes nowhere.

## Generated assets

```sh
npm run fonts     # re-cut the self-hosted woff2 subsets from Google Fonts
npm run assets    # re-render public/og.png and public/apple-touch-icon.png
```

There are **two** share cards, one per language, and `og:image` follows the
page's locale — `npm run verify` fails if a `/tr` page carries the English one.

Every word on them is emitted as **outlines** from the site's own woff2 via
fontkit, because the renderer has no Newsreader installed and falls back to
Georgia without saying so. The chef on the card is not redrawn here either: he
is lifted out of `dist/index.html`, so he is still drawn in exactly one place.
That is why the card needs a build to exist first:

```sh
npm run build && npm run assets && npm run build
```

The second build is only so `dist/` picks up the fresh PNGs out of `public/`.

The toque is placed on the ı by the CSS's rule — bottom-centred on the stem,
tilted −8° — with one deliberate departure: the lift is `1ex + 0.03em` rather
than `1ex + 0.14em`. That `.14em` is 3px at the 23px lock-up in the nav and
reads as a tittle; at 152px it is 21px and the toque floats free of the letter.
Display sizes want the gap closed.

**Two faces ship cut down.** Caveat sets the four margin notes and nothing
else. Newsreader italic sets seven short lines — the store note, the pricing
line, the phone's "hands-off" caption and the legal datestamp — and used to
cost 62 KB of latin plus 38 KB of latin-ext for them; cut to its own text, and
asked for WITHOUT the `opsz` axis (whose machinery survives a subset and costs
30 KB on its own), it is 19 KB.

A subset is a trap the moment somebody edits a string: a character outside the
cut renders as a tofu box, silently, in the browser only. So `npm run verify`
asks the shipped woff2 itself, through fontkit, whether it has a glyph for
every character the site actually puts through it — all eight margin notes and
all ten italic strings, in both languages. Widen the `text=` in
`scripts/fonts.mjs` and re-run `npm run fonts` when it complains.

## Looking at it in a browser

```sh
npm run build && npm run preview     # then open http://localhost:4321
npm run shots                        # screenshots at 1440/1100/820/390/360
npm run shots -- --dark
npm run shots -- --motion            # prefers-reduced-motion
```

`npm run shots` drives the installed Chrome over CDP and fulfils every request
from `dist/` directly, so it needs no port open. It also reports horizontal
overflow and whether the pinned pot ever lands on a card.

`npm run verify` is the part that needs no browser at all: WCAG contrast maths
against the real tokens, the arithmetic of every fixed width at all five
breakpoints, the head tags and heading structure of each built page, a scan for
unresolved `[PLACEHOLDER]` notes in the legal pages, and the JS budget.

## Deploying

**GitHub Pages**, built by `.github/workflows/deploy.yml` on every push to
`main`. The workflow runs `npm run verify` before it publishes, so a bracketed
placeholder, a lost legal anchor or an over-long title fails the deploy instead
of reaching the web.

```sh
git init && git add -A && git commit -m "feat: Big Spice marketing site"
gh repo create bigspice-website --public --source=. --remote=origin --push
```

Then in the repo: **Settings → Pages → Source: GitHub Actions**. Not "Deploy
from a branch" — the workflow uploads the artifact itself.

**Custom domain.** `public/CNAME` carries `bigspice.app` and ships in the build,
but the DNS is yours to set. GitHub Pages cannot use a CNAME at the apex, so it
takes A and AAAA records:

```
A     bigspice.app   185.199.108.153
A     bigspice.app   185.199.109.153
A     bigspice.app   185.199.110.153
A     bigspice.app   185.199.111.153
AAAA  bigspice.app   2606:50c0:8000::153
AAAA  bigspice.app   2606:50c0:8001::153
AAAA  bigspice.app   2606:50c0:8002::153
AAAA  bigspice.app   2606:50c0:8003::153
CNAME www            <user>.github.io
```

Then Settings → Pages → Custom domain → `bigspice.app`, and tick **Enforce
HTTPS** once the certificate is issued. `.app` is on the HSTS preload list, so
`http://` will never work anyway — only `https://`.

**`build.format` is `'file'` for this host.** With `'directory'` Astro emits
`privacy/index.html`, GitHub Pages serves it at `/privacy/` and 301s `/privacy`
to it — while every canonical, every `hreflang` and the app's own
`LEGAL_PATHS` say `/privacy` with no slash. `'file'` emits `privacy.html`,
which Pages answers at `/privacy` with a 200. `legal/README.md` §1.1 requires
exactly that.

**What GitHub Pages cannot do, and Cloudflare Pages could.** `public/_headers`
is a Cloudflare file and Pages ignores it: no `Cache-Control` on the fonts, no
`X-Content-Type-Options`, no `Referrer-Policy`. GitHub Pages gives every
response its own short cache and offers no way to change it, so the 190 KB of
self-hosted woff2 revalidates more often than it needs to. Core Web Vitals is a
ranking signal and fonts sit on the critical path, so this is a real cost — not
a large one, but a real one. The file is kept because it is correct for
Cloudflare, and switching hosts is then a matter of pointing DNS.

Cloudflare Pages also works from a **private** repo on the free plan; GitHub
Pages needs a paid plan for that. That is why `legal/README.md` is in
`.gitignore` — see the note there.

**After the first deploy, three checks:**

```sh
curl -sI https://bigspice.app/privacy | head -1   # want 200, not 301
curl -sI https://bigspice.app/terms   | head -1   # want 200
curl -s  https://bigspice.app/sitemap.xml | head -3
```

The first two are required, not cosmetic: the app opens both pages inside an
in-app browser sheet.

Then hand Google the sitemap once in Search Console —
`https://bigspice.app/sitemap.xml` — and set `LEGAL_ORIGIN` in the app's
`src/constants/legal.ts` to `https://bigspice.app`.
