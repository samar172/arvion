/**
 * Showcase catalogue for a fresh deployment: curated categories, products
 * with real photography, banners, coupons and storefront settings.
 *
 *   npx ts-node prisma/seed-showcase.ts
 *
 * Products and categories are upserted by sku/slug, so re-running refreshes
 * the copy and images without duplicating rows. Banners and settings are only
 * written when missing, so admin edits to them survive a re-run.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

/** Unsplash photo id → sized, cropped CDN URL. */
const img = (id: string, w = 1000) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const CATEGORIES = [
  {
    slug: 'gift-hampers',
    name: 'Gift Hampers',
    description: 'Curated boxes for Eid, Nikah and every blessed occasion',
    imageUrl: img('1769286145156-70a40fff80ec', 900),
  },
  {
    slug: 'qurans-books',
    name: 'Qurans & Books',
    description: 'Beautifully bound Mushafs, translations and keepsake books',
    imageUrl: img('1616422840391-fa670d4b2ae7', 900),
  },
  {
    slug: 'prayer-essentials',
    name: 'Prayer Essentials',
    description: 'Prayer mats, tasbih and kufis for daily worship',
    imageUrl: img('1600814832809-579119f47045', 900),
  },
  {
    slug: 'attars-oud',
    name: 'Attars & Oud',
    description: 'Alcohol-free attars, oud oils and bakhoor',
    imageUrl: img('1738414808975-201966230c59', 900),
  },
  {
    slug: 'dates-sweets',
    name: 'Dates & Sweets',
    description: 'Premium dates, baklava and dry-fruit platters',
    imageUrl: img('1769255484408-3ffada29d567', 900),
  },
  {
    slug: 'home-decor',
    name: 'Home Décor',
    description: 'Lanterns, calligraphy and pieces that bring barakah home',
    imageUrl: img('1781947486860-197257ddbb7b', 900),
  },
];

type SeedProduct = {
  sku: string;
  category: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isFeatured?: boolean;
  halalCertified?: boolean;
  images: string[];
};

const PRODUCTS: SeedProduct[] = [
  // ── Gift Hampers ───────────────────────────────────────────────
  {
    sku: 'HMP-EID-01',
    category: 'gift-hampers',
    title: 'Barakah Eid Hamper',
    description:
      'Our signature Ramadan and Eid hamper: Medjool dates, a pocket Quran, a crystal tasbih and a 6 ml attar, nestled in a keepsake box with a handwritten card. A generous gift for family, friends and colleagues.',
    price: 3499,
    compareAtPrice: 3999,
    stock: 24,
    isFeatured: true,
    images: ['1764385827253-3d0a5eb813fe', '1587617425953-9075d28b8c46', '1769286145156-70a40fff80ec'],
  },
  {
    sku: 'HMP-NIK-01',
    category: 'gift-hampers',
    title: 'Nikah Blessings Box',
    description:
      'A wedding and Nikah gift for the newlyweds: two matching prayer mats, a his-and-hers tasbih set, oud attar and a framed dua for a blessed marriage. Wrapped in ivory and gold.',
    price: 5999,
    stock: 12,
    isFeatured: true,
    images: ['1674620213535-9b2a2553ef40', '1600814832809-579119f47045', '1577217534079-41d6bb68ac50'],
  },
  {
    sku: 'HMP-HAJ-01',
    category: 'gift-hampers',
    title: 'Hajj & Umrah Mubarak Hamper',
    description:
      'Welcome home a pilgrim back from Hajj or Umrah: Ajwa dates, zamzam-style glass bottle, a travel prayer mat and a soft cotton kufi, presented in a wooden crate.',
    price: 2799,
    compareAtPrice: 3199,
    stock: 18,
    images: ['1773450970959-cef81e9b1053', '1629738601425-494c3d6ba3e2'],
  },
  {
    sku: 'HMP-AQI-01',
    category: 'gift-hampers',
    title: 'Aqiqah Welcome Baby Box',
    description:
      'Celebrate a new arrival and Aqiqah with a gentle gift: a first Quran stories book, a soft muslin swaddle, a keepsake name plaque and a box of dates for the family.',
    price: 2199,
    stock: 15,
    images: ['1513201099705-a9746e1e201f', '1497633762265-9d179a990aa6'],
  },
  {
    sku: 'HMP-HSE-01',
    category: 'gift-hampers',
    title: 'Housewarming Barakah Crate',
    description:
      'A housewarming gift to fill a new home with blessings: brass lantern, Ayatul Kursi wall art, bakhoor and a dry-fruit platter, packed in a reusable wooden crate.',
    price: 4499,
    stock: 4,
    images: ['1497700003451-e1df943a194b', '1760727467204-981086f6adfc'],
  },
  {
    sku: 'HMP-SNK-01',
    category: 'gift-hampers',
    title: 'Iftar Treats Box',
    description:
      'A Ramadan and Eid treats box for iftar gatherings: pistachio baklava, stuffed dates, rose Turkish delight and a tin of Arabic coffee.',
    price: 1899,
    stock: 30,
    images: ['1773450269672-8075682144a6', '1761828122856-8703baac8e86'],
  },

  // ── Qurans & Books ─────────────────────────────────────────────
  {
    sku: 'BK-QRN-01',
    category: 'qurans-books',
    title: 'Al-Quran Kareem — Leather Bound with Translation',
    description:
      'Uthmani script with a clear English translation, bound in soft leather with gilded page edges and a ribbon marker. A cherished Bismillah, wedding or Nikah gift.',
    price: 1499,
    compareAtPrice: 1799,
    stock: 40,
    isFeatured: true,
    images: ['1616422840391-fa670d4b2ae7', '1624345690118-d303350f7445'],
  },
  {
    sku: 'BK-QRN-02',
    category: 'qurans-books',
    title: 'Velvet Quran Gift Set with Rehal',
    description:
      'A velvet-covered Mushaf in a matching gift box with a hand-carved wooden rehal (Quran stand). Perfect for Ramadan and Eid, or for someone beginning to read.',
    price: 2499,
    stock: 14,
    isFeatured: true,
    images: ['1587617425953-9075d28b8c46', '1609599006353-e629aaabfeae'],
  },
  {
    sku: 'BK-KID-01',
    category: 'qurans-books',
    title: 'My First Quran Stories — Illustrated',
    description:
      'Twenty beloved stories of the Prophets retold for young readers, with warm illustrations. A lovely Bismillah or Aqiqah gift for little ones.',
    price: 699,
    stock: 55,
    images: ['1682517240633-7e55aeb85219', '1497633762265-9d179a990aa6'],
  },
  {
    sku: 'BK-DUA-01',
    category: 'qurans-books',
    title: 'Hisnul Muslim — Pocket Dua Book',
    description:
      'The Fortress of the Muslim: authentic daily duas in Arabic with transliteration and translation, in a pocket-sized hardcover for Hajj, Umrah and everyday use.',
    price: 299,
    stock: 120,
    images: ['1778664254374-365c597c564b'],
  },
  {
    sku: 'BK-JRN-01',
    category: 'qurans-books',
    title: 'Ramadan Reflections Journal',
    description:
      'A guided 30-day journal for Ramadan and Eid with daily verses, gratitude prompts and a Quran reading tracker. Linen cover, lay-flat binding.',
    price: 549,
    compareAtPrice: 699,
    stock: 0,
    images: ['1653569760000-1e33ac649550'],
  },

  // ── Prayer Essentials ──────────────────────────────────────────
  {
    sku: 'PR-MAT-01',
    category: 'prayer-essentials',
    title: 'Medina Velvet Prayer Mat',
    description:
      'A plush, padded velvet sajadah with a mihrab motif inspired by the Prophet’s Mosque. Non-slip backing and a matching drawstring pouch. A thoughtful wedding or Hajj gift.',
    price: 1299,
    compareAtPrice: 1699,
    stock: 35,
    isFeatured: true,
    images: ['1600814832809-579119f47045', '1761958150507-7bcc80840cf9'],
  },
  {
    sku: 'PR-MAT-02',
    category: 'prayer-essentials',
    title: 'Heritage Woven Prayer Rug',
    description:
      'Hand-loomed in cotton with a traditional floral border in deep reds and blues. Heavy, durable and beautiful enough to hang as a wall piece.',
    price: 2199,
    stock: 9,
    images: ['1594847915592-2a7ef568e2b6', '1589725617374-6d1cd65c8014'],
  },
  {
    sku: 'PR-TSB-01',
    category: 'prayer-essentials',
    title: 'Olive Wood Tasbih — 99 Beads',
    description:
      'Hand-turned olive wood beads with a silk tassel, smooth and warm to hold for daily dhikr. Arrives in a velvet pouch.',
    price: 449,
    stock: 80,
    images: ['1771758266506-c7002e6487af', '1784034008011-1cf10e243b67'],
  },
  {
    sku: 'PR-TSB-02',
    category: 'prayer-essentials',
    title: 'Crystal Tasbih with Silver Accents',
    description:
      'Faceted crystal beads that catch the light, finished with sterling-silver spacers. An elegant Eid or anniversary gift.',
    price: 899,
    compareAtPrice: 1099,
    stock: 3,
    images: ['1742219335029-951834824ed2', '1762013728442-c6cdde57371e'],
  },
  {
    sku: 'PR-KUF-01',
    category: 'prayer-essentials',
    title: 'Hand-Embroidered Kufi Cap',
    description:
      'Breathable cotton kufi with fine tone-on-tone embroidery. Comfortable for Jumu’ah, Eid and Hajj or Umrah travel.',
    price: 399,
    stock: 60,
    images: ['1782237319321-bac65528d4a5', '1765039425131-898be9e42b16'],
  },

  // ── Attars & Oud ───────────────────────────────────────────────
  {
    sku: 'AT-OUD-01',
    category: 'attars-oud',
    title: 'Royal Oud Attar — 12 ml',
    description:
      'A deep, smoky oud blended with rose and amber. Alcohol-free and long-lasting, in a hand-cut crystal bottle. A classic Eid and wedding gift.',
    price: 1899,
    compareAtPrice: 2299,
    stock: 22,
    isFeatured: true,
    images: ['1738414808975-201966230c59', '1709662217659-c7966220219f'],
  },
  {
    sku: 'AT-ROS-01',
    category: 'attars-oud',
    title: 'Taifi Rose Attar — 6 ml',
    description:
      'Distilled from the famed roses of Taif: soft, honeyed and luminous. Alcohol-free, gentle on skin.',
    price: 1199,
    stock: 28,
    images: ['1709662217659-c7966220219f', '1671493235081-5842463637cd'],
  },
  {
    sku: 'AT-MSK-01',
    category: 'attars-oud',
    title: 'White Musk Attar — 6 ml',
    description:
      'Clean, powdery white musk, the scent of freshly washed cotton. An everyday attar loved for Jumu’ah.',
    price: 899,
    stock: 45,
    images: ['1720423514789-15a33e59fc81', '1671493235081-5842463637cd'],
  },
  {
    sku: 'AT-SET-01',
    category: 'attars-oud',
    title: 'Attar Discovery Set — 5 × 3 ml',
    description:
      'Five signature attars (oud, rose, musk, amber and sandalwood) in a gift box. A perfect Ramadan and Eid present for someone new to attar.',
    price: 1599,
    stock: 16,
    isFeatured: true,
    images: ['1718466044521-d38654f3ba0a', '1784924247174-e8e52265a013'],
  },
  {
    sku: 'AT-BKH-01',
    category: 'attars-oud',
    title: 'Bakhoor & Brass Burner Set',
    description:
      'Fragrant bakhoor chips with a hand-finished brass mabkhara. Fill the home with a warm, welcoming scent; a lovely housewarming gift.',
    price: 1399,
    stock: 11,
    images: ['1777361988778-6e918aaa2e26', '1564624171349-46ed471bf4e3'],
  },

  // ── Dates & Sweets ─────────────────────────────────────────────
  {
    sku: 'DT-MED-01',
    category: 'dates-sweets',
    title: 'Premium Medjool Dates — 1 kg',
    description:
      'Jumbo, soft Medjool dates with a rich caramel sweetness. Hand-sorted and packed in a gift tin, ideal for Ramadan and Eid.',
    price: 1299,
    compareAtPrice: 1499,
    stock: 50,
    halalCertified: true,
    isFeatured: true,
    images: ['1769255484408-3ffada29d567', '1710228010206-934856204165'],
  },
  {
    sku: 'DT-AJW-01',
    category: 'dates-sweets',
    title: 'Ajwa Dates of Madinah — 500 g',
    description:
      'The treasured dark Ajwa from Madinah: tender, mildly sweet and deeply blessed. A meaningful gift for returning Hajj and Umrah pilgrims.',
    price: 1499,
    stock: 26,
    halalCertified: true,
    images: ['1777891258071-45b4cee69360', '1770617476915-7269d29d27dc'],
  },
  {
    sku: 'DT-BAK-01',
    category: 'dates-sweets',
    title: 'Pistachio Baklava Tray — 24 pcs',
    description:
      'Flaky, buttery layers of filo filled with Antep pistachios and finished with light syrup. Freshly made for Eid and family gatherings.',
    price: 1099,
    stock: 20,
    halalCertified: true,
    images: ['1761828122856-8703baac8e86', '1769812343879-f49768203a8d'],
  },
  {
    sku: 'DT-DRY-01',
    category: 'dates-sweets',
    title: 'Royal Dry Fruit Platter',
    description:
      'Almonds, cashews, pistachios, walnuts, apricots and figs arranged in a reusable wooden platter. A generous anniversary or housewarming gift.',
    price: 2299,
    compareAtPrice: 2699,
    stock: 13,
    halalCertified: true,
    images: ['1543158181-1274e5362710', '1641291361624-38b69b86b1cf'],
  },
  {
    sku: 'DT-KAD-01',
    category: 'dates-sweets',
    title: 'Pistachio Kadayif — 500 g',
    description:
      'Crisp shredded-filo nests packed with pistachio, a Turkish favourite for iftar and Eid tables.',
    price: 849,
    stock: 2,
    halalCertified: true,
    images: ['1482930172332-2293d7138235'],
  },

  // ── Home Décor ─────────────────────────────────────────────────
  {
    sku: 'HD-LNT-01',
    category: 'home-decor',
    title: 'Hand-Hammered Brass Lantern',
    description:
      'A pierced brass lantern that throws patterned light across the room. Beautiful for Ramadan evenings and a striking housewarming gift.',
    price: 2499,
    compareAtPrice: 2999,
    stock: 10,
    isFeatured: true,
    images: ['1781947486860-197257ddbb7b', '1760727467204-981086f6adfc'],
  },
  {
    sku: 'HD-LNT-02',
    category: 'home-decor',
    title: 'Ramadan Glass Lantern',
    description:
      'Black metal frame with clear glass panels; add a candle or fairy lights for a warm Ramadan and Eid glow.',
    price: 1199,
    stock: 25,
    images: ['1584650605024-7344812fa167', '1612176894219-8493bf9b9b1c'],
  },
  {
    sku: 'HD-CAL-01',
    category: 'home-decor',
    title: 'Ayatul Kursi Calligraphy Plate',
    description:
      'Engraved metal plate with Ayatul Kursi in flowing thuluth script, ready to hang. A blessed addition to a new home or wedding gift.',
    price: 1799,
    stock: 8,
    images: ['1676928117296-66bc2882ec6a', '1731253140211-6846950f91ec'],
  },
  {
    sku: 'HD-CUP-01',
    category: 'home-decor',
    title: 'Gold-Rim Arabic Coffee Set',
    description:
      'A brass dallah with six gold-rimmed finjan cups on a serving tray, for welcoming guests in style. A treasured anniversary gift.',
    price: 2999,
    stock: 7,
    images: ['1604924434662-4127d9fa3070', '1615110675073-6502b7f3a925'],
  },
];

const BANNERS = [
  {
    title: 'The Eid Gifting Edit',
    subtitle: 'Hampers, attars and keepsakes, wrapped by hand and delivered across India',
    imageUrl: img('1764385827253-3d0a5eb813fe', 1600),
    ctaLabel: 'Shop hampers',
    link: '/category/gift-hampers',
    sortOrder: 0,
  },
  {
    title: 'Attars from ₹899',
    subtitle: 'Alcohol-free oud, rose and musk that last all day',
    imageUrl: img('1718466044521-d38654f3ba0a', 1600),
    ctaLabel: 'Discover scents',
    link: '/category/attars-oud',
    sortOrder: 1,
  },
  {
    title: 'Bring barakah home',
    subtitle: 'Brass lanterns and calligraphy for every room',
    imageUrl: img('1760727467204-981086f6adfc', 1600),
    ctaLabel: 'Shop décor',
    link: '/category/home-decor',
    sortOrder: 2,
  },
];

const COUPONS = [
  { code: 'WELCOME10', type: 'PERCENT', value: 10, minOrderAmount: 500, maxDiscount: 300 },
  { code: 'BARAKAH100', type: 'FIXED', value: 100, minOrderAmount: 999 },
  { code: 'EID15', type: 'PERCENT', value: 15, minOrderAmount: 2500, maxDiscount: 750 },
];

const SETTINGS: Record<string, string> = {
  announcementOn: 'true',
  announcementText: 'Free shipping on orders over ₹999 · Gift wrapping on every order',
  heroBadge: 'Share the Barakah',
  heroTitle: 'Thoughtful Islamic gifts, curated with love',
  heroImageUrl: img('1587617425953-9075d28b8c46', 1600),
  freeShippingThreshold: '999',
  shippingFee: '79',
  whatsapp: '+91 91678 00000',
  supportEmail: 'care@al-rizvi.com',
  supportPhone: '+91 91678 00000',
  address: '1st Floor, Boricha Marg,\nJacob Circle, Mumbai,\nMaharashtra 400011, India',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  youtube: 'https://youtube.com',
};

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@arvion.com';
  const password = process.env.ADMIN_PASSWORD;
  if (password) {
    await prisma.user.upsert({
      where: { email },
      update: { role: 'ADMIN' },
      create: {
        email,
        name: process.env.ADMIN_NAME || 'Arvion Admin',
        passwordHash: await bcrypt.hash(password, 10),
        role: 'ADMIN',
      },
    });
    console.log(`Admin ready: ${email}`);
  } else {
    console.warn('ADMIN_PASSWORD not set; skipping admin user.');
  }

  const categoryIds: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, imageUrl: c.imageUrl },
      create: c,
    });
    categoryIds[c.slug] = row.id;
  }
  console.log(`${CATEGORIES.length} categories`);

  // Stagger createdAt so "New arrivals" has a stable, intentional order.
  const now = Date.now();
  for (const [i, p] of PRODUCTS.entries()) {
    const [cover, ...rest] = p.images.map((id) => img(id));
    const data = {
      title: p.title,
      description: p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      halalCertified: !!p.halalCertified,
      isFeatured: !!p.isFeatured,
      isActive: true,
      imageUrl: cover,
      images: rest.length ? JSON.stringify(rest) : null,
      categoryId: categoryIds[p.category],
    };
    const row = await prisma.product.upsert({
      where: { sku: p.sku },
      update: data,
      create: { ...data, sku: p.sku, createdAt: new Date(now - i * 36e5) },
    });
    await prisma.inventory.upsert({
      where: { productId: row.id },
      update: { stock: p.stock },
      create: { productId: row.id, stock: p.stock },
    });
  }
  console.log(`${PRODUCTS.length} products`);

  if ((await prisma.banner.count()) === 0) {
    for (const b of BANNERS) await prisma.banner.create({ data: { ...b, active: true } });
    console.log(`${BANNERS.length} banners`);
  }

  for (const c of COUPONS) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: { ...c, active: true } });
  }
  console.log(`${COUPONS.length} coupons`);

  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log('Settings applied');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

export {};
