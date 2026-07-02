export interface StaticProduct {
  id: string;
  title: string;
  price: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  halalCertified: boolean;
  categorySlug: string;
  categoryName: string;
  volume: string;
  rating: number;
  reviewCount: number;
  isBestseller?: boolean;
  isNew?: boolean;
  discount?: number;
  scentNotes: { top: string[]; heart: string[]; base: string[] };
  benefits: string[];
  origin: string;
}

export interface StaticCategory {
  name: string;
  slug: string;
  icon: string;
  description: string;
  imageUrl: string;
}

export const STATIC_CATEGORIES: StaticCategory[] = [
  {
    name: 'Rose & Floral',
    slug: 'rose-floral',
    icon: '🌹',
    description: 'Delicate floral attars capturing the soul of blooms',
    imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Oud & Woody',
    slug: 'oud-woody',
    icon: '🪵',
    description: 'Deep, resinous oud and earthy wood-based fragrances',
    imageUrl: 'https://images.unsplash.com/photo-1519682577862-22b62b24cb12?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Musk & Amber',
    slug: 'musk-amber',
    icon: '✨',
    description: 'Warm, sensual musks and rich amber resins',
    imageUrl: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Exotic & Rare',
    slug: 'exotic-rare',
    icon: '💎',
    description: 'Precious saffron, henna, and other rare botanical extracts',
    imageUrl: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Gift Collections',
    slug: 'gift-collections',
    icon: '🎁',
    description: 'Curated attar sets for every occasion and celebration',
    imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=600&q=80',
  },
];

export const STATIC_PRODUCTS: StaticProduct[] = [
  {
    id: 'ruh-gulab',
    title: 'Ruh Gulab — Pure Rose Attar',
    price: '1499',
    description: 'Steam-distilled from thousands of hand-picked Damask roses. A timeless, divine fragrance of the subcontinent.',
    longDescription: 'Ruh Gulab, meaning "Soul of Rose," is a masterpiece of traditional perfumery. Crafted through the ancient deg-bhapka method of steam distillation in Kannauj — the fragrance capital of India — this attar captures the purest essence of hand-picked Damask roses blooming at dawn. Each 10ml bottle requires over 10,000 rose petals to produce, making it one of the most precious natural fragrances in the world. Alcohol-free and skin-safe, it blooms gently on the skin and lingers for hours, evoking gardens in full bloom.',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
    halalCertified: true,
    categorySlug: 'rose-floral',
    categoryName: 'Rose & Floral',
    volume: '10ml',
    rating: 4.9,
    reviewCount: 312,
    isBestseller: true,
    discount: 15,
    scentNotes: {
      top: ['Fresh Rose Dew', 'Green Leaf'],
      heart: ['Damask Rose Otto', 'Rose Absolute'],
      base: ['Sandalwood', 'White Musk'],
    },
    benefits: ['100% Natural Botanical', 'Alcohol-Free & Halal', 'Long-lasting (8–10 hrs)', 'No synthetic additives'],
    origin: 'Kannauj, Uttar Pradesh, India',
  },
  {
    id: 'oud-al-maliki',
    title: 'Oud Al Maliki — Royal Oud Attar',
    price: '3999',
    description: 'Aged agarwood from the forests of Assam, distilled into a commanding, regal fragrance fit for royalty.',
    longDescription: 'Oud Al Maliki draws from the finest aged agarwood (Aquilaria malaccensis) sourced from the dense forests of Assam, India. The resinous heartwood, formed over decades as a tree\'s natural defense against infection, yields an oil of extraordinary depth and complexity. Through meticulous water distillation over low flame, the essential oil preserves every nuance of the ancient wood — smoky, balsamic, and unmistakably majestic. Worn by kings and scholars through centuries, this is the perfume of prestige.',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
    halalCertified: true,
    categorySlug: 'oud-woody',
    categoryName: 'Oud & Woody',
    volume: '6ml',
    rating: 4.8,
    reviewCount: 186,
    isBestseller: true,
    discount: 10,
    scentNotes: {
      top: ['Smoked Wood', 'Leather'],
      heart: ['Aged Agarwood', 'Balsamic Resin'],
      base: ['Dark Amber', 'Earthy Musk'],
    },
    benefits: ['Aged Agarwood', 'Single-origin Assam', 'Alcohol-Free', 'Long-lasting (12–14 hrs)'],
    origin: 'Assam, India',
  },
  {
    id: 'white-musk-tahara',
    title: 'White Musk Tahara — Pure Musk Attar',
    price: '899',
    description: 'Clean, powdery, and softly sensual. A crisp white musk that wraps the skin like a second layer.',
    longDescription: 'White Musk Tahara (meaning "purity") is the quintessential clean fragrance. Inspired by the ethereal softness of natural musk — once derived from deer musk pods — our version is a 100% botanical, cruelty-free musk attar fixed in a sandalwood base. It opens with a clean, powdery breath and settles into a warm, skin-hugging scent that is deeply intimate yet never overpowering. Perfect for daily wear, layering, or as a prayer fragrance.',
    imageUrl: 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=600&q=80',
    halalCertified: true,
    categorySlug: 'musk-amber',
    categoryName: 'Musk & Amber',
    volume: '12ml',
    rating: 4.7,
    reviewCount: 428,
    isBestseller: true,
    discount: 0,
    scentNotes: {
      top: ['Powder', 'Clean Air'],
      heart: ['White Musk', 'Soft Floral'],
      base: ['Sandalwood', 'Skin Musk'],
    },
    benefits: ['Cruelty-Free Musk', 'Ideal for daily prayer', 'Alcohol-Free', 'Gentle on skin'],
    origin: 'Kannauj, India',
  },
  {
    id: 'mogra-jasmine',
    title: 'Mogra Jasmine — Indian Night Jasmine',
    price: '1199',
    description: 'The intoxicating scent of mogra blossoms picked at midnight, distilled into a rich floral attar.',
    longDescription: 'Mogra, the Indian Jasmine (Jasminum sambac), blooms only at night and must be harvested before sunrise. Our Mogra attar captures this fleeting beauty through enfleurage and steam distillation, locking in the heady, deeply sweet floral character that has made mogra the crown jewel of Indian attars. It opens with an explosion of jasmine in full bloom and dries down to a creamy, slightly honeyed warmth. Traditionally gifted at weddings and celebrations.',
    imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
    halalCertified: true,
    categorySlug: 'rose-floral',
    categoryName: 'Rose & Floral',
    volume: '10ml',
    rating: 4.8,
    reviewCount: 194,
    isNew: true,
    discount: 0,
    scentNotes: {
      top: ['Night Jasmine Bloom', 'Indole'],
      heart: ['Mogra Absolute', 'Honey'],
      base: ['Sandalwood', 'Vanilla'],
    },
    benefits: ['Night-harvest Mogra', 'Wedding & celebration fragrance', 'Alcohol-Free', 'Traditional recipe'],
    origin: 'Karnataka, India',
  },
  {
    id: 'chandan-sandalwood',
    title: 'Chandan — Mysore Sandalwood Attar',
    price: '1699',
    description: 'The world\'s finest sandalwood from Mysore, aged and cold-pressed into a creamy, meditative oil.',
    longDescription: 'Chandan (Santalum album) from Mysore, Karnataka, is internationally regarded as the gold standard of sandalwood. Our Mysore Sandalwood Attar is extracted through slow-steam hydrodistillation from heartwood aged a minimum of 30 years — the age required for maximum santalol content, the molecule responsible for that iconic warm, milky, meditative scent. Long used in spiritual practices, this attar is as much a meditation aid as a perfume. It grounds, soothes, and gently uplifts.',
    imageUrl: 'https://images.unsplash.com/photo-1519682577862-22b62b24cb12?auto=format&fit=crop&w=600&q=80',
    halalCertified: true,
    categorySlug: 'oud-woody',
    categoryName: 'Oud & Woody',
    volume: '10ml',
    rating: 4.9,
    reviewCount: 267,
    isBestseller: true,
    discount: 20,
    scentNotes: {
      top: ['Creamy Wood', 'Mild Spice'],
      heart: ['Mysore Sandalwood', 'Milky Accord'],
      base: ['Soft Musk', 'Earthy Warmth'],
    },
    benefits: ['30-year aged heartwood', 'Meditatively calming', 'Alcohol-Free', 'High santalol content'],
    origin: 'Mysore, Karnataka, India',
  },
  {
    id: 'black-musk-al-lail',
    title: 'Black Musk Al-Lail — Night Musk',
    price: '799',
    description: 'Bold, dark, and mysterious. A seductive black musk attar that lingers deep into the night.',
    longDescription: 'Al-Lail ("The Night") is a dark musk attar crafted for those who prefer depth over lightness. Built around a rich, animalic musk base and fixed with dark woods and amber resin, it has a commanding presence that is both confident and mysterious. Unlike white musks, Al-Lail is warm, tenacious, and deeply sensual — it clings to skin and clothing and evolves beautifully over hours, revealing new facets from dusk to dawn.',
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683702?auto=format&fit=crop&w=600&q=80',
    halalCertified: true,
    categorySlug: 'musk-amber',
    categoryName: 'Musk & Amber',
    volume: '12ml',
    rating: 4.6,
    reviewCount: 153,
    isNew: true,
    discount: 0,
    scentNotes: {
      top: ['Dark Spice', 'Smoked Resin'],
      heart: ['Black Musk', 'Oakmoss'],
      base: ['Oud', 'Dark Amber', 'Vetiver'],
    },
    benefits: ['Intense sillage', 'Evening/night wear', 'Alcohol-Free', 'Long-lasting (10–12 hrs)'],
    origin: 'Kannauj, India',
  },
  {
    id: 'amber-anbar',
    title: 'Anbar — Golden Amber Attar',
    price: '1299',
    description: 'Warm, enveloping amber resin accord blended with soft musk and vanilla. The scent of golden hours.',
    longDescription: 'Anbar (the Arabic word for Ambergris) is a luxuriously warm amber attar that evokes the smell of a golden afternoon — resinous, sweet, and deeply comforting. Our Anbar uses ethically sourced labdanum (rock rose resin) as its amber heart, enriched with benzoin, tonka bean, and a whisper of vanilla to create a gourmand-adjacent warmth that is effortlessly wearable from day to evening. It is one of the most universally loved attars across cultures.',
    imageUrl: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=600&q=80',
    halalCertified: true,
    categorySlug: 'musk-amber',
    categoryName: 'Musk & Amber',
    volume: '10ml',
    rating: 4.8,
    reviewCount: 341,
    isBestseller: true,
    discount: 10,
    scentNotes: {
      top: ['Sweet Resin', 'Warm Spice'],
      heart: ['Labdanum Amber', 'Benzoin'],
      base: ['Tonka Bean', 'Vanilla', 'White Musk'],
    },
    benefits: ['Universally wearable', 'All seasons', 'Alcohol-Free', 'Comforting & warm'],
    origin: 'Kannauj, India',
  },
  {
    id: 'kesar-saffron',
    title: 'Kesar — Rare Saffron Attar',
    price: '4999',
    description: 'One of the rarest attars in existence. Pure Kashmiri saffron threads distilled with Sandalwood oil.',
    longDescription: 'Kesar Attar is among the most prized and expensive attars in the world, and for good reason. Produced from the hand-harvested stigmas of Crocus sativus (saffron) grown in the valleys of Kashmir — where the growing season spans only three weeks per year — this attar takes over 150,000 flowers to produce a single kilogram of raw saffron. Distilled into aged Mysore sandalwood oil, the result is an otherworldly fragrance: spicy, honeyed, slightly metallic, and deeply regal. Worn by Mughal emperors, this is truly the King of Attars.',
    imageUrl: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=600&q=80',
    halalCertified: true,
    categorySlug: 'exotic-rare',
    categoryName: 'Exotic & Rare',
    volume: '5ml',
    rating: 5.0,
    reviewCount: 89,
    isBestseller: false,
    isNew: false,
    discount: 0,
    scentNotes: {
      top: ['Metallic Spice', 'Honey'],
      heart: ['Kashmir Saffron', 'Rose Nuance'],
      base: ['Mysore Sandalwood', 'Warm Resin'],
    },
    benefits: ['Kashmir-origin saffron', 'Luxury collector\'s attar', 'Alcohol-Free', 'Certificate of authenticity'],
    origin: 'Kashmir, India',
  },
  {
    id: 'rose-oud-harmony',
    title: 'Rose Oud Harmony — Signature Blend',
    price: '2499',
    description: 'The most beloved attar blend — pure rose and aged oud in perfect proportion. A collector\'s signature.',
    longDescription: 'Rose Oud Harmony is our flagship blend and a masterclass in balance. We take our Ruh Gulab (rose distillate) and carefully marry it with aged Assam oud in a ratio refined over three generations of perfumers. The result is a fragrance that opens with the fresh brightness of rose gardens, transitions into the rich complexity of oud, and settles into a warm, lasting embrace of both. It is at once romantic and commanding — a signature scent unlike any other.',
    imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffbb54d85f3?auto=format&fit=crop&w=600&q=80',
    halalCertified: true,
    categorySlug: 'gift-collections',
    categoryName: 'Gift Collections',
    volume: '10ml',
    rating: 4.9,
    reviewCount: 208,
    isBestseller: true,
    discount: 12,
    scentNotes: {
      top: ['Fresh Rose', 'Dewy Petals'],
      heart: ['Damask Rose', 'Aged Oud'],
      base: ['Sandalwood', 'Amber', 'Musk'],
    },
    benefits: ['Signature house blend', 'Gift-ready packaging', 'Alcohol-Free', 'Unisex fragrance'],
    origin: 'Kannauj & Assam, India',
  },
  {
    id: 'henna-mehndi',
    title: 'Henna Mehndi — Festive Attar',
    price: '699',
    description: 'The warm, earthy, celebratory scent of fresh henna — an instant journey to wedding evenings.',
    longDescription: 'Henna Mehndi Attar bottles the unmistakable scent of a celebration — the sweet, earthy, grassy smell of fresh henna paste applied on hands at a mehndi ceremony. This is not a manufactured impression but a real distillation from henna (Lawsonia inermis) leaves, capturing an aroma deeply embedded in cultural memory across South Asia and the Middle East. Wear it to reconnect with tradition, or gift it to someone as a beautiful memory in a bottle.',
    imageUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80',
    halalCertified: true,
    categorySlug: 'rose-floral',
    categoryName: 'Rose & Floral',
    volume: '12ml',
    rating: 4.5,
    reviewCount: 176,
    isNew: false,
    discount: 0,
    scentNotes: {
      top: ['Earthy Green', 'Leafy Grass'],
      heart: ['Henna Leaf', 'Camphor'],
      base: ['Sandalwood', 'Soft Musk'],
    },
    benefits: ['Culturally iconic scent', 'Festive occasions', 'Alcohol-Free', 'Budget-friendly'],
    origin: 'Rajasthan, India',
  },
  {
    id: 'oud-cambodi',
    title: 'Oud Cambodi Royal — Cambodian Oud',
    price: '5499',
    description: 'Ultra-premium Cambodian agarwood — the rarest and most prized oud in the world.',
    longDescription: 'Oud Cambodi stands apart even among fine ouds. Cambodian agarwood (Aquilaria crassna) is widely considered the finest in the world — its resin profile differs markedly from Indian or Arabian ouds, producing a sweeter, fruitier, almost crystalline quality alongside the characteristic depth and smokiness. Our Cambodi Royal is sourced from wild trees aged over 50 years, giving the oil a complexity and smoothness that must be experienced to be understood. For the true oud connoisseur.',
    imageUrl: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=600&q=80',
    halalCertified: true,
    categorySlug: 'oud-woody',
    categoryName: 'Oud & Woody',
    volume: '3ml',
    rating: 5.0,
    reviewCount: 64,
    isBestseller: false,
    isNew: true,
    discount: 0,
    scentNotes: {
      top: ['Sweet Fruit', 'Crystal Smoke'],
      heart: ['Cambodian Oud', 'Honey Resin'],
      base: ['Dark Wood', 'Balsam'],
    },
    benefits: ['Wild 50-yr old trees', 'Rarest oud origin', 'Alcohol-Free', 'Collector\'s edition 3ml'],
    origin: 'Cambodia',
  },
  {
    id: 'amber-musk-trio',
    title: 'Amber Musk Trio — Gift Set',
    price: '2199',
    description: 'Three beloved attars in one elegant gift box: White Musk, Golden Amber & Rose. A perfect gift.',
    longDescription: 'The Amber Musk Trio brings together three of our best-loved attars in beautifully presented 4ml vials, housed in a handcrafted wooden gift box finished with gold embossing. It includes White Musk Tahara (clean & fresh), Anbar Golden Amber (warm & sweet), and Ruh Gulab (rose & romantic). This set is the perfect introduction to the world of attar for a first-timer, and an equally thoughtful gift for the connoisseur. Ideal for Eid, weddings, birthdays, and housewarmings.',
    imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=600&q=80',
    halalCertified: true,
    categorySlug: 'gift-collections',
    categoryName: 'Gift Collections',
    volume: '3 × 4ml',
    rating: 4.9,
    reviewCount: 157,
    isBestseller: true,
    isNew: false,
    discount: 18,
    scentNotes: {
      top: ['Rose', 'Powder', 'Sweet Resin'],
      heart: ['Musk', 'Amber', 'Floral'],
      base: ['Sandalwood', 'Vanilla', 'Musk'],
    },
    benefits: ['Handcrafted wooden box', 'Perfect gift packaging', 'All Alcohol-Free', 'Free gift message card'],
    origin: 'Kannauj, India',
  },
];

export function getProductById(id: string): StaticProduct | undefined {
  return STATIC_PRODUCTS.find((p) => p.id === id);
}

export function getProductsByCategory(slug: string): StaticProduct[] {
  return STATIC_PRODUCTS.filter((p) => p.categorySlug === slug);
}

export function getBestsellers(): StaticProduct[] {
  return STATIC_PRODUCTS.filter((p) => p.isBestseller);
}

export function getNewArrivals(): StaticProduct[] {
  return STATIC_PRODUCTS.filter((p) => p.isNew);
}
