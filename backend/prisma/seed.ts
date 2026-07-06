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

  const products = [
    {
      title: "Premium Velvet Prayer Mat (Sajadah)",
      description: "Experience comfort during your daily prayers with our ultra-soft, premium velvet Sajadah.",
      price: 1299.00,
      sku: "PRAY-001",
      halalCertified: false,
      imageUrl: "https://images.unsplash.com/photo-1600862098679-b883d69a65fb?auto=format&fit=crop&q=80&w=400",
      stock: 50
    },
    {
      title: "Organic Halal Medjool Dates 500g",
      description: "Premium large, sweet Medjool dates directly from organic farms.",
      price: 650.00,
      sku: "DATE-001",
      halalCertified: true,
      imageUrl: "https://images.unsplash.com/photo-1596484552993-8fc6bf471a2a?auto=format&fit=crop&q=80&w=400",
      stock: 120
    },
    {
      title: "Pure Mukhallat Attar Concentrated Oil 12ml",
      description: "Alcohol-free premium attar with a long-lasting fragrance.",
      price: 899.00,
      sku: "ATTR-001",
      halalCertified: true,
      imageUrl: "https://images.unsplash.com/photo-1595425970377-c9703bc48b2a?auto=format&fit=crop&q=80&w=400",
      stock: 30
    },
    {
      title: "Al-Quran Kareem with English Translation",
      description: "Beautifully bound Quran with side-by-side English translation.",
      price: 499.00,
      sku: "BOOK-001",
      halalCertified: false,
      imageUrl: "https://images.unsplash.com/photo-1609599006353-e629aaab31ce?auto=format&fit=crop&q=80&w=400",
      stock: 80
    },
    {
      title: "Fresh Halal Chicken Breast 1kg",
      description: "100% Halal certified, hand-slaughtered fresh chicken breast.",
      price: 350.00,
      sku: "MEAT-001",
      halalCertified: true,
      imageUrl: "https://images.unsplash.com/photo-1604503468306-202f7230cea4?auto=format&fit=crop&q=80&w=400",
      stock: 45
    },
    {
      title: "Men's Premium Cotton Thobe",
      description: "Elegant, comfortable, and tailored cotton thobe for everyday wear.",
      price: 1899.00,
      sku: "FASH-001",
      halalCertified: false,
      imageUrl: "https://images.unsplash.com/photo-1620353163351-b0dbbe562b2c?auto=format&fit=crop&q=80&w=400",
      stock: 15
    }
  ];

  for (const p of products) {
    const { stock, ...productData } = p;
    
    // Create or update product
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: productData
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

  console.log('Seeding finished successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
