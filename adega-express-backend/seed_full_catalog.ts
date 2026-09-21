import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando inclusão do catálogo completo enviado...');

  // 1. Garantir que as categorias existem
  const catTabacaria = await prisma.category.upsert({
    where: { name: 'Tabacaria' },
    update: {},
    create: { name: 'Tabacaria', description: 'Fumos, sedas, isqueiros e materiais' }
  });

  const catCervejas = await prisma.category.upsert({
    where: { name: 'Cervejas' },
    update: {},
    create: { name: 'Cervejas', description: 'Cervejas em lata, long neck e litrão' }
  });

  const itemsTabacaria = [
    { name: 'Fumo Trevo', price: 7.00 },
    { name: 'Fumo Maratá', price: 5.00 }, // ? no original
    { name: 'Papel do Trevo', price: 3.00 },
    { name: 'Fumo Super Bom', price: 5.00 }, // ?? no original
    { name: 'Seda La Revolucion', price: 16.00 },
    { name: 'Seda Papelito', price: 4.00 },
    { name: 'Isqueiro Pequeno', price: 4.00 },
    { name: 'Isqueiro Grande', price: 6.00 },
    { name: 'Caixinha de Seda Zomo Verde/Marrom', price: 5.00 },
    { name: 'Seda Smoking', price: 5.50 },
    { name: 'Tabaco Nature Picado', price: 2.00 },
    { name: 'Caixa do Tabaco Nature', price: 13.00 },
    { name: 'Tabaco Selva Picado', price: 1.50 },
    { name: 'Caixa do Tabaco Selva', price: 12.00 },
    { name: 'Caixa Tabaco Selva Ice', price: 16.00 },
    { name: 'Tabaco Grande', price: 1.00 },
    { name: 'Tabaco Ice Grande', price: 1.50 },
  ];

  const itemsCervejas = [
    // Unidades / Latas 350ml
    { name: 'Amstel Lata 350ml', price: 3.50 },
    { name: 'Antarctica Lata 350ml', price: 3.50 },
    { name: 'Antarctica Original Lata 350ml', price: 5.00 },
    { name: 'Brahma Lata 350ml', price: 4.00 },
    { name: 'Itaipava Lata 350ml', price: 3.00 },
    { name: 'Spaten Lata 350ml', price: 4.00 },
    { name: 'Heineken Lata 350ml', price: 5.00 },
    { name: 'Kaiser Lata 350ml', price: 3.50 },
    
    // 330ml Garrafa de Vidro (Long Neck)
    { name: 'Heineken Garrafa 330ml', price: 8.00 },
    { name: 'Spaten Garrafa 330ml', price: 8.00 },
    { name: 'Eisenbahn Garrafa 330ml', price: 7.00 },
    { name: 'Corona Garrafa 330ml', price: 9.00 },
    { name: 'Stella Artois Garrafa 330ml', price: 8.00 },
    { name: 'Budweiser Garrafa 330ml', price: 8.00 },

    // Sem Glúten
    { name: 'Stella Gold (Sem Glúten)', price: 9.00 },
    { name: 'Michelob Ultra (Sem Glúten)', price: 9.00 }, // Presumo que Michelloti era Michelob

    // Sem Álcool
    { name: 'Heineken Zero (Sem Álcool)', price: 9.00 },
    { name: 'Corona Zero (Sem Álcool)', price: 9.00 },

    // Shots
    { name: 'Shot Heineken', price: 6.00 },
    { name: 'Shot Corona', price: 6.00 },

    // Litrões
    { name: 'Brahma Litrão 1L', price: 14.00 },
    { name: 'Antarctica Litrão 1L', price: 14.00 },
  ];

  for (const item of itemsTabacaria) {
    const exists = await prisma.product.findFirst({ where: { name: item.name } });
    if (!exists) {
      await prisma.product.create({
        data: {
          name: item.name,
          category_id: catTabacaria.id,
          price: item.price,
          brand: 'Adega Express',
          volume_ml: 0,
          abv_percent: 0,
          stock_quantity: 100,
          active: true
        }
      });
      console.log(`Criado Tabacaria: ${item.name} - R$ ${item.price}`);
    } else {
        await prisma.product.update({
            where: { id: exists.id },
            data: { price: item.price }
        });
    }
  }

  for (const item of itemsCervejas) {
    const exists = await prisma.product.findFirst({ where: { name: item.name } });
    if (!exists) {
      await prisma.product.create({
        data: {
          name: item.name,
          category_id: catCervejas.id,
          price: item.price,
          brand: 'Diversas',
          volume_ml: item.name.includes('350ml') ? 350 : item.name.includes('330ml') ? 330 : item.name.includes('Litrão') ? 1000 : 0,
          abv_percent: 5.0,
          stock_quantity: 100,
          active: true
        }
      });
      console.log(`Criado Cerveja: ${item.name} - R$ ${item.price}`);
    } else {
        await prisma.product.update({
            where: { id: exists.id },
            data: { price: item.price }
        });
    }
  }

  console.log('Todos os itens solicitados foram inseridos ou atualizados no catálogo!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
