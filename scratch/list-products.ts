import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const p = await db.product.findMany({
    include: { category: true }
  });
  console.log(`TOTAL: ${p.length}`);
  p.forEach(x => console.log(`${x.id} | ${x.name} | ${x.category.name} | stock: ${x.stock_quantity} | active: ${x.is_active} | img: ${x.image_url}`));
}
main().finally(() => db.$disconnect());
