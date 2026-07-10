const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.update({
    where: { email: 'admin@arvion.com' },
    data: {
      passwordHash: passwordHash,
      role: 'ADMIN',
    }
  });

  console.log('Updated admin:', admin.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
