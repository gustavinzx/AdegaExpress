import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient, Role, OrderStatus, PaymentMethod, PaymentStatus, DeliveryStatus, StockMovementType, DiscountType } from '@prisma/client';

if (!process.argv.includes('--confirm')) {
  console.error('========================================================================');
  console.error('ATENÇÃO: Operação de seed de demonstração.');
  console.error('Para confirmar a limpeza e população dos dados demonstrativos, execute:');
  console.error('  npm run seed:demo -- --confirm');
  console.error('========================================================================');
  process.exit(1);
}

const db = new PrismaClient({ log: [] });

async function seedDemo() {
  console.info('--> Iniciando seed de demonstração limpo e consistente...');

  // 1. Limpar dados anteriores de forma relacional segura
  console.info('--> Limpando pedidos, movimentações e catálogo antigos...');
  await db.paymentRecord.deleteMany({});
  await db.orderHistory.deleteMany({});
  await db.delivery.deleteMany({});
  await db.orderItem.deleteMany({});
  await db.order.deleteMany({});
  await db.stockMovement.deleteMany({});
  await db.product.deleteMany({});
  await db.coupon.deleteMany({});
  await db.category.deleteMany({});
  await db.address.deleteMany({});

  // Remover usuários exceto os 4 principais (se existirem)
  const officialEmails = [
    'admin@adegaexpress.com',
    'atendente@adegaexpress.com',
    'entregador@adegaexpress.com',
    'cliente@adegaexpress.com',
  ];
  await db.user.deleteMany({
    where: { email: { notIn: officialEmails } },
  });

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  // 2. Criar / Atualizar os 4 Usuários Oficiais
  console.info('--> Criando 4 contas oficiais (senha Admin@123)...');
  const admin = await db.user.upsert({
    where: { email: 'admin@adegaexpress.com' },
    create: {
      name: 'Administrador Adega Express',
      email: 'admin@adegaexpress.com',
      password_hash: passwordHash,
      role: Role.ADMINISTRADOR,
      active: true,
    },
    update: {
      name: 'Administrador Adega Express',
      password_hash: passwordHash,
      role: Role.ADMINISTRADOR,
      active: true,
      token_version: { increment: 1 },
    },
  });

  const atendente = await db.user.upsert({
    where: { email: 'atendente@adegaexpress.com' },
    create: {
      name: 'Atendente Adega Express',
      email: 'atendente@adegaexpress.com',
      password_hash: passwordHash,
      role: Role.ATENDENTE,
      active: true,
    },
    update: {
      name: 'Atendente Adega Express',
      password_hash: passwordHash,
      role: Role.ATENDENTE,
      active: true,
      token_version: { increment: 1 },
    },
  });

  const entregador = await db.user.upsert({
    where: { email: 'entregador@adegaexpress.com' },
    create: {
      name: 'Entregador Adega Express',
      email: 'entregador@adegaexpress.com',
      password_hash: passwordHash,
      role: Role.ENTREGADOR,
      active: true,
    },
    update: {
      name: 'Entregador Adega Express',
      password_hash: passwordHash,
      role: Role.ENTREGADOR,
      active: true,
      token_version: { increment: 1 },
    },
  });

  const cliente = await db.user.upsert({
    where: { email: 'cliente@adegaexpress.com' },
    create: {
      name: 'Cliente Adega Express',
      email: 'cliente@adegaexpress.com',
      cpf: '123.456.789-00',
      password_hash: passwordHash,
      role: Role.CLIENTE,
      birth_date: new Date('1995-05-15T00:00:00.000Z'),
      active: true,
    },
    update: {
      name: 'Cliente Adega Express',
      password_hash: passwordHash,
      role: Role.CLIENTE,
      active: true,
      token_version: { increment: 1 },
    },
  });

  // 3. Endereços 100% Fictícios do Cliente
  console.info('--> Cadastrando endereços fictícios do cliente...');
  const addrBrasilia = await db.address.create({
    data: {
      user_id: cliente.id,
      street: 'Rua das Palmeiras',
      number: '123',
      complement: 'Bloco B, Sala 4',
      neighborhood: 'Asa Sul',
      city: 'Brasília',
      state: 'DF',
      zip: '70000-000',
      is_default: true,
      archived: false,
    },
  });

  const addrSaoPaulo = await db.address.create({
    data: {
      user_id: cliente.id,
      street: 'Rua das Acácias',
      number: '45',
      complement: 'Apto 12',
      neighborhood: 'Jardim Primavera',
      city: 'São Paulo',
      state: 'SP',
      zip: '01000-000',
      is_default: false,
      archived: false,
    },
  });

  // 4. Categorias Oficiais Permitidas
  console.info('--> Cadastrando 4 categorias oficiais permitidas...');
  const catAgua = await db.category.create({
    data: {
      name: 'Água',
      description: 'Águas minerais de fontes naturais puras, com e sem gás.',
      active: true,
    },
  });

  const catSucos = await db.category.create({
    data: {
      name: 'Sucos',
      description: 'Sucos 100% integrais prensados a frio, sem adição de açúcares.',
      active: true,
    },
  });

  const catRefrigerantes = await db.category.create({
    data: {
      name: 'Refrigerantes',
      description: 'Refrigerantes artesanais e clássicos com zero teor alcoólico.',
      active: true,
    },
  });

  const catChas = await db.category.create({
    data: {
      name: 'Chás',
      description: 'Infusões botânicas e chás gelados refrescantes prontos para consumo.',
      active: true,
    },
  });

  // 5. Catálogo de Produtos Limpos (Sem palavra "Demonstração")
  console.info('--> Cadastrando produtos nas 4 categorias (com 2 itens estoque zero)...');
  const productsData = [
    // Água
    {
      category_id: catAgua.id,
      name: 'Água Mineral Sem Gás 500ml',
      brand: 'Minalba',
      price: '3.50',
      volume_ml: 500,
      abv_percent: '0.00',
      stock_quantity: 80,
      description: 'Água mineral natural pura de fonte montanhosa, embalagem 500ml prática.',
    },
    {
      category_id: catAgua.id,
      name: 'Água Mineral Com Gás 500ml',
      brand: 'São Lourenço',
      price: '4.20',
      volume_ml: 500,
      abv_percent: '0.00',
      stock_quantity: 65,
      description: 'Água mineral naturalmente gaseificada com borbulhas finas e equilíbrio mineral.',
    },
    {
      category_id: catAgua.id,
      name: 'Água Mineral Premium Sem Gás 1,5L',
      brand: 'Prata',
      price: '7.80',
      volume_ml: 1500,
      abv_percent: '0.00',
      stock_quantity: 40,
      description: 'Embalagem familiar de 1,5L com baixa mineralidade ideal para a mesa diária.',
    },
    {
      category_id: catAgua.id,
      name: 'Água Tônica Citrus Sem Açúcar 350ml',
      brand: 'Antarctica',
      price: '5.90',
      volume_ml: 350,
      abv_percent: '0.00',
      stock_quantity: 0, // ESTOQUE ZERO (Em Falta)
      description: 'Refrigerante de água tônica com quinino e toques cítricos, zero açúcar.',
    },

    // Sucos
    {
      category_id: catSucos.id,
      name: 'Suco Integral de Uva Tinto 1L',
      brand: 'Aurora',
      price: '16.90',
      volume_ml: 1000,
      abv_percent: '0.00',
      stock_quantity: 35,
      description: 'Suco de uva integral 100% fruta, sem conservantes e rico em polifenóis.',
    },
    {
      category_id: catSucos.id,
      name: 'Suco de Laranja Integral 900ml',
      brand: 'Natural One',
      price: '13.50',
      volume_ml: 900,
      abv_percent: '0.00',
      stock_quantity: 50,
      description: 'Laranja fresca espremida a frio, sabor doce natural e alto teor de Vitamina C.',
    },
    {
      category_id: catSucos.id,
      name: 'Suco de Maçã Integral 1L',
      brand: 'Campo Largo',
      price: '14.20',
      volume_ml: 1000,
      abv_percent: '0.00',
      stock_quantity: 28,
      description: 'Suco de maçã clarificado 100% puro, sabor suave e equilibrado.',
    },
    {
      category_id: catSucos.id,
      name: 'Néctar de Maracujá 1L',
      brand: 'Maguary',
      price: '9.90',
      volume_ml: 1000,
      abv_percent: '0.00',
      stock_quantity: 30,
      description: 'Polpa selecionada de maracujá, sabor marcante e refrescância cítrica.',
    },

    // Refrigerantes
    {
      category_id: catRefrigerantes.id,
      name: 'Refrigerante Guaraná Antarctica 350ml',
      brand: 'Antarctica',
      price: '4.80',
      volume_ml: 350,
      abv_percent: '0.00',
      stock_quantity: 90,
      description: 'O clássico refrigerante nacional produzido com sementes legítimas de guaraná da Amazônia.',
    },
    {
      category_id: catRefrigerantes.id,
      name: 'Coca-Cola Original 350ml Lata',
      brand: 'Coca-Cola',
      price: '5.20',
      volume_ml: 350,
      abv_percent: '0.00',
      stock_quantity: 120,
      description: 'Refrigerante de cola tradicional em lata de 350ml gelada.',
    },
    {
      category_id: catRefrigerantes.id,
      name: 'Refrigerante Sprite Lemon Fresh 500ml',
      brand: 'Sprite',
      price: '5.80',
      volume_ml: 500,
      abv_percent: '0.00',
      stock_quantity: 45,
      description: 'Levemente gaseificada com suco de limão natural, refrescância instantânea.',
    },
    {
      category_id: catRefrigerantes.id,
      name: 'Refrigerante de Gengibre Ginger Ale 350ml',
      brand: 'London Essence',
      price: '8.90',
      volume_ml: 350,
      abv_percent: '0.00',
      stock_quantity: 25,
      description: 'Mixer e refrigerante botânico de gengibre aromático e toques cítricos.',
    },

    // Chás
    {
      category_id: catChas.id,
      name: 'Chá Gelado Matte Limão 1,5L',
      brand: 'Matte Leão',
      price: '8.50',
      volume_ml: 1500,
      abv_percent: '0.00',
      stock_quantity: 40,
      description: 'Tostado de erva-mate enriquecido com suco de limão natural, formato 1,5L.',
    },
    {
      category_id: catChas.id,
      name: 'Chá Gelado de Pêssego 450ml',
      brand: 'Fuze Tea',
      price: '5.50',
      volume_ml: 450,
      abv_percent: '0.00',
      stock_quantity: 55,
      description: 'Folhas de chá preto infusionadas com sabor envolvente de pêssego.',
    },
    {
      category_id: catChas.id,
      name: 'Chá Verde com Limão e Hortelã 1L',
      brand: 'Feel Good',
      price: '9.20',
      volume_ml: 1000,
      abv_percent: '0.00',
      stock_quantity: 32,
      description: 'Chá verde antioxidante aromatizado com limão e hortelã fresca, zero calorias.',
    },
    {
      category_id: catChas.id,
      name: 'Infusão Hibisco com Cranberry 450ml',
      brand: 'Wewi',
      price: '8.90',
      volume_ml: 450,
      abv_percent: '0.00',
      stock_quantity: 0, // ESTOQUE ZERO (Em Falta)
      description: 'Infusão orgânica botânica de flores de hibisco com notas de frutas vermelhas.',
    },
  ];

  const createdProducts = [];
  for (const pData of productsData) {
    const product = await db.product.create({
      data: {
        ...pData,
        active: true,
      },
    });
    createdProducts.push(product);

    if (pData.stock_quantity > 0) {
      await db.stockMovement.create({
        data: {
          product_id: product.id,
          type: StockMovementType.ENTRADA,
          quantity: pData.stock_quantity,
          reason: 'Lote de estoque inicial de abastecimento',
          actor_id: admin.id,
        },
      });
    }
  }

  // 6. Cupons de Desconto
  console.info('--> Cadastrando cupons (válidos, expirado e inativo)...');
  const now = new Date();
  const past30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const future60 = new Date(now.getTime() + 60 * 24 * 3600 * 1000);
  const past60 = new Date(now.getTime() - 60 * 24 * 3600 * 1000);
  const past10 = new Date(now.getTime() - 10 * 24 * 3600 * 1000);

  const couponBemVindo = await db.coupon.create({
    data: {
      code: 'BEMVINDO10',
      discount_type: DiscountType.PERCENTUAL,
      discount_value: '10.00',
      valid_from: past30,
      valid_until: future60,
      active: true,
    },
  });

  const couponAdega5 = await db.coupon.create({
    data: {
      code: 'ADEGA5',
      discount_type: DiscountType.FIXO,
      discount_value: '5.00',
      valid_from: past30,
      valid_until: future60,
      active: true,
    },
  });

  await db.coupon.create({
    data: {
      code: 'EXPIRADO20',
      discount_type: DiscountType.PERCENTUAL,
      discount_value: '20.00',
      valid_from: past60,
      valid_until: past10,
      active: true,
    },
  });

  await db.coupon.create({
    data: {
      code: 'INATIVO10',
      discount_type: DiscountType.PERCENTUAL,
      discount_value: '10.00',
      valid_from: past30,
      valid_until: future60,
      active: false,
    },
  });

  // 7. Pedidos em TODOS os status nos últimos 30 dias
  console.info('--> Gerando pedidos demonstrativos em todos os status...');
  const shippingFee = '7.90';

  // Helper para datas
  const daysAgo = (days: number, hours = 0) =>
    new Date(now.getTime() - (days * 24 * 3600 + hours * 3600) * 1000);

  // Pedido 1: ENTREGUE (18 dias atrás, pago com Cartão, cupom BEMVINDO10)
  const p1Items = [
    { product: createdProducts[4], qty: 2 }, // Suco Uva (16.90 * 2 = 33.80)
    { product: createdProducts[0], qty: 4 }, // Água Sem Gás (3.50 * 4 = 14.00)
  ];
  const p1Subtotal = 47.80;
  const p1Discount = 4.78; // 10%
  const p1Total = (p1Subtotal - p1Discount + Number(shippingFee)).toFixed(2);
  const orderEntregue = await db.order.create({
    data: {
      user_id: cliente.id,
      address_id: addrBrasilia.id,
      status: OrderStatus.ENTREGUE,
      payment_method: PaymentMethod.CARTAO,
      payment_status: PaymentStatus.PAGO,
      subtotal: p1Subtotal.toFixed(2),
      discount: p1Discount.toFixed(2),
      shipping_fee: shippingFee,
      total: p1Total,
      coupon_id: couponBemVindo.id,
      paid_at: daysAgo(18, 1),
      created_at: daysAgo(18, 2),
      updated_at: daysAgo(18),
      address_snapshot: {
        street: addrBrasilia.street,
        number: addrBrasilia.number,
        complement: addrBrasilia.complement,
        neighborhood: addrBrasilia.neighborhood,
        city: addrBrasilia.city,
        state: addrBrasilia.state,
        zip: addrBrasilia.zip,
      },
    },
  });
  for (const item of p1Items) {
    await db.orderItem.create({
      data: {
        order_id: orderEntregue.id,
        product_id: item.product.id,
        quantity: item.qty,
        unit_price: item.product.price,
        product_name: item.product.name,
      },
    });
  }
  await db.paymentRecord.create({
    data: {
      order_id: orderEntregue.id,
      status: PaymentStatus.PAGO,
      actor_id: admin.id,
      reference: 'CARD-AUTH-9041284',
      created_at: daysAgo(18, 1),
    },
  });
  await db.delivery.create({
    data: {
      order_id: orderEntregue.id,
      deliverer_id: entregador.id,
      status: DeliveryStatus.ENTREGUE,
      updated_at: daysAgo(18),
    },
  });
  await db.orderHistory.createMany({
    data: [
      { order_id: orderEntregue.id, status: OrderStatus.PENDENTE, actor_id: cliente.id, created_at: daysAgo(18, 2), reason: 'Pedido realizado pelo cliente' },
      { order_id: orderEntregue.id, status: OrderStatus.CONFIRMADO, actor_id: admin.id, created_at: daysAgo(18, 1), reason: 'Pagamento demonstrativo aprovado' },
      { order_id: orderEntregue.id, status: OrderStatus.SEPARADO, actor_id: atendente.id, created_at: daysAgo(18, 1), reason: 'Itens conferidos e embalados' },
      { order_id: orderEntregue.id, status: OrderStatus.EM_ROTA, actor_id: entregador.id, created_at: daysAgo(18), reason: 'Saiu para entrega' },
      { order_id: orderEntregue.id, status: OrderStatus.ENTREGUE, actor_id: entregador.id, created_at: daysAgo(18), reason: 'Entregue com sucesso ao cliente' },
    ],
  });

  // Pedido 2: EM_ROTA (4 horas atrás, pago com PIX)
  const p2Items = [
    { product: createdProducts[1], qty: 3 }, // Água Com Gás (4.20 * 3 = 12.60)
    { product: createdProducts[8], qty: 4 }, // Guaraná (4.80 * 4 = 19.20)
  ];
  const p2Subtotal = 31.80;
  const p2Discount = 0.00;
  const p2Total = (p2Subtotal + Number(shippingFee)).toFixed(2);
  const orderEmRota = await db.order.create({
    data: {
      user_id: cliente.id,
      address_id: addrBrasilia.id,
      status: OrderStatus.EM_ROTA,
      payment_method: PaymentMethod.PIX,
      payment_status: PaymentStatus.PAGO,
      subtotal: p2Subtotal.toFixed(2),
      discount: p2Discount.toFixed(2),
      shipping_fee: shippingFee,
      total: p2Total,
      paid_at: daysAgo(0, 3),
      created_at: daysAgo(0, 4),
      updated_at: daysAgo(0, 1),
      address_snapshot: {
        street: addrBrasilia.street,
        number: addrBrasilia.number,
        complement: addrBrasilia.complement,
        neighborhood: addrBrasilia.neighborhood,
        city: addrBrasilia.city,
        state: addrBrasilia.state,
        zip: addrBrasilia.zip,
      },
    },
  });
  for (const item of p2Items) {
    await db.orderItem.create({
      data: {
        order_id: orderEmRota.id,
        product_id: item.product.id,
        quantity: item.qty,
        unit_price: item.product.price,
        product_name: item.product.name,
      },
    });
  }
  await db.paymentRecord.create({
    data: {
      order_id: orderEmRota.id,
      status: PaymentStatus.PAGO,
      actor_id: atendente.id,
      reference: 'PIX-E2E-984021',
      created_at: daysAgo(0, 3),
    },
  });
  await db.delivery.create({
    data: {
      order_id: orderEmRota.id,
      deliverer_id: entregador.id,
      status: DeliveryStatus.SAIU_PARA_ENTREGA,
      updated_at: daysAgo(0, 1),
    },
  });
  await db.orderHistory.createMany({
    data: [
      { order_id: orderEmRota.id, status: OrderStatus.PENDENTE, actor_id: cliente.id, created_at: daysAgo(0, 4), reason: 'Pedido realizado via PIX' },
      { order_id: orderEmRota.id, status: OrderStatus.CONFIRMADO, actor_id: atendente.id, created_at: daysAgo(0, 3), reason: 'Comprovante PIX validado pelo atendente' },
      { order_id: orderEmRota.id, status: OrderStatus.SEPARADO, actor_id: atendente.id, created_at: daysAgo(0, 2), reason: 'Mercadorias separadas no estoque' },
      { order_id: orderEmRota.id, status: OrderStatus.EM_ROTA, actor_id: entregador.id, created_at: daysAgo(0, 1), reason: 'Entregador retirou o pacote para entrega' },
    ],
  });

  // Pedido 3: SEPARADO (1 dia atrás, pago com PIX, cupom ADEGA5)
  const p3Items = [
    { product: createdProducts[5], qty: 2 }, // Suco Laranja (13.50 * 2 = 27.00)
    { product: createdProducts[12], qty: 1 }, // Matte Leão (8.50)
  ];
  const p3Subtotal = 35.50;
  const p3Discount = 5.00;
  const p3Total = (p3Subtotal - p3Discount + Number(shippingFee)).toFixed(2);
  const orderSeparado = await db.order.create({
    data: {
      user_id: cliente.id,
      address_id: addrSaoPaulo.id,
      status: OrderStatus.SEPARADO,
      payment_method: PaymentMethod.PIX,
      payment_status: PaymentStatus.PAGO,
      subtotal: p3Subtotal.toFixed(2),
      discount: p3Discount.toFixed(2),
      shipping_fee: shippingFee,
      total: p3Total,
      coupon_id: couponAdega5.id,
      paid_at: daysAgo(1, 4),
      created_at: daysAgo(1, 5),
      updated_at: daysAgo(1, 2),
      address_snapshot: {
        street: addrSaoPaulo.street,
        number: addrSaoPaulo.number,
        complement: addrSaoPaulo.complement,
        neighborhood: addrSaoPaulo.neighborhood,
        city: addrSaoPaulo.city,
        state: addrSaoPaulo.state,
        zip: addrSaoPaulo.zip,
      },
    },
  });
  for (const item of p3Items) {
    await db.orderItem.create({
      data: {
        order_id: orderSeparado.id,
        product_id: item.product.id,
        quantity: item.qty,
        unit_price: item.product.price,
        product_name: item.product.name,
      },
    });
  }
  await db.paymentRecord.create({
    data: {
      order_id: orderSeparado.id,
      status: PaymentStatus.PAGO,
      actor_id: atendente.id,
      reference: 'PIX-E2E-123789',
      created_at: daysAgo(1, 4),
    },
  });
  await db.delivery.create({
    data: {
      order_id: orderSeparado.id,
      status: DeliveryStatus.AGUARDANDO,
      updated_at: daysAgo(1, 2),
    },
  });
  await db.orderHistory.createMany({
    data: [
      { order_id: orderSeparado.id, status: OrderStatus.PENDENTE, actor_id: cliente.id, created_at: daysAgo(1, 5), reason: 'Pedido realizado pelo cliente' },
      { order_id: orderSeparado.id, status: OrderStatus.CONFIRMADO, actor_id: atendente.id, created_at: daysAgo(1, 4), reason: 'Pagamento PIX confirmado' },
      { order_id: orderSeparado.id, status: OrderStatus.SEPARADO, actor_id: atendente.id, created_at: daysAgo(1, 2), reason: 'Separação concluída, aguardando entregador disponível' },
    ],
  });

  // Pedido 4: CONFIRMADO (2 dias atrás, pago com Cartão)
  const p4Items = [
    { product: createdProducts[9], qty: 4 }, // Coca-Cola (5.20 * 4 = 20.80)
    { product: createdProducts[13], qty: 2 }, // Fuze Tea Pêssego (5.50 * 2 = 11.00)
  ];
  const p4Subtotal = 31.80;
  const p4Discount = 0.00;
  const p4Total = (p4Subtotal + Number(shippingFee)).toFixed(2);
  const orderConfirmado = await db.order.create({
    data: {
      user_id: cliente.id,
      address_id: addrBrasilia.id,
      status: OrderStatus.CONFIRMADO,
      payment_method: PaymentMethod.CARTAO,
      payment_status: PaymentStatus.PAGO,
      subtotal: p4Subtotal.toFixed(2),
      discount: p4Discount.toFixed(2),
      shipping_fee: shippingFee,
      total: p4Total,
      paid_at: daysAgo(2, 6),
      created_at: daysAgo(2, 7),
      updated_at: daysAgo(2, 6),
      address_snapshot: {
        street: addrBrasilia.street,
        number: addrBrasilia.number,
        complement: addrBrasilia.complement,
        neighborhood: addrBrasilia.neighborhood,
        city: addrBrasilia.city,
        state: addrBrasilia.state,
        zip: addrBrasilia.zip,
      },
    },
  });
  for (const item of p4Items) {
    await db.orderItem.create({
      data: {
        order_id: orderConfirmado.id,
        product_id: item.product.id,
        quantity: item.qty,
        unit_price: item.product.price,
        product_name: item.product.name,
      },
    });
  }
  await db.paymentRecord.create({
    data: {
      order_id: orderConfirmado.id,
      status: PaymentStatus.PAGO,
      actor_id: admin.id,
      reference: 'CARD-AUTH-883201',
      created_at: daysAgo(2, 6),
    },
  });
  await db.orderHistory.createMany({
    data: [
      { order_id: orderConfirmado.id, status: OrderStatus.PENDENTE, actor_id: cliente.id, created_at: daysAgo(2, 7), reason: 'Checkout demonstrativo com cartão de crédito' },
      { order_id: orderConfirmado.id, status: OrderStatus.CONFIRMADO, actor_id: admin.id, created_at: daysAgo(2, 6), reason: 'Transação autorizada com sucesso' },
    ],
  });

  // Pedido 5: CANCELADO (5 dias atrás por expiração de pagamento)
  const p5Items = [
    { product: createdProducts[6], qty: 1 }, // Suco Maçã (14.20)
  ];
  const p5Subtotal = 14.20;
  const p5Discount = 0.00;
  const p5Total = (p5Subtotal + Number(shippingFee)).toFixed(2);
  const orderCancelado = await db.order.create({
    data: {
      user_id: cliente.id,
      address_id: addrBrasilia.id,
      status: OrderStatus.CANCELADO,
      payment_method: PaymentMethod.PIX,
      payment_status: PaymentStatus.PENDENTE,
      cancellation_reason: 'Pagamento demonstrativo não confirmado no prazo de 30 minutos (RN07).',
      subtotal: p5Subtotal.toFixed(2),
      discount: p5Discount.toFixed(2),
      shipping_fee: shippingFee,
      total: p5Total,
      created_at: daysAgo(5, 2),
      updated_at: daysAgo(5, 1),
      address_snapshot: {
        street: addrBrasilia.street,
        number: addrBrasilia.number,
        complement: addrBrasilia.complement,
        neighborhood: addrBrasilia.neighborhood,
        city: addrBrasilia.city,
        state: addrBrasilia.state,
        zip: addrBrasilia.zip,
      },
    },
  });
  for (const item of p5Items) {
    await db.orderItem.create({
      data: {
        order_id: orderCancelado.id,
        product_id: item.product.id,
        quantity: item.qty,
        unit_price: item.product.price,
        product_name: item.product.name,
      },
    });
  }
  await db.orderHistory.createMany({
    data: [
      { order_id: orderCancelado.id, status: OrderStatus.PENDENTE, actor_id: cliente.id, created_at: daysAgo(5, 2), reason: 'Pedido criado' },
      { order_id: orderCancelado.id, status: OrderStatus.CANCELADO, actor_id: cliente.id, created_at: daysAgo(5, 1), reason: 'Pagamento demonstrativo não confirmado no prazo de 30 minutos (RN07).' },
    ],
  });

  // Pedido 6: PENDENTE recente (10 minutos atrás, pronto para demonstrar a fila e pagamento)
  const p6Items = [
    { product: createdProducts[2], qty: 2 }, // Água Prata 1.5L (7.80 * 2 = 15.60)
    { product: createdProducts[14], qty: 1 }, // Chá Verde Feel Good (9.20)
  ];
  const p6Subtotal = 24.80;
  const p6Discount = 0.00;
  const p6Total = (p6Subtotal + Number(shippingFee)).toFixed(2);
  const orderPendente = await db.order.create({
    data: {
      user_id: cliente.id,
      address_id: addrBrasilia.id,
      status: OrderStatus.PENDENTE,
      payment_method: PaymentMethod.PIX,
      payment_status: PaymentStatus.PENDENTE,
      subtotal: p6Subtotal.toFixed(2),
      discount: p6Discount.toFixed(2),
      shipping_fee: shippingFee,
      total: p6Total,
      created_at: daysAgo(0, 0.15), // ~9 minutos atrás
      updated_at: daysAgo(0, 0.15),
      address_snapshot: {
        street: addrBrasilia.street,
        number: addrBrasilia.number,
        complement: addrBrasilia.complement,
        neighborhood: addrBrasilia.neighborhood,
        city: addrBrasilia.city,
        state: addrBrasilia.state,
        zip: addrBrasilia.zip,
      },
    },
  });
  for (const item of p6Items) {
    await db.orderItem.create({
      data: {
        order_id: orderPendente.id,
        product_id: item.product.id,
        quantity: item.qty,
        unit_price: item.product.price,
        product_name: item.product.name,
      },
    });
  }
  await db.orderHistory.create({
    data: {
      order_id: orderPendente.id,
      status: OrderStatus.PENDENTE,
      actor_id: cliente.id,
      created_at: daysAgo(0, 0.15),
      reason: 'Pedido demonstrativo gerado via PIX, aguardando validação do operador',
    },
  });

  console.info('========================================================================');
  console.info('SEED DE DEMONSTRAÇÃO CONCLUÍDO COM SUCESSO!');
  console.info('Usuários disponíveis (senha: Admin@123):');
  console.info('  - admin@adegaexpress.com (ADMINISTRADOR)');
  console.info('  - atendente@adegaexpress.com (ATENDENTE)');
  console.info('  - entregador@adegaexpress.com (ENTREGADOR)');
  console.info('  - cliente@adegaexpress.com (CLIENTE)');
  console.info('Endereços fictícios:');
  console.info('  - Rua das Palmeiras, 123, Centro, Brasília/DF (Padrão)');
  console.info('  - Rua das Acácias, 45, Apto 12, Jardim Primavera, São Paulo/SP');
  console.info('Cupons:');
  console.info('  - BEMVINDO10 (10% ativo)');
  console.info('  - ADEGA5 (R$ 5,00 fixo ativo)');
  console.info('  - EXPIRADO20 (Expirado)');
  console.info('  - INATIVO10 (Inativo)');
  console.info('Pedidos criados em todos os status:');
  console.info(`  - PENDENTE: #${orderPendente.id}`);
  console.info(`  - CONFIRMADO: #${orderConfirmado.id}`);
  console.info(`  - SEPARADO: #${orderSeparado.id}`);
  console.info(`  - EM_ROTA: #${orderEmRota.id}`);
  console.info(`  - ENTREGUE: #${orderEntregue.id}`);
  console.info(`  - CANCELADO: #${orderCancelado.id}`);
  console.info('========================================================================');
}

seedDemo()
  .catch((e) => {
    console.error('Erro fatal durante seed de demonstração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
