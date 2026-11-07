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

  const userMap = new Map<string, number>();
  for (const u of demoUsers) {
    const saved = await prisma.user.upsert({
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
    userMap.set(u.email, saved.id);
  }

  const adminId = userMap.get('admin@adegaexpress.com')!;
  const attendantId = userMap.get('atendente@adegaexpress.com')!;
  const delivererId = userMap.get('entregador@adegaexpress.com')!;
  const clientId = userMap.get('cliente@adegaexpress.com')!;

  const catalogItems = [
    // Água (inclui 1 item com stock 0 "Em Falta" na primeira fileira para o print T01_catalogo)
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
      stock: 0,
      description: 'Água tônica gaseificada não alcoólica com quinino (item demonstrativo em falta).',
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

  const productIds: number[] = [];
  for (const item of catalogItems) {
    const category_id = categoryMap.get(item.cat)!;
    const exists = await prisma.product.findFirst({
      where: { name: item.name, brand: item.brand },
    });
    let prodId: number;
    if (!exists) {
      const created = await prisma.product.create({
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
      prodId = created.id;
    } else {
      await prisma.product.update({
        where: { id: exists.id },
        data: {
          category_id,
          price: item.price,
          volume_ml: item.volume_ml,
          abv_percent: 0,
          stock_quantity: item.name === 'Água Tônica Tradicional Lata 350ml' ? 0 : undefined,
          description: item.description,
          active: true,
        },
      });
      prodId = exists.id;
    }
    productIds.push(prodId);

    // Garantir movimentações com motivo para o print T13_admin_estoque
    const movCount = await prisma.stockMovement.count({ where: { product_id: prodId } });
    if (movCount === 0 && item.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          product_id: prodId,
          type: 'ENTRADA',
          quantity: item.stock,
          reason: 'Reposição inicial de fornecedor (lote demonstrativo)',
          actor_id: adminId,
        },
      });
    }
  }

  // Cupons promocionais ativos para o print T06_checkout
  const couponsData = [
    {
      code: 'BEMVINDO10',
      discount_type: 'PERCENTUAL' as const,
      discount_value: '10.00',
      valid_from: new Date('2025-01-01T00:00:00.000Z'),
      valid_until: new Date('2028-12-31T23:59:59.000Z'),
      active: true,
    },
    {
      code: 'ADEGA5',
      discount_type: 'FIXO' as const,
      discount_value: '5.00',
      valid_from: new Date('2025-01-01T00:00:00.000Z'),
      valid_until: new Date('2028-12-31T23:59:59.000Z'),
      active: true,
    },
  ];

  let couponId: number | null = null;
  for (const cp of couponsData) {
    const savedCp = await prisma.coupon.upsert({
      where: { code: cp.code },
      update: {
        discount_type: cp.discount_type,
        discount_value: cp.discount_value,
        valid_from: cp.valid_from,
        valid_until: cp.valid_until,
        active: true,
      },
      create: cp,
    });
    if (cp.code === 'BEMVINDO10') couponId = savedCp.id;
  }

  // Endereço fictício padrão para a conta cliente@adegaexpress.com (T06_checkout e T07_enderecos)
  let defaultAddr = await prisma.address.findFirst({
    where: { user_id: clientId, archived: false },
  });
  if (!defaultAddr) {
    defaultAddr = await prisma.address.create({
      data: {
        user_id: clientId,
        zip: '01310-200',
        street: 'Avenida Paulista',
        number: '1578',
        complement: 'Apto 42 - Bloco B',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        is_default: true,
      },
    });
  }

  const addressSnapshot = {
    street: defaultAddr.street,
    number: defaultAddr.number,
    complement: defaultAddr.complement,
    neighborhood: defaultAddr.neighborhood,
    city: defaultAddr.city,
    state: defaultAddr.state,
    zip: defaultAddr.zip,
  };

  // Pedidos demonstrativos cobrindo todos os status para T08, T09, T10, T11, T14 e T15
  const existingClientOrders = await prisma.order.count({ where: { user_id: clientId } });
  if (existingClientOrders === 0 && productIds.length >= 6) {
    const now = Date.now();

    // 1. Pedido ENTREGUE (com cupom, pagamento confirmado e histórico completo de 5 etapas -> T14 e T15)
    const ordEntregue = await prisma.order.create({
      data: {
        user_id: clientId,
        address_id: defaultAddr.id,
        status: 'ENTREGUE',
        payment_method: 'PIX',
        payment_status: 'PAGO',
        paid_at: new Date(now - 3600_000 * 3),
        coupon_id: couponId,
        subtotal: '38.80',
        discount: '3.88',
        shipping_fee: '7.90',
        total: '42.82',
        address_snapshot: addressSnapshot,
        items: {
          create: [
            {
              product_id: productIds[4],
              product_name: 'Suco Integral de Uva Tinto 1L',
              quantity: 2,
              unit_price: '16.90',
            },
            {
              product_id: productIds[0],
              product_name: 'Água Mineral Sem Gás 500ml',
              quantity: 2,
              unit_price: '2.50',
            },
          ],
        },
        payments: {
          create: [
            {
              status: 'PAGO',
              actor_id: attendantId,
              reference: 'PIX demonstrativo conferido pelo Atendente #01',
            },
          ],
        },
        delivery: {
          create: {
            deliverer_id: delivererId,
            status: 'ENTREGUE',
          },
        },
        history: {
          create: [
            {
              status: 'PENDENTE',
              actor_id: clientId,
              reason: 'Pedido criado pelo cliente no checkout demonstrativo.',
              created_at: new Date(now - 3600_000 * 4),
            },
            {
              status: 'CONFIRMADO',
              actor_id: attendantId,
              reason: 'Pagamento demonstrativo PIX confirmado pela operação.',
              created_at: new Date(now - 3600_000 * 3),
            },
            {
              status: 'SEPARADO',
              actor_id: attendantId,
              reason: 'Itens separados e conferidos no estoque.',
              created_at: new Date(now - 3600_000 * 2),
            },
            {
              status: 'EM_ROTA',
              actor_id: delivererId,
              reason: 'Entregador iniciou o deslocamento para o endereço.',
              created_at: new Date(now - 3600_000 * 1),
            },
            {
              status: 'ENTREGUE',
              actor_id: delivererId,
              reason: 'Entrega concluída no endereço do cliente.',
              created_at: new Date(now - 1800_000),
            },
          ],
        },
      },
    });

    // 2. Pedido EM_ROTA (atribuído ao Entregador para T10_entregador e T08_meus_pedidos)
    await prisma.order.create({
      data: {
        user_id: clientId,
        address_id: defaultAddr.id,
        status: 'EM_ROTA',
        payment_method: 'CARTAO',
        payment_status: 'PAGO',
        paid_at: new Date(now - 1800_000),
        subtotal: '29.00',
        discount: '0.00',
        shipping_fee: '7.90',
        total: '36.90',
        address_snapshot: addressSnapshot,
        items: {
          create: [
            {
              product_id: productIds[5],
              product_name: 'Suco Integral de Laranja 1L',
              quantity: 2,
              unit_price: '14.50',
            },
          ],
        },
        payments: {
          create: [
            {
              status: 'PAGO',
              actor_id: adminId,
              reference: 'Cartão demonstrativo confirmado pela administração',
            },
          ],
        },
        delivery: {
          create: {
            deliverer_id: delivererId,
            status: 'SAIU_PARA_ENTREGA',
          },
        },
        history: {
          create: [
            {
              status: 'PENDENTE',
              actor_id: clientId,
              reason: 'Pedido criado no checkout demonstrativo.',
              created_at: new Date(now - 2400_000),
            },
            {
              status: 'CONFIRMADO',
              actor_id: adminId,
              reason: 'Pagamento demonstrativo confirmado.',
              created_at: new Date(now - 1800_000),
            },
            {
              status: 'SEPARADO',
              actor_id: adminId,
              reason: 'Pedido separado e atribuído ao entregador.',
              created_at: new Date(now - 1200_000),
            },
            {
              status: 'EM_ROTA',
              actor_id: delivererId,
              reason: 'Saída para entrega registrada pelo entregador.',
              created_at: new Date(now - 600_000),
            },
          ],
        },
      },
    });

    // 3. Pedido SEPARADO com entrega AGUARDANDO atribuída ao Entregador (para T10_entregador)
    await prisma.order.create({
      data: {
        user_id: clientId,
        address_id: defaultAddr.id,
        status: 'SEPARADO',
        payment_method: 'PIX',
        payment_status: 'PAGO',
        paid_at: new Date(now - 900_000),
        subtotal: '22.00',
        discount: '0.00',
        shipping_fee: '7.90',
        total: '29.90',
        address_snapshot: addressSnapshot,
        items: {
          create: [
            {
              product_id: productIds[9],
              product_name: 'Coca-Cola Original PET 2L',
              quantity: 2,
              unit_price: '11.00',
            },
          ],
        },
        payments: {
          create: [
            {
              status: 'PAGO',
              actor_id: attendantId,
              reference: 'Confirmação manual PIX #03',
            },
          ],
        },
        delivery: {
          create: {
            deliverer_id: delivererId,
            status: 'AGUARDANDO',
          },
        },
        history: {
          create: [
            {
              status: 'PENDENTE',
              actor_id: clientId,
              reason: 'Pedido criado pelo cliente.',
            },
            {
              status: 'CONFIRMADO',
              actor_id: attendantId,
              reason: 'Pagamento demonstrativo confirmado.',
            },
            {
              status: 'SEPARADO',
              actor_id: attendantId,
              reason: 'Aguardando retirada pelo entregador.',
            },
          ],
        },
      },
    });

    // 4. Pedido CONFIRMADO (para T08_meus_pedidos e T11_admin_pedidos)
    await prisma.order.create({
      data: {
        user_id: clientId,
        address_id: defaultAddr.id,
        status: 'CONFIRMADO',
        payment_method: 'PIX',
        payment_status: 'PAGO',
        paid_at: new Date(now - 300_000),
        subtotal: '19.80',
        discount: '0.00',
        shipping_fee: '7.90',
        total: '27.70',
        address_snapshot: addressSnapshot,
        items: {
          create: [
            {
              product_id: productIds[14],
              product_name: 'Chá Preto Gelado Sabor Pêssego 1,5L',
              quantity: 2,
              unit_price: '9.90',
            },
          ],
        },
        payments: {
          create: [
            {
              status: 'PAGO',
              actor_id: attendantId,
              reference: 'PIX demonstrativo confirmado pelo atendente',
            },
          ],
        },
        history: {
          create: [
            {
              status: 'PENDENTE',
              actor_id: clientId,
              reason: 'Pedido registrado no checkout demonstrativo.',
            },
            {
              status: 'CONFIRMADO',
              actor_id: attendantId,
              reason: 'Pagamento demonstrativo validado.',
            },
          ],
        },
      },
    });

    // 5. Pedido PENDENTE (recém-criado para T09_atendente confirmar pagamento!)
    await prisma.order.create({
      data: {
        user_id: clientId,
        address_id: defaultAddr.id,
        status: 'PENDENTE',
        payment_method: 'PIX',
        payment_status: 'PENDENTE',
        subtotal: '16.50',
        discount: '0.00',
        shipping_fee: '7.90',
        total: '24.40',
        address_snapshot: addressSnapshot,
        items: {
          create: [
            {
              product_id: productIds[13],
              product_name: 'Chá Mate Tostado Com Limão 450ml',
              quantity: 3,
              unit_price: '5.50',
            },
          ],
        },
        history: {
          create: [
            {
              status: 'PENDENTE',
              actor_id: clientId,
              reason: 'Pedido aguardando confirmação manual do pagamento demonstrativo.',
            },
          ],
        },
      },
    });

    // 6. Pedido CANCELADO (para T08_meus_pedidos mostrar também CANCELADO)
    await prisma.order.create({
      data: {
        user_id: clientId,
        address_id: defaultAddr.id,
        status: 'CANCELADO',
        payment_method: 'CARTAO',
        payment_status: 'PENDENTE',
        cancellation_reason: 'Cancelado a pedido do cliente (estoque devolvido automaticamente — RN07).',
        subtotal: '12.00',
        discount: '0.00',
        shipping_fee: '7.90',
        total: '19.90',
        address_snapshot: addressSnapshot,
        items: {
          create: [
            {
              product_id: productIds[7],
              product_name: 'Suco de Maçã Integral 300ml',
              quantity: 2,
              unit_price: '6.00',
            },
          ],
        },
        history: {
          create: [
            {
              status: 'PENDENTE',
              actor_id: clientId,
              reason: 'Pedido criado no checkout demonstrativo.',
            },
            {
              status: 'CANCELADO',
              actor_id: clientId,
              reason: 'Cancelado a pedido do cliente (estoque devolvido automaticamente — RN07).',
            },
          ],
        },
      },
    });

    console.log(`Pedidos demonstrativos criados (incluindo Pedido #${ordEntregue.id} completo)!`);
  }

  console.log('Catálogo não alcoólico, cupons, endereço padrão, movimentações e pedidos prontos!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
