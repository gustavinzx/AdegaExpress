import { Prisma } from '@prisma/client';
import prisma from './prisma.service';
import { transaction } from '../lib/transaction';
import { AppError } from '../lib/errors';
import { Page } from '../schemas';
import { pageArgs, paged } from './catalog.service';
import { userSelect } from './auth.service';
import { startBusinessDay } from '../lib/business';

export async function listStaff(page: Page) {
  const where = { role: { not: 'CLIENTE' as const } };
  const [items, count] = await prisma.$transaction([
    prisma.user.findMany({ where, select: userSelect, orderBy: { id: 'asc' }, ...pageArgs(page) }),
    prisma.user.count({ where }),
  ]);
  return paged(items, count, page);
}
export async function setUserActive(id: number, active: boolean, actor_id: number) {
  if (id === actor_id) {
    throw new AppError(400, 'Não é permitido desativar a própria conta por esta operação.');
  }
  return transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, 'Usuário não encontrado.');
    }
    if (!active && user.active && user.role === 'ADMINISTRADOR') {
      const administrators = await tx.user.count({
        where: { role: 'ADMINISTRADOR', active: true },
      });
      if (administrators <= 1) {
        throw new AppError(409, 'O sistema precisa manter ao menos um administrador ativo.');
      }
    }
    if (!active && user.role === 'ENTREGADOR') {
      const deliveries = await tx.delivery.count({
        where: {
          deliverer_id: id,
          status: { not: 'ENTREGUE' },
          order: { status: { not: 'CANCELADO' } },
        },
      });
      if (deliveries) {
        throw new AppError(
          409,
          'Reatribua ou conclua as entregas antes de desativar este entregador.',
        );
      }
    }
    return tx.user.update({
      where: { id },
      data: { active, token_version: { increment: 1 } },
      select: userSelect,
    });
  });
}
export async function listDeliverers() {
  return prisma.user.findMany({
    where: { role: 'ENTREGADOR', active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: 100,
  });
}
export async function salesReport(from: string, to: string) {
  const start = startBusinessDay(from);
  const nextDay = new Date(new Date(to + 'T00:00:00Z').getTime() + 86400000)
    .toISOString()
    .slice(0, 10);
  const end = startBusinessDay(nextDay);
  const created_at = { gte: start, lt: end };
  const paidWhere = {
    created_at,
    payment_status: 'PAGO' as const,
    status: { not: 'CANCELADO' as const },
  };
  const [byStatus, paid, refunds, top, lowStock] = await prisma.$transaction([
    prisma.order.groupBy({
      by: ['status'],
      orderBy: { status: 'asc' },
      where: { created_at },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: paidWhere,
      _count: { _all: true },
      _sum: { total: true, subtotal: true, discount: true, shipping_fee: true },
    }),
    prisma.order.aggregate({
      where: { created_at, payment_status: 'ESTORNO_PENDENTE' },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.orderItem.groupBy({
      by: ['product_id'],
      where: { order: paidWhere },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    }),
    prisma.product.findMany({
      where: { active: true, stock_quantity: { lte: 5 } },
      select: { id: true, name: true, stock_quantity: true },
      orderBy: [{ stock_quantity: 'asc' }, { id: 'asc' }],
      take: 100,
    }),
  ]);
  const names = await prisma.product.findMany({
    where: { id: { in: top.map((p) => p.product_id) } },
    select: { id: true, name: true },
  });
  const revenue = paid._sum.total ?? new Prisma.Decimal(0);
  return {
    period: {
      from,
      to,
      timezone: 'America/Sao_Paulo',
      basis: 'Data de criação do pedido; pagamento na situação atual',
    },
    orders_by_status: byStatus,
    paid_orders: paid._count._all,
    paid_revenue: revenue,
    discounts: paid._sum.discount ?? new Prisma.Decimal(0),
    shipping: paid._sum.shipping_fee ?? new Prisma.Decimal(0),
    average_ticket: paid._count._all
      ? revenue.div(paid._count._all).toDecimalPlaces(2)
      : new Prisma.Decimal(0),
    pending_refunds: {
      count: refunds._count._all,
      total: refunds._sum.total ?? new Prisma.Decimal(0),
    },
    top_products: top.map((p) => ({
      product_id: p.product_id,
      name: names.find((n) => n.id === p.product_id)?.name,
      quantity: p._sum?.quantity ?? 0,
    })),
    low_stock: lowStock,
  };
}
