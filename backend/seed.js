const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.create({
    data: {
      name: 'Attar',
      slug: 'attar',
      description: 'Traditional, alcohol-free attar oils',
    }
  });

  const product = await prisma.product.create({
    data: {
      title: 'Arvion Pure Attar',
      description: 'Traditional, alcohol-free attar oils distilled using centuries-old methods from the finest botanicals.',
      price: 1500,
      sku: 'ARV-ATTAR-001',
      categoryId: category.id,
      inventory: {
        create: {
          stock: 100,
          reserved: 0
        }
      }
    }
  });

  console.log('Seeded product:', product);
}

main().catch(console.error).finally(() => prisma.$disconnect());
