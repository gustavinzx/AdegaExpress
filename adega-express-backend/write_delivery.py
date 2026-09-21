import pathlib
import os

BASE = pathlib.Path(r"c:\Users\gsds0\Desktop\Adega Express\adega-express-backend\src")

files = {}

# ─────────────────────────────────────────────────────────────────────────────
# services/delivery.service.ts
# ─────────────────────────────────────────────────────────────────────────────
files["services/delivery.service.ts"] = """\
// src/services/delivery.service.ts
import { Prisma, DeliveryStatus, OrderStatus } from '@prisma/client';
import prisma from './prisma.service';

function appError(message: string, statusCode: number): Error {
  return Object.assign(new Error(message), { statusCode });
}

const deliverySelect = {
  id: true,
  order_id: true,
  deliverer_id: true,
  status: true,
  updated_at: true,
  order: {
    select: {
      id: true,
      status: true,
      address: {
        select: {
          street: true,
          number: true,
          complement: true,
          neighborhood: true,
          city: true,
          state: true,
          zip: true,
        },
      },
    },
  },
} satisfies Prisma.DeliverySelect;

/** Lista todas as entregas (com filtro opcional por status) */
export async function listDeliveries(status?: DeliveryStatus) {
  const where: Prisma.DeliveryWhereInput = {};
  if (status) {
    where.status = status;
  }

  return prisma.delivery.findMany({
    where,
    select: deliverySelect,
    orderBy: { updated_at: 'desc' },
  });
}

/** Lista as entregas atribuidas a um entregador especifico */
export async function listMyDeliveries(deliverer_id: number) {
  return prisma.delivery.findMany({
    where: { deliverer_id },
    select: deliverySelect,
    orderBy: { updated_at: 'desc' },
  });
}

/** Atribui um entregador a uma entrega existente */
export async function assignDeliverer(id: number, deliverer_id: number) {
  const delivery = await prisma.delivery.findUnique({ where: { id } });
  if (!delivery) {
    throw appError('Entrega nao encontrada.', 404);
  }

  const user = await prisma.user.findUnique({ where: { id: deliverer_id } });
  if (!user || user.role !== 'ENTREGADOR') {
    throw appError('Usuario nao e um entregador valido.', 400);
  }

  return prisma.delivery.update({
    where: { id },
    data: { deliverer_id },
    select: deliverySelect,
  });
}

/** 
 * Entregador atualiza o status de sua entrega.
 * Se status for ENTREGUE, atualiza tambem o pedido.
 */
export async function updateDeliveryStatus(id: number, deliverer_id: number, status: DeliveryStatus) {
  const delivery = await prisma.delivery.findUnique({ where: { id } });
  if (!delivery) {
    throw appError('Entrega nao encontrada.', 404);
  }

  if (delivery.deliverer_id !== deliverer_id) {
    throw appError('Essa entrega nao esta atribuida a voce.', 403);
  }

  return prisma.$transaction(async (tx) => {
    const updatedDelivery = await tx.delivery.update({
      where: { id },
      data: { status },
      select: deliverySelect,
    });

    if (status === 'ENTREGUE') {
      await tx.order.update({
        where: { id: delivery.order_id },
        data: { status: 'ENTREGUE' },
      });
      updatedDelivery.order.status = 'ENTREGUE';
    }

    return updatedDelivery;
  });
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# controllers/delivery.controller.ts
# ─────────────────────────────────────────────────────────────────────────────
files["controllers/delivery.controller.ts"] = """\
// src/controllers/delivery.controller.ts
import { Request, Response, NextFunction } from 'express';
import { DeliveryStatus } from '@prisma/client';
import * as deliveryService from '../services/delivery.service';

/** GET /deliveries */
export async function listDeliveries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.query;
    const deliveries = await deliveryService.listDeliveries(status as DeliveryStatus | undefined);
    res.status(200).json({ status: 'success', data: deliveries });
  } catch (err) {
    next(err);
  }
}

/** GET /deliveries/me */
export async function listMyDeliveries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deliverer_id = req.user!.sub;
    const deliveries = await deliveryService.listMyDeliveries(deliverer_id);
    res.status(200).json({ status: 'success', data: deliveries });
  } catch (err) {
    next(err);
  }
}

/** PATCH /deliveries/:id/assign */
export async function assignDeliverer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deliverer_id } = req.body;
    if (!deliverer_id) {
      res.status(400).json({ status: 'error', message: 'deliverer_id e obrigatorio.' });
      return;
    }
    const delivery = await deliveryService.assignDeliverer(Number(req.params.id), Number(deliverer_id));
    res.status(200).json({ status: 'success', data: delivery });
  } catch (err) {
    next(err);
  }
}

/** PATCH /deliveries/:id/status */
export async function updateDeliveryStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deliverer_id = req.user!.sub;
    const { status } = req.body as { status: DeliveryStatus };

    if (!Object.values(DeliveryStatus).includes(status)) {
      res.status(400).json({
        status: 'error',
        message: 'Status invalido. Valores aceitos: ' + Object.values(DeliveryStatus).join(', '),
      });
      return;
    }

    const delivery = await deliveryService.updateDeliveryStatus(Number(req.params.id), deliverer_id, status);
    res.status(200).json({ status: 'success', data: delivery });
  } catch (err) {
    next(err);
  }
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# routes/delivery.routes.ts
# ─────────────────────────────────────────────────────────────────────────────
files["routes/delivery.routes.ts"] = """\
// src/routes/delivery.routes.ts
import { Router } from 'express';
import {
  listDeliveries,
  listMyDeliveries,
  assignDeliverer,
  updateDeliveryStatus,
} from '../controllers/delivery.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';

const deliveryRouter = Router();

deliveryRouter.use(authMiddleware);

// ATENDENTE ou ADMINISTRADOR
deliveryRouter.get('/', requireRole('ATENDENTE', 'ADMINISTRADOR'), listDeliveries);
deliveryRouter.patch('/:id/assign', requireRole('ATENDENTE', 'ADMINISTRADOR'), assignDeliverer);

// ENTREGADOR
deliveryRouter.get('/me', requireRole('ENTREGADOR'), listMyDeliveries);
deliveryRouter.patch('/:id/status', requireRole('ENTREGADOR'), updateDeliveryStatus);

export { deliveryRouter };
"""

# ─────────────────────────────────────────────────────────────────────────────
# Escrever novos arquivos
# ─────────────────────────────────────────────────────────────────────────────
for rel_path, content in files.items():
    full_path = BASE / rel_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_text(content, encoding="utf-8")
    print(f"  OK  {rel_path}")

print("\\nArquivos de entrega criados com sucesso.")
