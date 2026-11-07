import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando atualização do catálogo demonstrativo de bebidas não alcoólicas...');

  // Desativar categorias e produtos antigos fora do escopo, preservando histórico
  await prisma.category.updateMany({
    where: { name: { notIn: ['Água', 'Sucos', 'Refrigerantes', 'Chás'] } },
    data: { active: false },
  });

  await prisma.product.updateMany({
    where: { abv_percent: { gt: 0 } },
    data: { active: false },
  });

  const categoriesData = [
    { name: 'Água', description: 'Águas minerais naturais, com gás e saborizadas' },
    { name: 'Sucos', description: 'Sucos integrais, néctares e bebidas de frutas naturais' },
    { name: 'Refrigerantes', description: 'Refrigerantes tradicionais, zero açúcar e tônicas' },
    { name: 'Chás', description: 'Chás gelados prontos para beber e infusões naturais' },
  ];

  const categoryMap = new Map<string, number>();
  for (const cat of categoriesData) {
    const saved = await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description, active: true },
      create: { name: cat.name, description: cat.description, active: true },
    });
    categoryMap.set(cat.name, saved.id);
  }

  const catalogItems = [
    // Água
    {
      cat: 'Água',
      name: 'Água Mineral Sem Gás 500ml',
      brand: 'Minalba',
      price: '2.50',
      volume_ml: 500,
      stock: 150,
      description: 'Água mineral natural sem gás em garrafa individual de 500ml.',
    },
    {
      cat: 'Água',
      name: 'Água Mineral Com Gás 500ml',
      brand: 'Minalba',
      price: '3.00',
      volume_ml: 500,
      stock: 120,
      description: 'Água mineral natural gaseificada refrescante de 500ml.',
    },
    {
      cat: 'Água',
      name: 'Água Mineral Sem Gás 1,5L',
      brand: 'Bonafont',
      price: '4.50',
      volume_ml: 1500,
      stock: 80,
      description: 'Garrafa familiar de água mineral leve sem gás 1,5 litro.',
    },
    {
      cat: 'Água',
      name: 'Água Tônica Tradicional Lata 350ml',
      brand: 'Antarctica',
      price: '4.50',
      volume_ml: 350,
      stock: 60,
      description: 'Água tônica gaseificada não alcoólica com quinino.',
    },

    // Sucos
    {
      cat: 'Sucos',
      name: 'Suco Integral de Uva Tinto 1L',
      brand: 'Aurora',
      price: '16.90',
      volume_ml: 1000,
      stock: 45,
      description: 'Suco 100% uva integral sem adição de açúcares ou conservantes.',
    },
    {
      cat: 'Sucos',
      name: 'Suco Integral de Laranja 1L',
      brand: 'Natural One',
      price: '14.50',
      volume_ml: 1000,
      stock: 50,
      description: 'Suco de laranja 100% natural espremido e pasteurizado.',
    },
    {
      cat: 'Sucos',
      name: 'Néctar de Pêssego 1L',
      brand: 'Del Valle',
      price: '8.50',
      volume_ml: 1000,
      stock: 65,
      description: 'Bebida de fruta sabor pêssego pronta para consumo.',
    },
    {
      cat: 'Sucos',
      name: 'Suco de Maçã Integral 300ml',
      brand: 'Natural One',
      price: '6.00',
      volume_ml: 300,
      stock: 40,
      description: 'Suco 100% maçã sem adição de açúcar em embalagem individual.',
    },

    // Refrigerantes
    {
      cat: 'Refrigerantes',
      name: 'Coca-Cola Original Lata 350ml',
      brand: 'Coca-Cola',
      price: '4.50',
      volume_ml: 350,
      stock: 200,
      description: 'Refrigerante de cola tradicional em lata de 350ml.',
    },
    {
      cat: 'Refrigerantes',
      name: 'Coca-Cola Original PET 2L',
      brand: 'Coca-Cola',
      price: '11.00',
      volume_ml: 2000,
      stock: 90,
      description: 'Refrigerante de cola tradicional em embalagem familiar de 2 litros.',
    },
    {
      cat: 'Refrigerantes',
      name: 'Guaraná Antarctica Lata 350ml',
      brand: 'Antarctica',
      price: '4.00',
      volume_ml: 350,
      stock: 180,
      description: 'O autêntico refrigerante de guaraná brasileiro em lata de 350ml.',
    },
    {
      cat: 'Refrigerantes',
      name: 'Guaraná Antarctica PET 2L',
      brand: 'Antarctica',
      price: '9.50',
      volume_ml: 2000,
      stock: 75,
      description: 'Refrigerante de guaraná em garrafa de 2 litros.',
    },
    {
      cat: 'Refrigerantes',
      name: 'Sprite Limão Sem Açúcar Lata 350ml',
      brand: 'Sprite',
      price: '4.20',
      volume_ml: 350,
      stock: 0,
      description: 'Refrigerante sabor limão zero açúcar (item demonstrativo sem estoque).',
    },

    // Chás
    {
      cat: 'Chás',
      name: 'Chá Mate Tostado Com Limão 450ml',
      brand: 'Matte Leão',
      price: '5.50',
      volume_ml: 450,
      stock: 70,
      description: 'Chá mate natural com toque de limão, pronto para beber.',
    },
    {
      cat: 'Chás',
      name: 'Chá Preto Gelado Sabor Pêssego 1,5L',
      brand: 'Fuze Tea',
      price: '9.90',
      volume_ml: 1500,
      stock: 40,
      description: 'Chá preto gelado sabor pêssego em garrafa de 1,5 litro.',
    },
    {
      cat: 'Chás',
      name: 'Chá Verde Com Hortelã e Limão Lata 290ml',
      brand: 'Feel Good',
      price: '6.50',
      volume_ml: 290,
      stock: 55,
      description: 'Chá verde zero calorias rico em antioxidantes.',
    },
  ];

  for (const item of catalogItems) {
    const category_id = categoryMap.get(item.cat)!;
    const exists = await prisma.product.findFirst({
      where: { name: item.name, brand: item.brand },
    });
    if (!exists) {
      await prisma.product.create({
        data: {
          name: item.name,
          brand: item.brand,
          category_id,
          price: item.price,
          volume_ml: item.volume_ml,
          abv_percent: 0,
          stock_quantity: item.stock,
          description: item.description,
          active: true,
        },
      });
      console.log(`Criado: ${item.name} (${item.cat})`);
    } else {
      await prisma.product.update({
        where: { id: exists.id },
        data: {
          category_id,
          price: item.price,
          volume_ml: item.volume_ml,
          abv_percent: 0,
          description: item.description,
          active: true,
        },
      });
    }
  }

  // Contas de demonstração para todos os perfis (Admin, Atendente, Entregador e Cliente)
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const demoUsers = [
    {
      name: 'Administrador Adega Express',
      email: 'admin@adegaexpress.com',
      role: 'ADMINISTRADOR' as const,
    },
    {
      name: 'Atendente Adega Express',
      email: 'atendente@adegaexpress.com',
      role: 'ATENDENTE' as const,
    },
    {
      name: 'Entregador Adega Express',
      email: 'entregador@adegaexpress.com',
      role: 'ENTREGADOR' as const,
    },
    {
      name: 'Cliente Demonstração',
      email: 'cliente@adegaexpress.com',
      role: 'CLIENTE' as const,
    },
  ];

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, active: true, password_hash: passwordHash },
      create: {
        name: u.name,
        email: u.email,
        role: u.role,
        active: true,
        password_hash: passwordHash,
      },
    });
  }

  console.log('Catálogo não alcoólico e contas de demonstração atualizados com sucesso!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
