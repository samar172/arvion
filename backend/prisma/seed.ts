const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedAdmin() {
  // Admin credentials come from env so real secrets never live in the repo.
  const email = process.env.ADMIN_EMAIL || 'admin@arvion.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.ADMIN_NAME || 'Arvion Admin';

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: { email, name, passwordHash, role: 'ADMIN' },
  });

  console.log(`Admin user ready: ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('  ⚠  Using default admin password "ChangeMe123!" — set ADMIN_PASSWORD in .env before production.');
  }
}

async function main() {
  console.log('Seeding data...');

  await seedAdmin();

  const categoriesData = [
    { name: "Prayer Mats", slug: "prayer-mats", description: "Ultra-soft Sajadahs and prayer essentials", imageUrl: "https://images.unsplash.com/photo-1600862098679-b883d69a65fb?auto=format&fit=crop&q=80&w=400" },
    { name: "Dates", slug: "dates", description: "Premium organic dates and sweet treats", imageUrl: "https://images.unsplash.com/photo-1596484552993-8fc6bf471a2a?auto=format&fit=crop&q=80&w=400" },
    { name: "Attars", slug: "attars", description: "Alcohol-free premium botanical attar oils", imageUrl: "https://images.unsplash.com/photo-1595425970377-c9703bc48b2a?auto=format&fit=crop&q=80&w=400" },
    { name: "Books", slug: "books", description: "Islamic books, Qurans and translations", imageUrl: "https://images.unsplash.com/photo-1609599006353-e629aaab31ce?auto=format&fit=crop&q=80&w=400" },
    { name: "Halal Meat", slug: "halal-meat", description: "100% Halal certified fresh meat", imageUrl: "https://images.unsplash.com/photo-1604503468306-202f7230cea4?auto=format&fit=crop&q=80&w=400" },
    { name: "Clothing", slug: "clothing", description: "Elegant, tailored modest wear", imageUrl: "https://images.unsplash.com/photo-1620353163351-b0dbbe562b2c?auto=format&fit=crop&q=80&w=400" }
  ];

  const categories: Record<string, any> = {};

  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, imageUrl: cat.imageUrl },
      create: cat,
    });
    categories[cat.slug] = createdCat;
  }

  console.log('Categories seeded.');

  const products = [
    {
      title: "Premium Velvet Prayer Mat (Sajadah)",
      description: "Experience comfort during your daily prayers with our ultra-soft, premium velvet Sajadah.",
      price: 1299.00,
      compareAtPrice: 1799.00,
      isFeatured: true,
      sku: "PRAY-001",
      halalCertified: false,
      imageUrl: "https://images.unsplash.com/photo-1600862098679-b883d69a65fb?auto=format&fit=crop&q=80&w=400",
      stock: 50,
      categorySlug: "prayer-mats"
    },
    {
      title: "Organic Halal Medjool Dates 500g",
      description: "Premium large, sweet Medjool dates directly from organic farms.",
      price: 650.00,
      isFeatured: true,
      sku: "DATE-001",
      halalCertified: true,
      imageUrl: "https://images.unsplash.com/photo-1596484552993-8fc6bf471a2a?auto=format&fit=crop&q=80&w=400",
      stock: 120,
      categorySlug: "dates"
    },
    {
      title: "Pure Mukhallat Attar Concentrated Oil 12ml",
      description: "Alcohol-free premium attar with a long-lasting fragrance.",
      price: 899.00,
      compareAtPrice: 1199.00,
      isFeatured: true,
      sku: "ATTR-001",
      halalCertified: true,
      imageUrl: "https://images.unsplash.com/photo-1595425970377-c9703bc48b2a?auto=format&fit=crop&q=80&w=400",
      stock: 30,
      categorySlug: "attars"
    },
    {
      title: "Al-Quran Kareem with English Translation",
      description: "Beautifully bound Quran with side-by-side English translation.",
      price: 499.00,
      isFeatured: true,
      sku: "BOOK-001",
      halalCertified: false,
      imageUrl: "https://images.unsplash.com/photo-1609599006353-e629aaab31ce?auto=format&fit=crop&q=80&w=400",
      stock: 80,
      categorySlug: "books"
    },
    {
      title: "Fresh Halal Chicken Breast 1kg",
      description: "100% Halal certified, hand-slaughtered fresh chicken breast.",
      price: 350.00,
      sku: "MEAT-001",
      halalCertified: true,
      imageUrl: "https://images.unsplash.com/photo-1604503468306-202f7230cea4?auto=format&fit=crop&q=80&w=400",
      stock: 45,
      categorySlug: "halal-meat"
    },
    {
      title: "Men's Premium Cotton Thobe",
      description: "Elegant, comfortable, and tailored cotton thobe for everyday wear.",
      price: 1899.00,
      compareAtPrice: 2499.00,
      sku: "FASH-001",
      halalCertified: false,
      imageUrl: "https://images.unsplash.com/photo-1620353163351-b0dbbe562b2c?auto=format&fit=crop&q=80&w=400",
      stock: 15,
      categorySlug: "clothing"
    }
  ];

  for (const p of products) {
    const { stock, categorySlug, compareAtPrice, isFeatured, ...productData } = p as any;
    const categoryId = categories[categorySlug]?.id || null;

    const extra = {
      categoryId,
      compareAtPrice: compareAtPrice ?? null,
      isFeatured: isFeatured ?? false,
      isActive: true,
    };

    // Create or update product
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: extra,
      create: { ...productData, ...extra }
    });

    // Create or update inventory
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: { stock },
      create: {
        productId: product.id,
        stock,
        reserved: 0
      }
    });
  }

  console.log('Products seeded.');

  await seedBanners();
  await seedCoupons();
  await seedSettings();

  console.log('Seeding finished successfully.');
}

async function seedBanners() {
  const banners = [
    {
      title: "Eid Gifting Edit",
      subtitle: "Handpicked hampers for the ones you love",
      imageUrl: "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&q=80&w=1200",
      ctaLabel: "Shop the Edit",
      link: "/category/dates",
      sortOrder: 0,
      active: true,
    },
    {
      title: "Attars from ₹899",
      subtitle: "Alcohol-free, long-lasting botanical oils",
      imageUrl: "https://images.unsplash.com/photo-1595425970377-c9703bc48b2a?auto=format&fit=crop&q=80&w=1200",
      ctaLabel: "Discover Scents",
      link: "/category/attars",
      sortOrder: 1,
      active: true,
    },
  ];
  // Only seed when empty so admin edits are never overwritten on re-run.
  const count = await prisma.banner.count();
  if (count === 0) {
    for (const b of banners) await prisma.banner.create({ data: b });
    console.log('Banners seeded.');
  }
}

async function seedCoupons() {
  const coupons = [
    { code: 'WELCOME10', type: 'PERCENT', value: 10, minOrderAmount: 500, maxDiscount: 300, active: true },
    { code: 'BARAKAH100', type: 'FIXED', value: 100, minOrderAmount: 999, active: true },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }
  console.log('Coupons seeded.');
}

async function seedSettings() {
  const settings: Record<string, string> = {
    whatsapp: '+91 91678 00000',
    supportEmail: 'care@al-rizvi.com',
    supportPhone: '+91 91678 00000',
    address: '1st Floor, Boricha Marg,\nJacob Circle, Mumbai,\nMaharashtra 400011, India',
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log('Settings seeded.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
