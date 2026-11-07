import 'dotenv/config';
import { PrismaClient, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

const db = new PrismaClient({ log: [] });

async function createPendingOrder() {
  console.info('--> Criando pedido PENDENTE fresco para demonstração...');

  const cliente = await db.user.findUnique({
    where: { email: 'cliente@adegaexpress.com' },
    include: {
      addresses: {
        where: { archived: false },
        orderBy: [{ is_default: 'desc' }, { id: 'asc' }],
      },
    },
  });

  if (!cliente) {
    throw new Error('Cliente demo (cliente@adegaexpress.com) não encontrado. Rode o seed:demo primeiro.');
  }

  const address = cliente.addresses[0];
  if (!address) {
    throw new Error('Nenhum endereço encontrado para o cliente demo.');
  }

  // Pegar 2 produtos em estoque
  const products = await db.product.findMany({
    where: { active: true, stock_quantity: { gte: 2 } },
    take: 2,
  });

  if (products.length === 0) {
    throw new Error('Nenhum produto em estoque suficiente encontrado.');
  }

  const shippingFee = '7.90';
  let subtotalNum = 0;
  const orderItemsData = products.map((p, idx) => {
    const qty = idx === 0 ? 2 : 1;
    const priceNum = Number(p.price);
    subtotalNum += priceNum * qty;
    return {
      product_id: p.id,
      quantity: qty,
      unit_price: p.price,
      product_name: p.name,
    };
  });

  const totalNum = subtotalNum + Number(shippingFee);

  const newOrder = await db.order.create({
    data: {
      user_id: cliente.id,
      address_id: address.id,
      status: OrderStatus.PENDENTE,
      payment_method: PaymentMethod.PIX,
      payment_status: PaymentStatus.PENDENTE,
      subtotal: subtotalNum.toFixed(2),
      discount: '0.00',
      shipping_fee: shippingFee,
      total: totalNum.toFixed(2),
      created_at: new Date(),
      updated_at: new Date(),
      address_snapshot: {
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zip: address.zip,
      },
      items: {
        create: orderItemsData,
      },
      history: {
        create: {
          status: OrderStatus.PENDENTE,
          actor_id: cliente.id,
          reason: 'Pedido demonstrativo gerado agora via PIX',
          created_at: new Date(),
        },
      },
    },
  });

  console.info('========================================================================');
  console.info(`NOVO PEDIDO PENDENTE CRIADO COM SUCESSO!`);
  console.info(`ID do Pedido: #${newOrder.id}`);
  console.info(`Cliente: ${cliente.name} (${cliente.email})`);
  console.info(`Endereço: ${address.street}, ${address.number} - ${address.city}/${address.state}`);
  console.info(`Total: R$ ${newOrder.total}`);
  console.info(`Status: PENDENTE (Válido pelos próximos 30 minutos)`);
  console.info('========================================================================');
}

createPendingOrder()
  .catch((err) => {
    console.error('Erro ao gerar pedido pendente:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
