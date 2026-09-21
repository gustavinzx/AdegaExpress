import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Update all current users to be ADMINISTRADOR so the user can test the admin panel
  const res = await prisma.user.updateMany({
    data: { role: 'ADMINISTRADOR' },
  });
  console.log(`Promoted ${res.count} users to ADMINISTRADOR.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
