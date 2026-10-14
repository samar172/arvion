/**
 * One-off: give every product that has stock but no ledger history an
 * "Opening balance" movement, so stock history explains today's numbers.
 * Safe to re-run; products that already have movements are skipped.
 *
 *   npx ts-node prisma/backfill-opening-stock.ts
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const inventories = await prisma.inventory.findMany({
    where: { stock: { not: 0 }, product: { movements: { none: {} } } },
    include: { product: { select: { createdAt: true } } },
  });

  for (const inv of inventories) {
    await prisma.stockMovement.create({
      data: {
        productId: inv.productId,
        type: 'ADJUSTMENT',
        quantity: inv.stock,
        balanceAfter: inv.stock,
        note: 'Opening balance',
        createdAt: inv.product.createdAt,
      },
    });
  }
  console.log(`Opening balances written for ${inventories.length} product(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

export {};
