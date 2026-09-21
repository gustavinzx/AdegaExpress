
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  
  // Create products dir
  const publicDir = path.join('..', 'adega-express-frontend', 'public', 'products');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // We will output the product list to a JSON file so Python can process it
  fs.writeFileSync('products_list.json', JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
