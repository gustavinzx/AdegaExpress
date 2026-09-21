import { DeliveryStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from './prisma.service';
import { transaction } from '../lib/transaction';
import { AppError } from '../lib/errors';
import { assertDeliveryTransition } from '../lib/business';
import { deliveryQuery } from '../schemas';
import { pageArgs, paged } from './catalog.service';

const selection = {
  id: true,
  order_id: true,
  deliverer_id: true,
  status: true,
  updated_at: true,
  deliverer: { select: { id: true, name: true } },
  order: {
    select: {
      id: true,
      status: true,
      address_snapshot: true,
      total: true,
      payment_method: true,
      payment_status: true,
      user: { select: { name: true } },
    },
  },
} satisfies Prisma.DeliverySelect;
export async function listDeliveries(query: z.infer<typeof deliveryQuery>, deliverer_id?: number) {
  const where: Prisma.DeliveryWhereInput = {
    deliverer_id,
    status: query.status,
    order: { status: { not: 'CANCELADO' } },
  };
  const [items, count] = await prisma.$transaction([
    prisma.delivery.findMany({
      where,
      select: selection,
      orderBy: { id: 'desc' },
      ...pageArgs(query),
    }),
    prisma.delivery.count({ where }),
  ]);
  return paged(items, count, query);
}
export async function assignDeliverer(id: number, deliverer_id: number) {
  return transaction(async (tx) => {
    const delivery = await tx.delivery.findUnique({ where: { id }, include: { order: true } });
    if (!delivery) {
      throw new AppError(404, 'Entrega não encontrada.');
    }
    if (delivery.status !== 'AGUARDANDO' || delivery.order.status !== 'SEPARADO') {
      throw new AppError(409, 'Só é possível atribuir entregas aguardando saída.');
    }
    const user = await tx.user.findFirst({
      where: { id: deliverer_id, role: 'ENTREGADOR', active: true },
    });
    if (!user) {
      throw new AppError(400, 'Entregador inválido ou inativo.');
    }
    return tx.delivery.update({ where: { id }, data: { deliverer_id }, select: selection });
  });
}
export async function updateDeliveryStatus(
  id: number,
  deliverer_id: number,
  status: DeliveryStatus,
) {
  return transaction(async (tx) => {
    const delivery = await tx.delivery.findUnique({ where: { id }, include: { order: true } });
    if (!delivery || delivery.deliverer_id !== deliverer_id) {
      throw new AppError(404, 'Entrega não encontrada ou não atribuída a você.');
    }
    if (delivery.order.status === 'CANCELADO') {
      throw new AppError(409, 'Pedido cancelado.');
    }
    if (status === delivery.status) {
      return tx.delivery.findUniqueOrThrow({ where: { id }, select: selection });
    }
    assertDeliveryTransition(delivery.status, status);
    const expected = status === 'SAIU_PARA_ENTREGA' ? 'SEPARADO' : 'EM_ROTA';
    if (delivery.order.status !== expected) {
      throw new AppError(409, 'Pedido incompatível com esta etapa da entrega.');
    }
    if (status === 'ENTREGUE' && delivery.order.payment_status !== 'PAGO') {
      throw new AppError(
        409,
        'O atendente deve confirmar o pagamento antes de concluir a entrega.',
      );
    }
    const orderStatus = status === 'SAIU_PARA_ENTREGA' ? 'EM_ROTA' : 'ENTREGUE';
    await tx.order.update({ where: { id: delivery.order_id }, data: { status: orderStatus } });
    await tx.orderHistory.create({
      data: { order_id: delivery.order_id, status: orderStatus, actor_id: deliverer_id },
    });
    return tx.delivery.update({ where: { id }, data: { status }, select: selection });
  });
}
