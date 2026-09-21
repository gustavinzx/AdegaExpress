import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de produtos...');

  // 1. Garantir Categorias
  const categorias = [
    { name: 'Cervejas', description: 'Cervejas Nacionais e Importadas' },
    { name: 'Vinhos', description: 'Vinhos Nacionais e Importados' },
    { name: 'Destilados', description: 'Vodka, Whisky, Gin, etc' },
    { name: 'Não Alcoólicos', description: 'Sucos, Refrigerantes, Água, Energéticos' },
    { name: 'Tabacaria', description: 'Cigarros, Sedas, Fumo' },
    { name: 'Bomboniere', description: 'Chocolates, Salgadinhos e Doces' },
  ];

  const categoryMap = new Map();
  for (const cat of categorias) {
    let category = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!category) {
      category = await prisma.category.create({ data: cat });
    }
    categoryMap.set(cat.name, category.id);
  }

  // 2. Limpar produtos antigos para evitar duplicação em desenvolvimento (Opcional, mas seguro)
  // await prisma.orderItem.deleteMany({});
  // await prisma.stockMovement.deleteMany({});
  // await prisma.product.deleteMany({});

  // 3. Lista de Produtos Reais da Distribuidora
  const products = [
    // --- TABACARIA ---
    { cat: 'Tabacaria', name: 'Seda Trevo', price: '3.00', stock: 100 },
    { cat: 'Tabacaria', name: 'Fumo Trevo', price: '7.00', stock: 50 },
    { cat: 'Tabacaria', name: 'Fumo Maratá', price: '5.00', stock: 50 },
    { cat: 'Tabacaria', name: 'Seda La Revolucion', price: '16.00', stock: 40 },
    { cat: 'Tabacaria', name: 'Seda Papelito', price: '4.00', stock: 100 },
    { cat: 'Tabacaria', name: 'Isqueiro Bic Pequeno', price: '4.00', stock: 100 },
    { cat: 'Tabacaria', name: 'Isqueiro Bic Grande', price: '6.00', stock: 100 },
    { cat: 'Tabacaria', name: 'Seda Zomo (Verde/Marrom)', price: '5.00', stock: 80 },
    { cat: 'Tabacaria', name: 'Seda Smoking', price: '5.50', stock: 80 },
    { cat: 'Tabacaria', name: 'Tabaco Nature Picado', price: '2.00', stock: 50 },
    { cat: 'Tabacaria', name: 'Tabaco Nature Caixa', price: '13.00', stock: 20 },
    { cat: 'Tabacaria', name: 'Tabaco Selva Picado', price: '1.50', stock: 50 },
    { cat: 'Tabacaria', name: 'Tabaco Selva Caixa', price: '12.00', stock: 20 },
    
    // --- CERVEJAS UNIDADE ---
    { cat: 'Cervejas', name: 'Amstel Lata 350ml', price: '3.50', stock: 200 },
    { cat: 'Cervejas', name: 'Antarctica Original Lata 350ml', price: '5.00', stock: 150 },
    { cat: 'Cervejas', name: 'Brahma Lata 350ml', price: '4.00', stock: 300 },
    { cat: 'Cervejas', name: 'Itaipava Lata 350ml', price: '3.00', stock: 300 },
    { cat: 'Cervejas', name: 'Spaten Lata 350ml', price: '4.00', stock: 200 },
    { cat: 'Cervejas', name: 'Heineken Lata 350ml', price: '5.00', stock: 300 },
    { cat: 'Cervejas', name: 'Heineken Long Neck 330ml', price: '8.00', stock: 150 },
    { cat: 'Cervejas', name: 'Spaten Long Neck 330ml', price: '8.00', stock: 100 },
    { cat: 'Cervejas', name: 'Corona Long Neck 330ml', price: '9.00', stock: 120 },
    { cat: 'Cervejas', name: 'Stella Artois Long Neck 330ml', price: '8.00', stock: 120 },
    { cat: 'Cervejas', name: 'Heineken 0.0 Sem Álcool 330ml', price: '9.00', stock: 50 },
    { cat: 'Cervejas', name: 'Litrão Brahma 1L', price: '14.00', stock: 80 },
    
    // --- CAIXAS CERVEJAS ---
    { cat: 'Cervejas', name: 'Caixa Amstel (Pack)', price: '35.00', stock: 30 },
    { cat: 'Cervejas', name: 'Caixa Amstel Latão', price: '42.00', stock: 30 },
    { cat: 'Cervejas', name: 'Caixa Brahma', price: '45.00', stock: 50 },
    { cat: 'Cervejas', name: 'Caixa Heineken Latão', price: '65.00', stock: 40 },
    
    // --- NÃO ALCOÓLICOS ---
    { cat: 'Não Alcoólicos', name: 'Refrigerante Lata 350ml', price: '4.00', stock: 100 },
    { cat: 'Não Alcoólicos', name: 'Água Mineral Sem Gás 500ml', price: '2.50', stock: 200 },
    { cat: 'Não Alcoólicos', name: 'Água Mineral Com Gás 500ml', price: '3.00', stock: 100 },
    { cat: 'Não Alcoólicos', name: 'Coca-Cola 600ml', price: '6.00', stock: 100 },
    { cat: 'Não Alcoólicos', name: 'Coca-Cola 2L', price: '10.00', stock: 80 },
    { cat: 'Não Alcoólicos', name: 'Guaraná Antarctica 2L', price: '9.00', stock: 80 },
    { cat: 'Não Alcoólicos', name: 'Monster Energy 473ml', price: '10.00', stock: 50 },
    { cat: 'Não Alcoólicos', name: 'Red Bull Energy Drink 250ml', price: '10.00', stock: 50 },
    
    // --- DESTILADOS / OUTROS ---
    { cat: 'Destilados', name: 'Skol Beats Senses Long Neck', price: '8.00', stock: 100 },
    { cat: 'Destilados', name: 'Catuaba Selvagem Pitchulinha', price: '5.00', stock: 40 },
    { cat: 'Destilados', name: 'Coquinho Pitchulinha', price: '5.00', stock: 40 },
    
    // --- VINHOS ---
    { cat: 'Vinhos', name: 'Cantina da Serra 1.5L', price: '15.00', stock: 20 },
    { cat: 'Vinhos', name: 'Pérgola Tinto 1L', price: '30.00', stock: 30 },
    { cat: 'Vinhos', name: 'Mioranza 1L', price: '30.00', stock: 30 },
    
    // --- BOMBONIERE ---
    { cat: 'Bomboniere', name: 'Kit Kat', price: '5.50', stock: 100 },
    { cat: 'Bomboniere', name: 'Trento', price: '3.00', stock: 100 },
    { cat: 'Bomboniere', name: 'Bis Xtra', price: '5.50', stock: 50 },
    { cat: 'Bomboniere', name: 'Caixa de Bis', price: '9.00', stock: 30 },
    { cat: 'Bomboniere', name: 'Ouro Branco', price: '2.00', stock: 200 },
    { cat: 'Bomboniere', name: 'Snickers', price: '5.50', stock: 50 }
  ];

  for (const p of products) {
    const category_id = categoryMap.get(p.cat);
    
    const existing = await prisma.product.findFirst({
      where: { name: p.name, category_id }
    });
    
    if (!existing) {
      await prisma.product.create({
        data: {
          name: p.name,
          category_id,
          price: p.price,
          brand: 'Adega Express',
          volume_ml: 0,
          abv_percent: '0',
          stock_quantity: p.stock,
          active: true
        }
      });
      console.log(`+ ${p.name}`);
    }
  }

  console.log('Seed de produtos finalizado.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
