import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({ log: [] });
async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Dados de demonstração não podem ser carregados em produção.');
  }
  const samples = [
    {
      category: 'Água',
      name: 'Água Mineral Sem Gás Demonstração',
      brand: 'Fonte Cristal',
      price: '3.00',
      volume_ml: 500,
      abv_percent: '0.00',
      stock_quantity: 48,
    },
    {
      category: 'Sucos',
      name: 'Suco Integral de Uva Demonstração',
      brand: 'Pomar Natural',
      price: '14.90',
      volume_ml: 1000,
      abv_percent: '0.00',
      stock_quantity: 12,
    },
    {
      category: 'Refrigerantes',
      name: 'Refrigerante de Guaraná Demonstração',
      brand: 'Serra Verde',
      price: '5.50',
      volume_ml: 350,
      abv_percent: '0.00',
      stock_quantity: 24,
    },
    {
      category: 'Chás',
      name: 'Chá Gelado de Pêssego sem Estoque Demonstração',
      brand: 'Folha Real',
      price: '6.90',
      volume_ml: 450,
      abv_percent: '0.00',
      stock_quantity: 0,
    },
  ];
  for (const sample of samples) {
    const { category: categoryName, ...data } = sample;
    await db.$transaction(async (tx) => {
      const category = await tx.category.upsert({
        where: { name: categoryName },
        create: { name: categoryName, active: true },
        update: { active: true },
      });
      const exists = await tx.product.findFirst({ where: { name: data.name, brand: data.brand } });
      if (exists) {
        return;
      }
      const product = await tx.product.create({
        data: {
          ...data,
          category_id: category.id,
          description: 'Produto fictício não alcoólico para demonstração acadêmica.',
        },
      });
      if (data.stock_quantity) {
        await tx.stockMovement.create({
          data: {
            product_id: product.id,
            type: 'ENTRADA',
            quantity: data.stock_quantity,
            reason: 'Estoque inicial de demonstração',
          },
        });
      }
    });
  }
  console.info(
    'Catálogo de demonstração não alcoólico disponível. Produtos existentes e estoques preservados.',
  );
}
void seed()
  .catch(() => {
    console.error('Falha no catálogo de demonstração. Confira conexão, migrations e NODE_ENV.');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
