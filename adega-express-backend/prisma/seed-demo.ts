import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({ log: [] });
async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Dados de demonstração não podem ser carregados em produção.');
  }
  const samples = [
    {
      category: 'Cervejas',
      name: 'Cerveja Pilsen Demonstração',
      brand: 'Marca Exemplo',
      price: '5.90',
      volume_ml: 350,
      abv_percent: '4.50',
      stock_quantity: 48,
    },
    {
      category: 'Vinhos',
      name: 'Vinho Tinto Demonstração',
      brand: 'Vinícola Exemplo',
      price: '39.90',
      volume_ml: 750,
      abv_percent: '12.00',
      stock_quantity: 12,
    },
    {
      category: 'Sem álcool',
      name: 'Água Mineral Demonstração',
      brand: 'Fonte Exemplo',
      price: '3.00',
      volume_ml: 500,
      abv_percent: '0.00',
      stock_quantity: 24,
    },
    {
      category: 'Destilados',
      name: 'Destilado sem Estoque Demonstração',
      brand: 'Marca Exemplo',
      price: '59.90',
      volume_ml: 1000,
      abv_percent: '40.00',
      stock_quantity: 0,
    },
  ];
  for (const sample of samples) {
    const { category: categoryName, ...data } = sample;
    await db.$transaction(async (tx) => {
      const category = await tx.category.upsert({
        where: { name: categoryName },
        create: { name: categoryName },
        update: {},
      });
      const exists = await tx.product.findFirst({ where: { name: data.name, brand: data.brand } });
      if (exists) {
        return;
      }
      const product = await tx.product.create({
        data: {
          ...data,
          category_id: category.id,
          description: 'Produto fictício para demonstração acadêmica.',
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
  console.info('Catálogo de demonstração disponível. Produtos existentes e estoques preservados.');
}
void seed()
  .catch(() => {
    console.error('Falha no catálogo de demonstração. Confira conexão, migrations e NODE_ENV.');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
