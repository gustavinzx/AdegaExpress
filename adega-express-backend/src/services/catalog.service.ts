import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from './prisma.service';
import { transaction } from '../lib/transaction';
import { AppError } from '../lib/errors';
import * as schemas from '../schemas';

export function pageArgs(page: schemas.Page) {
  return { skip: (page.page - 1) * page.limit, take: page.limit };
}
export function paged<T>(data: T[], total: number, page: schemas.Page) {
  return {
    data,
    meta: { page: page.page, limit: page.limit, total, total_pages: Math.ceil(total / page.limit) },
  };
}
const includeCategory = { category: { select: { id: true, name: true } } } as const;
export async function listProducts(input: z.infer<typeof schemas.productQuery>, admin = false) {
  const where: Prisma.ProductWhereInput = {
    ...(admin ? (input.active ? { active: input.active === 'true' } : {}) : { active: true }),
    category_id: input.category_id,
    name: input.name ? { contains: input.name } : undefined,
    brand: input.brand ? { contains: input.brand } : undefined,
    price: { gte: input.min_price, lte: input.max_price },
    abv_percent: { gte: input.min_abv, lte: input.max_abv },
  };
  const [items, count] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: includeCategory,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      ...pageArgs(input),
    }),
    prisma.product.count({ where }),
  ]);
  return paged(
    items.map((p) => ({ ...p, in_stock: p.stock_quantity > 0 })),
    count,
    input,
  );
}
export async function getProduct(id: number) {
  const product = await prisma.product.findFirst({
    where: { id, active: true },
    include: includeCategory,
  });
  if (!product) {
    throw new AppError(404, 'Produto não encontrado.');
  }
  return { ...product, in_stock: product.stock_quantity > 0 };
}
export async function createProduct(input: z.infer<typeof schemas.product>, actor_id: number) {
  return transaction(async (tx) => {
    const product = await tx.product.create({ data: input, include: includeCategory });
    if (input.stock_quantity > 0) {
      await tx.stockMovement.create({
        data: {
          product_id: product.id,
          type: 'ENTRADA',
          quantity: input.stock_quantity,
          actor_id,
          reason: 'Estoque inicial',
        },
      });
    }
    return { ...product, in_stock: product.stock_quantity > 0 };
  });
}
export async function updateProduct(id: number, input: z.infer<typeof schemas.productUpdate>) {
  return prisma.product.update({ where: { id }, data: input, include: includeCategory });
}
export async function moveStock(
  product_id: number,
  input: z.infer<typeof schemas.stock>,
  actor_id: number,
) {
  return transaction(async (tx) => {
    const exists = await tx.product.findUnique({ where: { id: product_id } });
    if (!exists) {
      throw new AppError(404, 'Produto não encontrado.');
    }
    const result = await tx.product.updateMany({
      where: {
        id: product_id,
        stock_quantity:
          input.type === 'SAIDA' ? { gte: input.quantity } : { lte: 2147483647 - input.quantity },
      },
      data: {
        stock_quantity:
          input.type === 'SAIDA' ? { decrement: input.quantity } : { increment: input.quantity },
      },
    });
    if (!result.count) {
      throw new AppError(409, 'Saldo de estoque insuficiente ou limite excedido.');
    }
    const movement = await tx.stockMovement.create({ data: { ...input, product_id, actor_id } });
    return { movement, product: await tx.product.findUniqueOrThrow({ where: { id: product_id } }) };
  });
}
export async function stockHistory(product_id: number, page: schemas.Page) {
  const [items, count] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where: { product_id },
      ...pageArgs(page),
      orderBy: { id: 'desc' },
    }),
    prisma.stockMovement.count({ where: { product_id } }),
  ]);
  return paged(items, count, page);
}
export async function listCategories(page: schemas.Page) {
  const [items, count] = await prisma.$transaction([
    prisma.category.findMany({ ...pageArgs(page), orderBy: { name: 'asc' } }),
    prisma.category.count(),
  ]);
  return paged(items, count, page);
}
export async function saveCategory(input: z.infer<typeof schemas.category>, id?: number) {
  return id
    ? prisma.category.update({ where: { id }, data: input })
    : prisma.category.create({ data: input });
}
export async function deleteCategory(id: number) {
  await prisma.category.delete({ where: { id } });
}
export async function saveCoupon(input: z.infer<typeof schemas.coupon>, id?: number) {
  const data = {
    ...input,
    valid_from: new Date(input.valid_from + 'T00:00:00Z'),
    valid_until: new Date(input.valid_until + 'T00:00:00Z'),
  };
  return id ? prisma.coupon.update({ where: { id }, data }) : prisma.coupon.create({ data });
}
export async function listCoupons(page: schemas.Page) {
  const [items, count] = await prisma.$transaction([
    prisma.coupon.findMany({ ...pageArgs(page), orderBy: { id: 'desc' } }),
    prisma.coupon.count(),
  ]);
  return paged(items, count, page);
}
