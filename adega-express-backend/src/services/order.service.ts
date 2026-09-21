import { createHash } from 'crypto';
import { Prisma, OrderStatus } from '@prisma/client';
import { z } from 'zod';
import prisma from './prisma.service';
import { transaction } from '../lib/transaction';
import { AppError } from '../lib/errors';
import { businessDate, isAdult, discountedTotal, assertOrderTransition } from '../lib/business';
import { config } from '../config';
import * as schemas from '../schemas';
import { pageArgs, paged } from './catalog.service';
import { AuthPayload } from '../types/express';

const detail = {
  user: { select: { id: true, name: true, email: true } },
  items: {
    include: { product: { select: { id: true, name: true, brand: true, volume_ml: true } } },
  },
  delivery: true,
  history: { orderBy: { id: 'asc' as const } },
} satisfies Prisma.OrderInclude;

async function priceOrder(
  tx: Prisma.TransactionClient,
  user_id: number,
  input: schemas.CheckoutInput,
) {
  const user = await tx.user.findUnique({ where: { id: user_id } });
  if (!user?.active || user.role !== 'CLIENTE') {
    throw new AppError(403, 'Compra disponível apenas para clientes ativos.');
  }
  if (!user.birth_date || !isAdult(user.birth_date)) {
    throw new AppError(403, 'Maioridade não confirmada.');
  }
  const address = await tx.address.findFirst({
    where: { id: input.address_id, user_id, archived: false },
  });
  if (!address) {
    throw new AppError(400, 'Endereço não encontrado ou não pertence ao cliente.');
  }
  const cities = config.DELIVERY_CITIES.split(',')
    .map((v) => v.trim().toLocaleLowerCase('pt-BR'))
    .filter(Boolean);
  if (
    (cities.length && !cities.includes(address.city.toLocaleLowerCase('pt-BR'))) ||
    (config.DELIVERY_STATE && config.DELIVERY_STATE !== address.state)
  ) {
    throw new AppError(400, 'Endereço fora da área de entrega.');
  }
  const products = await tx.product.findMany({
    where: { id: { in: input.items.map((i) => i.product_id) }, active: true },
  });
  const items = input.items
    .map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        throw new AppError(400, 'Produto inexistente ou inativo: ' + item.product_id);
      }
      if (product.stock_quantity < item.quantity) {
        throw new AppError(
          409,
          `Estoque insuficiente para ${product.name}. Disponível: ${product.stock_quantity}.`,
        );
      }
      return {
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
      };
    })
    .sort((a, b) => a.product_id - b.product_id);
  const subtotal = items.reduce(
    (sum, i) => sum.add(i.unit_price.mul(i.quantity)),
    new Prisma.Decimal(0),
  );
  let discounted = subtotal;
  let coupon_id: number | undefined;
  if (input.coupon_code) {
    const coupon = await tx.coupon.findUnique({ where: { code: input.coupon_code } });
    const today = businessDate();
    if (
      !coupon ||
      !coupon.active ||
      coupon.valid_from.toISOString().slice(0, 10) > today ||
      coupon.valid_until.toISOString().slice(0, 10) < today
    ) {
      throw new AppError(
        400,
        'Cupom inválido, inativo ou fora da vigência. Remova-o ou corrija o código para continuar.',
      );
    }
    coupon_id = coupon.id;
    discounted = discountedTotal(subtotal, coupon.discount_type, coupon.discount_value);
  }
  const shipping_fee = new Prisma.Decimal(config.SHIPPING_FEE);
  const total = discounted.add(shipping_fee);
  if (subtotal.greaterThan('99999999.99') || total.greaterThan('99999999.99')) {
    throw new AppError(400, 'Valor do pedido excede o limite permitido.');
  }
  const { street, number, complement, neighborhood, city, state, zip } = address;
  return {
    items,
    subtotal,
    discount: subtotal.sub(discounted),
    shipping_fee,
    total,
    coupon_id,
    address_snapshot: { street, number, complement, neighborhood, city, state, zip },
  };
}
export async function quoteOrder(user_id: number, input: schemas.CheckoutInput) {
  return transaction((tx) => priceOrder(tx, user_id, input));
}
export async function createOrder(user_id: number, input: schemas.CheckoutInput, key?: string) {
  const canonical = {
    ...input,
    items: [...input.items].sort((a, b) => a.product_id - b.product_id),
  };
  const hash = createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
  const findExisting = async (db: Prisma.TransactionClient) => {
    if (!key) {
      return null;
    }
    const existing = await db.order.findUnique({
      where: { user_id_idempotency_key: { user_id, idempotency_key: key } },
      include: detail,
    });
    if (existing && existing.request_hash !== hash) {
      throw new AppError(409, 'Idempotency-Key já utilizada com outro pedido.');
    }
    return existing;
  };
  try {
    return await transaction(async (tx) => {
      const existing = await findExisting(tx);
      if (existing) {
        return { order: existing, replayed: true };
      }
      const priced = await priceOrder(tx, user_id, input);
      const { items, ...totals } = priced;
      // Conditional decrement prevents overselling even when multiple checkouts run together.
      for (const item of items) {
        const result = await tx.product.updateMany({
          where: { id: item.product_id, active: true, stock_quantity: { gte: item.quantity } },
          data: { stock_quantity: { decrement: item.quantity } },
        });
        if (!result.count) {
          throw new AppError(409, 'Estoque alterado durante a compra. Atualize o carrinho.');
        }
      }
      const order = await tx.order.create({
        data: {
          ...totals,
          user_id,
          address_id: input.address_id,
          payment_method: input.payment_method,
          idempotency_key: key,
          request_hash: key ? hash : undefined,
          items: { create: items },
          history: { create: { status: 'PENDENTE', actor_id: user_id } },
        },
        include: detail,
      });
      await tx.stockMovement.createMany({
        data: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          type: 'SAIDA',
          reason: `Venda - Pedido #${order.id}`,
          actor_id: user_id,
        })),
      });
      return { order, replayed: false };
    });
  } catch (error) {
    // A concurrent request may win the unique constraint before our transaction commits.
    if (key && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await findExisting(prisma);
      if (existing) {
        return { order: existing, replayed: true };
      }
    }
    throw error;
  }
}
export async function listOrders(query: z.infer<typeof schemas.orderQuery>, user_id?: number) {
  const where = { user_id, status: query.status };
  const [items, count] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      ...pageArgs(query),
      orderBy: { id: 'desc' },
      select: {
        id: true,
        status: true,
        total: true,
        subtotal: true,
        discount: true,
        shipping_fee: true,
        payment_method: true,
        payment_status: true,
        created_at: true,
        updated_at: true,
        user: { select: { id: true, name: true } },
        _count: { select: { items: true } },
        items: { select: { id: true, quantity: true, product_name: true, unit_price: true } },
        delivery: true,
      },
    }),
    prisma.order.count({ where }),
  ]);
  return paged(items, count, query);
}
export async function getOrderById(id: number, actor: AuthPayload) {
  const where: Prisma.OrderWhereInput = { id };
  if (actor.role === 'CLIENTE') {
    where.user_id = actor.sub;
  }
  if (actor.role === 'ENTREGADOR') {
    throw new AppError(403, 'Utilize a lista de entregas atribuídas.');
  }
  const order = await prisma.order.findFirst({ where, include: detail });
  if (!order) {
    throw new AppError(404, 'Pedido não encontrado.');
  }
  return { ...order, address: order.address_snapshot };
}
export async function updateOrderStatus(
  id: number,
  status: OrderStatus,
  actor: AuthPayload,
  reason?: string,
) {
  return transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order || (actor.role === 'CLIENTE' && order.user_id !== actor.sub)) {
      throw new AppError(404, 'Pedido não encontrado.');
    }
    if (
      actor.role === 'CLIENTE' &&
      (status !== 'CANCELADO' || !['PENDENTE', 'CANCELADO'].includes(order.status))
    ) {
      throw new AppError(409, 'Cliente só pode cancelar pedidos pendentes.');
    }
    if (status === order.status) {
      return order;
    }
    assertOrderTransition(order.status, status);
    if (status === 'EM_ROTA' || status === 'ENTREGUE') {
      throw new AppError(409, 'Atualize estas etapas pela entrega atribuída ao entregador.');
    }
    if (status === 'CANCELADO' && !reason) {
      throw new AppError(400, 'Informe o motivo do cancelamento.');
    }
    const changed = await tx.order.updateMany({
      where: { id, status: order.status },
      data: {
        status,
        ...(status === 'CANCELADO'
          ? {
              cancellation_reason: reason,
              payment_status:
                order.payment_status === 'PAGO' ? 'ESTORNO_PENDENTE' : order.payment_status,
            }
          : {}),
      },
    });
    if (!changed.count) {
      throw new AppError(409, 'Pedido alterado por outra operação.');
    }
    if (status === 'SEPARADO') {
      await tx.delivery.create({ data: { order_id: id } });
    }
    if (status === 'CANCELADO') {
      for (const item of [...order.items].sort((a, b) => a.product_id - b.product_id)) {
        const updated = await tx.product.updateMany({
          where: { id: item.product_id, stock_quantity: { lte: 2147483647 - item.quantity } },
          data: { stock_quantity: { increment: item.quantity } },
        });
        if (!updated.count) {
          throw new AppError(409, 'Limite do estoque excedido.');
        }
        await tx.stockMovement.create({
          data: {
            product_id: item.product_id,
            type: 'ENTRADA',
            quantity: item.quantity,
            reason: `Cancelamento - Pedido #${id}`,
            actor_id: actor.sub,
          },
        });
      }
    }
    await tx.orderHistory.create({ data: { order_id: id, status, actor_id: actor.sub, reason } });
    return tx.order.findUniqueOrThrow({ where: { id }, include: detail });
  });
}
export async function recordPayment(
  id: number,
  input: z.infer<typeof schemas.payment>,
  actor_id: number,
) {
  return transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id } });
    if (!order) {
      throw new AppError(404, 'Pedido não encontrado.');
    }
    if (order.payment_status === input.status) {
      return order;
    }
    if (
      input.status === 'PAGO' &&
      (order.status === 'CANCELADO' || order.payment_status !== 'PENDENTE')
    ) {
      throw new AppError(409, 'Pagamento não pode ser confirmado nesta situação.');
    }
    if (input.status === 'ESTORNADO' && order.payment_status !== 'ESTORNO_PENDENTE') {
      throw new AppError(409, 'Não há estorno pendente.');
    }
    await tx.paymentRecord.create({ data: { order_id: id, actor_id, ...input } });
    return tx.order.update({
      where: { id },
      data: {
        payment_status: input.status,
        ...(input.status === 'PAGO' ? { paid_at: new Date() } : {}),
      },
    });
  });
}
export async function paymentHistory(order_id: number) {
  const exists = await prisma.order.findUnique({ where: { id: order_id }, select: { id: true } });
  if (!exists) {
    throw new AppError(404, 'Pedido não encontrado.');
  }
  return prisma.paymentRecord.findMany({ where: { order_id }, orderBy: { id: 'asc' } });
}
