import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adicionando produtos premium reais...');

  const catDestilados = await prisma.category.findFirst({ where: { name: 'Destilados' } });
  
  if (!catDestilados) {
    console.error("Categoria Destilados não encontrada!");
    return;
  }

  const products = [
    { name: "Jack Daniel's Tennessee Apple 1L", price: "159.90", image_url: "/products/jack_apple.png" },
    { name: "Bob Pinga / Busca Brisa 965ml", price: "35.00", image_url: "/products/bob_pinga.png" },
    { name: "Grand Old Parr 12 Anos 1L", price: "179.90", image_url: "/products/old_parr.png" },
    { name: "Johnnie Walker Red Label 1L", price: "99.90", image_url: "/products/red_label.png" },
    { name: "Ballantine's Finest 1L", price: "89.90", image_url: "/products/ballantines.png" },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { image_url: p.image_url }
      });
      console.log(`Atualizado: ${p.name}`);
    } else {
      await prisma.product.create({
        data: {
          name: p.name,
          category_id: catDestilados.id,
          price: p.price,
          brand: 'Premium',
          volume_ml: 1000,
          abv_percent: '40',
          stock_quantity: 50,
          active: true,
          image_url: p.image_url
        }
      });
      console.log(`Criado: ${p.name}`);
    }
  }

  console.log('Finalizado.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
