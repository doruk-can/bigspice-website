/**
 * THE ONE CONTENT FILE — English and Turkish.
 *
 * Nothing in any component hard-codes a sentence: every word on every page
 * comes from here, keyed by locale. Adding a third language is a third object
 * of the same shape plus a line in LOCALES.
 *
 * The handwritten margin notes are set in Caveat, which ships as a cut-down
 * face. `npm run fonts` controls which characters exist — it currently covers
 * A–Z a–z 0–9, space , . ! ? — ’ → and the Turkish set. Keep `note` strings
 * inside that, or re-cut the font.
 */

export const LOCALES = ['en', 'tr'] as const;
export type Locale = (typeof LOCALES)[number];

/** The other one. With two languages the switch is a toggle, not a menu. */
export const other = (lang: Locale): Locale => (lang === 'en' ? 'tr' : 'en');

export const localeLabel: Record<Locale, string> = { en: 'EN', tr: 'TR' };
export const localeName: Record<Locale, string> = { en: 'English', tr: 'Türkçe' };

/** English lives at the root; Turkish under /tr. `/` → `/tr`, `/privacy` → `/tr/privacy`. */
export function href(lang: Locale, path: string): string {
  const p = path === '/' ? '' : path;
  return lang === 'en' ? p || '/' : `/tr${p}`;
}

/** The paths that exist in both languages. */
export const PAIRED = ['/', '/support', '/privacy', '/terms'] as const;

/**
 * The same page in the other language — except on a page that has no twin
 * (the 404), where the honest answer is that language’s home page rather than
 * a link into nothing.
 */
export function counterpart(path: string): string {
  return (PAIRED as readonly string[]).includes(path) ? path : '/';
}

/* A note on `title` and `description`, because they are the two strings on
   this site that a search engine reads first:
     title       — the brand comes FIRST (brand queries are the only ones an
                   unlaunched site wins), then what the thing IS. Under 60
                   characters or Google truncates it.
     description — under ~155 characters, same reason. It does not rank the
                   page; it decides whether anyone clicks it.
   `npm run verify` fails if either grows past its limit. */
const en = {
  meta: {
    title: 'Big Spice — the timed, step-by-step recipe app',
    description:
      'Bring a recipe in from a link, a video or a photo of a cookbook page. Big Spice turns it into a timed, step-by-step cook and runs several dishes at once.',
    ogAlt: 'Big Spice — the cooking app',
    /* the one line on the share card, under the name */
    ogSub: 'Any recipe, turned into a timed step-by-step cook.',
    privacyTitle: 'Privacy Policy — Big Spice',
    privacyDescription:
      'What Big Spice collects, what it does not, which vendors see what, how long anything is kept, and how to have it deleted.',
    termsTitle: 'Terms of Use — Big Spice',
    termsDescription:
      'The terms you agree to when you use Big Spice: subscriptions and auto-renewal, fair usage limits, AI output, and who is responsible for food safety.',
    supportTitle: 'Support — Big Spice',
    supportDescription:
      'Help with Big Spice: what is free, where your recipes live, cancelling Pro, getting your data deleted, and whether you can trust the recipe.',
    notFoundTitle: 'Page not found — Big Spice',
    notFoundDescription: "That page isn’t here. Head back to the home page.",
  },

  nav: { home: 'Home', support: 'Support', privacy: 'Privacy', terms: 'Terms' },

  hero: {
    kicker: 'The cooking app',
    title: 'Let me do the boring part.',
    sub: 'Bring a recipe in from anywhere. I turn it into timed steps, keep the pans in order, and ring the moment something needs you.',
  },

  journey: {
    heading: 'What Big Spice does',
    lede: 'Four things, and the pot picks one up from each.',
    /* The one sentence on the site that simply says what the thing IS. The
       line above it is the voice; this is what a search engine quotes for
       "what is big spice" and what an answer engine repeats. Taken from
       src/legal/terms.md so it cannot drift from the terms. */
    what: 'Big Spice is a cooking app for iPhone and Android. It turns a recipe — a link, a YouTube, TikTok or Instagram video, or a photo of a cookbook page — into a timed, step-by-step cook, and runs several dishes on one timeline.',
    features: [
      {
        n: '01',
        eyebrow: 'Bring any recipe in',
        title: 'A link, a TikTok video, a page of a cookbook.',
        body: 'Paste a URL, drop in a YouTube, TikTok or Instagram video, or photograph a page from a book. What comes back is a timed, step-by-step cook — not a wall of text you have to keep re-reading with wet hands.',
        note: 'the tomato goes in',
      },
      {
        n: '02',
        eyebrow: 'Ask the Chef',
        title: 'A recipe from what’s in your fridge.',
        body: 'Tell me who’s eating, what’s in there and the mood you’re in, and I write back with a recipe for your kitchen — the pans you own, the people at your table and the hour you actually have.',
        note: 'a pepper, then',
      },
      {
        n: '03',
        eyebrow: 'Cook several dishes at once',
        title: 'One timeline, live timers, and a bell.',
        body: 'Two or three dishes land on a single timeline. Every step is drawn and animated so you can read it from across the kitchen, and a bell tells you the moment a pan wants you.',
        note: 'onions, of course',
      },
      {
        n: '04',
        eyebrow: 'See what you save',
        title: 'Cooked at home, priced against takeout.',
        body: 'Every dish you finish is added up against what the same thing would have cost delivered. No streak to keep, no badge to earn — just the running figure.',
        note: 'and the herbs on top',
      },
    ],
  },

  /* The support page. Apple and Google both require a support URL on a store
     listing, so this page has to exist before the app can ship — and it is
     the one place the site can answer, in plain words, the questions people
     actually type into a search box. Every answer here is checked against
     src/legal/privacy.md and src/legal/terms.md; nothing is invented. */
  support: {
    heading: 'Support',
    lede: 'Write to us and a person will answer. Before you do, one of these might already be it.',
    contactLabel: 'Write to',
    faqHeading: 'Common questions',
    faq: [
      {
        q: 'How do I cancel Pro?',
        a: 'In your store account settings, and at least 24 hours before the renewal date — we cannot cancel it for you. Deleting the App, or using Delete my data, does not cancel it. On iPhone: Settings, your name, Subscriptions, Big Spice. On Android: Play Store, your profile picture, Payments and subscriptions, Subscriptions, Big Spice. Pro keeps working until the end of the period you have already paid for, and refunds are handled by the store you bought from.',
        more: [],
      },
      {
        q: 'How do I get Pro back on a new phone?',
        a: 'Use Restore purchases in the App, signed in to the same store account that bought it. Pro belongs to that store account, not to anything we hold, so reinstalling, changing phone or erasing your data does not lose it. Restoring does not hand you a fresh monthly allowance.',
        more: [],
      },
      {
        q: 'How do I delete my data?',
        a: 'In the App: Settings, then Your data, then Delete my data. It erases what the App keeps on your phone and asks our servers to erase the records held against your account identifier, then the App starts again as a new install. It cannot be undone, and it also removes any cooking timers waiting to alert you — so do not use it while you are cooking. It does not cancel a Pro subscription.',
        more: [{ text: 'What exactly is erased, and what is kept', to: '/privacy#deleting-your-data' }],
      },
      {
        q: 'How do I withdraw the permission for AI features?',
        a: 'The same place: Settings, then Your data, then the AI features permission. Withdrawing it means nothing is sent for an import or for Ask the Chef until you allow it again, and the App asks you again the next time you try one. The rest of the App keeps working.',
        more: [{ text: 'What is sent, and to whom', to: '/privacy#ai-features' }],
      },
      {
        q: 'A request failed but it still used my allowance. Why?',
        a: 'A request counts as soon as our servers accept it, whether or not you get something you can use — a link with no recipe in it, a video that is private or removed, a photo that cannot be read, an answer that comes back damaged. It costs us the moment work starts, whatever the outcome. A request that never reaches our servers — you are offline, the file is the wrong type, you have no allowance left — does not count.',
        more: [{ text: 'The full rule', to: '/terms#attempts-count' }],
      },
      {
        q: 'Can I trust the recipe it gives me?',
        a: 'Read it before you cook it. Recipes, quantities, timings, temperatures and anything said about allergens or diets can be wrong — most of all when the recipe came from a link, a video or a photo, or from Ask the Chef. Check anything that matters against the original, and check every ingredient for allergens yourself. Big Spice does not know your allergies and cannot detect them.',
        more: [
          { text: 'What AI features can and cannot do', to: '/terms#ai-features' },
          { text: 'Food safety', to: '/terms#food-safety' },
        ],
      },
      {
        q: 'Is Big Spice free?',
        a: 'Cooking is. Importing a recipe and Ask the Chef are AI features and they are part of Pro, an auto-renewing subscription billed by your app store.',
        more: [{ text: 'Subscriptions in full', to: '/terms#subscriptions' }],
      },
    ],
    stillStuck: 'Still stuck? Write to us. Tell us which phone you are on and what you were doing, and we will work it out.',
    seeAlso: 'See also',
  },

  finale: {
    kicker: 'And then',
    title: 'Dinner is ready when you are.',
    body: 'Lid on. A shake. Lid off.',
  },

  stores: {
    comingSoon: 'Coming soon to the App Store and Google Play.',
    appStore: 'Download Big Spice on the App Store',
    playStore: 'Get Big Spice on Google Play',
    appStoreAlt: 'Download on the App Store',
    playStoreAlt: 'Get it on Google Play',
    soonSuffix: ' — coming soon',
    /* Survives launch, unlike comingSoon: it is the first thing a visitor
       wants to know before tapping a badge, and it is exactly true. */
    pricing: 'Free to cook with. Pro adds recipe imports and Ask the Chef.',
  },

  phone: {
    label: 'Step 3 of 9',
    dish: 'Shakshuka',
    timer: '06:20',
    meta: 'hands-off — you can leave it',
    button: 'Done',
    alt: 'The Big Spice cook screen: step 3 of 9, a drawn step illustration, a 6 minute 20 second timer and a Done button.',
  },

  notFound: {
    kicker: '404',
    title: 'Nothing on the stove here.',
    body: "That page isn’t one of ours — or it has moved. There are four: the home page, support, the privacy policy and the terms.",
  },

  /* shown above the legal text on the Turkish routes only; empty in English,
     which is the language those documents are written in */
  legalEnglishOnly: '',

  footer: { rights: '© 2026 Big Spice' },

  a11y: {
    skip: 'Skip to content',
    home: 'Big Spice — home',
    journey: 'An illustrated pot travelling down the page, collecting one ingredient from each feature.',
    langSwitch: 'Türkçe’ye geç',
  },
};

const tr: typeof en = {
  meta: {
    title: 'Big Spice — zamanlı, adım adım yemek tarifi uygulaması',
    description:
      'Bir link, bir video ya da kitap sayfasının fotoğrafı — Big Spice onu zamanlı, adım adım bir pişirmeye çeviriyor, birkaç yemeği aynı anda yürütüyor.',
    ogAlt: 'Big Spice — yemek uygulaması',
    ogSub: 'Her tarif, zamanlı adım adım bir pişirmeye dönüşür.',
    privacyTitle: 'Gizlilik Politikası — Big Spice',
    privacyDescription:
      'Big Spice neyi topluyor, neyi toplamıyor, hangi sağlayıcı neyi görüyor, ne kadar süre saklanıyor ve nasıl sildirilir.',
    termsTitle: 'Kullanım Koşulları — Big Spice',
    termsDescription:
      'Big Spice’ı kullanırken kabul ettiğin koşullar: abonelik ve otomatik yenileme, adil kullanım, yapay zekâ çıktısı ve gıda güvenliğinin sorumluluğu.',
    supportTitle: 'Destek — Big Spice',
    supportDescription:
      'Big Spice yardım: neler ücretsiz, tarifler nerede duruyor, Pro nasıl iptal edilir, veriler nasıl sildirilir ve tarife güvenilir mi.',
    notFoundTitle: 'Sayfa bulunamadı — Big Spice',
    notFoundDescription: 'Bu sayfa burada değil. Ana sayfaya dön.',
  },

  nav: { home: 'Ana sayfa', support: 'Destek', privacy: 'Gizlilik', terms: 'Koşullar' },

  hero: {
    kicker: 'Yemek uygulaması',
    title: 'Sıkıcı kısmı ben halledeyim.',
    sub: 'Tarifi nereden istersen getir. Onu zamanlı adımlara çeviriyorum, tencerelerin sırasını tutuyorum ve bir şeyin seni istediği anda haber veriyorum.',
  },

  journey: {
    heading: 'Big Spice ne yapıyor',
    lede: 'Dört şey — ve tencere her birinden birini alıyor.',
    what: 'Big Spice, iPhone ve Android için bir yemek tarifi uygulaması. Bir tarifi — bir bağlantıyı, bir YouTube, TikTok ya da Instagram videosunu ya da yemek kitabı sayfasının fotoğrafını — zamanlı, adım adım bir pişirmeye çeviriyor ve birkaç yemeği tek zaman çizelgesinde yürütüyor.',
    features: [
      {
        n: '01',
        eyebrow: 'Tarifi nereden olursa getir',
        title: 'Bir link, bir TikTok videosu, yemek kitabının bir sayfası.',
        body: 'Bir adres yapıştır, YouTube, TikTok ya da Instagram videosu at, ya da kitabın sayfasını fotoğrafla. Geri gelen şey zamanlı, adım adım bir pişirme oluyor — ıslak ellerle baştan okumak zorunda kalacağın bir metin yığını değil.',
        note: 'domates giriyor',
      },
      {
        n: '02',
        eyebrow: 'Şefe sor',
        title: 'Ne pişirsem? Buzdolabındakilerle bir tarif.',
        body: 'Kim yiyecek, elinde ne var, keyfin nasıl — söyle, sana senin mutfağına göre bir tarif yazayım: elindeki tencereler, sofrandaki insanlar ve gerçekten sahip olduğun süre.',
        note: 'sonra bir biber',
      },
      {
        n: '03',
        eyebrow: 'Aynı anda birkaç yemek',
        title: 'Tek çizelge, canlı zamanlayıcılar, bir zil.',
        body: 'İki üç yemek tek bir zaman çizelgesine oturuyor. Her adım çizilmiş ve canlandırılmış, mutfağın öbür ucundan okuyabilesin diye; bir tencere seni istediği anda zil çalıyor.',
        note: 'soğan tabii ki',
      },
      {
        n: '04',
        eyebrow: 'Ne kazandığını gör',
        title: 'Evde pişti, dışarıdan söylemeye göre fiyatlandı.',
        body: 'Bitirdiğin her yemek, aynısı kapına gelseydi ne tutacağıyla karşılaştırılıp toplanıyor. Tutulacak bir seri yok, kazanılacak bir rozet yok — sadece işleyen rakam.',
        note: 've üstüne otlar',
      },
    ],
  },

  support: {
    heading: 'Destek',
    lede: 'Bize yaz, bir insan cevap versin. Yazmadan önce, cevabın aşağıdakilerden biri olabilir.',
    contactLabel: 'Yazabileceğin adres',
    faqHeading: 'Sık sorulanlar',
    faq: [
      {
        q: 'Pro aboneliğimi nasıl iptal ederim?',
        a: 'Mağaza hesabının ayarlarından, ve yenilenme tarihinden en az 24 saat önce — senin adına iptal edemiyoruz. Uygulamayı silmek ya da Verilerimi sil demek aboneliği iptal etmiyor. iPhone’da: Ayarlar, adın, Abonelikler, Big Spice. Android’de: Play Store, profil resmin, Ödemeler ve abonelikler, Abonelikler, Big Spice. Pro, parasını ödediğin dönemin sonuna kadar çalışıyor; iadeler satın aldığın mağaza tarafından yürütülüyor.',
        more: [],
      },
      {
        q: 'Yeni telefonda Pro’yu nasıl geri alırım?',
        a: 'Uygulamada Satın alımları geri yükle’yi kullan; Pro’yu satın alan mağaza hesabıyla giriş yapmış olman yeterli. Pro o mağaza hesabına ait, bizde tuttuğumuz bir şeye değil — yani yeniden kurmak, telefon değiştirmek ya da verilerini silmek onu kaybettirmiyor. Geri yükleme sana yeni bir aylık hak vermiyor.',
        more: [],
      },
      {
        q: 'Verilerimi nasıl silerim?',
        a: 'Uygulamada: Ayarlar, sonra Verilerin, sonra Verilerimi sil. Uygulamanın telefonunda tuttuğu her şeyi siliyor ve sunucularımızdan hesap kimliğine bağlı kayıtların silinmesini istiyor; ardından uygulama yeni bir kurulum gibi baştan başlıyor. Geri alınamıyor, ve seni uyarmayı bekleyen pişirme sayaçlarını da kaldırıyor — o yüzden yemek yaparken kullanma. Pro aboneliğini iptal etmiyor.',
        more: [{ text: 'Tam olarak ne siliniyor, ne kalıyor', to: '/privacy#deleting-your-data' }],
      },
      {
        q: 'Yapay zekâ izni nasıl geri alınır?',
        a: 'Aynı yerden: Ayarlar, sonra Verilerin, sonra yapay zekâ özellikleri izni. İzni geri aldığında, sen yeniden izin verene kadar içe aktarma ve Şefe sor için hiçbir şey gönderilmiyor; bir dahaki denemende uygulama tekrar soruyor. Uygulamanın geri kalanı çalışmaya devam ediyor.',
        more: [{ text: 'Ne gönderiliyor, kime', to: '/privacy#ai-features' }],
      },
      {
        q: 'İstek başarısız oldu ama hakkımdan düştü. Neden?',
        a: 'Bir istek, sunucularımız onu kabul ettiği anda sayılıyor — kullanabileceğin bir sonuç çıksın çıkmasın. İçinde tarif olmayan bir link, gizli ya da kaldırılmış bir video, okunamayan bir fotoğraf, bozuk gelen bir cevap… Sonuç ne olursa olsun, iş başladığı anda bize maliyeti oluyor. Sunucularımıza hiç ulaşmayan bir istek — çevrimdışısın, dosya türü yanlış, hakkın kalmamış — sayılmıyor.',
        more: [{ text: 'Kuralın tamamı', to: '/terms#attempts-count' }],
      },
      {
        q: 'Verdiği tarife güvenebilir miyim?',
        a: 'Pişirmeden önce oku. Tarifler, miktarlar, süreler, sıcaklıklar ve alerjen ya da diyetle ilgili söylenen her şey yanlış olabilir — en çok da tarif bir linkten, bir videodan, bir fotoğraftan ya da Şefe sor’dan geldiyse. Önemli olan her şeyi aslıyla karşılaştır, ve her malzemeyi alerjen için kendin kontrol et. Big Spice senin alerjilerini bilmiyor ve tespit edemiyor.',
        more: [
          { text: 'Yapay zekâ özellikleri ne yapar, ne yapmaz', to: '/terms#ai-features' },
          { text: 'Gıda güvenliği', to: '/terms#food-safety' },
        ],
      },
      {
        q: 'Big Spice ücretsiz mi?',
        a: 'Pişirmek ücretsiz. Tarif içe aktarmak ve Şefe sormak yapay zekâ özellikleri ve Pro’nun içinde; Pro, mağazan tarafından faturalanan, otomatik yenilenen bir abonelik.',
        more: [{ text: 'Aboneliklerin tamamı', to: '/terms#subscriptions' }],
      },
    ],
    stillStuck: 'Hâlâ takıldın mı? Bize yaz. Hangi telefonu kullandığını ve ne yapmaya çalıştığını söyle, birlikte çözelim.',
    seeAlso: 'Ayrıca',
  },

  finale: {
    kicker: 'Ve sonra',
    title: 'Yemek, sen hazır olduğunda hazır.',
    body: 'Kapak kapanır. Bir silkeleme. Kapak açılır.',
  },

  stores: {
    comingSoon: 'App Store ve Google Play’de yakında.',
    appStore: 'Big Spice’ı App Store’dan indir',
    playStore: 'Big Spice’ı Google Play’den indir',
    appStoreAlt: 'App Store’dan indir',
    playStoreAlt: 'Google Play’den indir',
    soonSuffix: ' — yakında',
    pricing: 'Pişirmek ücretsiz. İçe aktarma ve Şefe sor, Pro’nun parçası.',
  },

  phone: {
    label: 'Adım 3 / 9',
    dish: 'Şakşuka',
    timer: '06:20',
    meta: 'elini istemiyor — bırakabilirsin',
    button: 'Bitti',
    alt: 'Big Spice pişirme ekranı: 9 adımın 3’ü, çizilmiş bir adım resmi, 6 dakika 20 saniyelik zamanlayıcı ve bir Bitti düğmesi.',
  },

  notFound: {
    kicker: '404',
    title: 'Burada ocakta bir şey yok.',
    body: 'Bu sayfa bizim değil — ya da taşındı. Dört sayfa var: ana sayfa, destek, gizlilik politikası ve koşullar.',
  },

  legalEnglishOnly: 'Bu hukuki metin şu an yalnızca İngilizce. Profesyonel bir Türkçe çevirisi hazırlanıyor. Koşullar’ın 24.5 maddesi uyarınca, yerel hukukunuz aksini gerektirmedikçe bağlayıcı olan İngilizce metindir. Bir yeri anlamadıysanız bize yazın, açıklayalım.',

  footer: { rights: '© 2026 Big Spice' },

  a11y: {
    skip: 'İçeriğe geç',
    home: 'Big Spice — ana sayfa',
    journey: 'Sayfada aşağı inen, her özellikten bir malzeme toplayan çizilmiş bir tencere.',
    langSwitch: 'Switch to English',
  },
};

export const copy: Record<Locale, typeof en> = { en, tr };

export type Feature = (typeof en)['journey']['features'][number];
