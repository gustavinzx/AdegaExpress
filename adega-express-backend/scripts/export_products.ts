import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  fs.writeFileSync('products_list.json', JSON.stringify(products, null, 2));
  console.log("Produtos exportados para products_list.json");
}

main().catch(console.error).finally(() => prisma.$disconnect());
