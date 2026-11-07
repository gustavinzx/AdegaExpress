import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from './prisma.service';
import { transaction } from '../lib/transaction';
import { AppError } from '../lib/errors';
import {
  ALLOWED_CATEGORIES,
  isAllowedCategoryName,
  isNonAlcoholicProductName,
} from '../lib/business';
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
const includeCategory = {
  category: { select: { id: true, name: true, description: true, active: true } },
} as const;
export async function listProducts(input: z.infer<typeof schemas.productQuery>, admin = false) {
  const where: Prisma.ProductWhereInput = {
    ...(admin
      ? input.active
        ? { active: input.active === 'true' }
        : {}
      : {
          active: true,
          abv_percent: 0,
          category: { active: true, name: { in: [...ALLOWED_CATEGORIES] } },
        }),
    category_id: input.category_id,
    name: input.name ? { contains: input.name } : undefined,
    brand: input.brand ? { contains: input.brand } : undefined,
    volume_ml: input.volume_ml,
    price: { gte: input.min_price, lte: input.max_price },
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
    where: {
      id,
      active: true,
      abv_percent: 0,
      category: { active: true, name: { in: [...ALLOWED_CATEGORIES] } },
    },
    include: includeCategory,
  });
  if (!product) {
    throw new AppError(404, 'Produto não encontrado.');
  }
  return { ...product, in_stock: product.stock_quantity > 0 };
}
export async function createProduct(input: z.infer<typeof schemas.product>, actor_id: number) {
  return transaction(async (tx) => {
    const category = await tx.category.findUnique({ where: { id: input.category_id } });
    if (!category || !category.active || !isAllowedCategoryName(category.name)) {
      throw new AppError(
        400,
        'Categoria inválida, inativa ou fora do escopo de bebidas não alcoólicas.',
      );
    }
    const duplicate = await tx.product.findFirst({
      where: { name: input.name, brand: input.brand },
    });
    if (duplicate) {
      throw new AppError(409, 'Já existe produto cadastrado com este nome e marca.');
    }
    const product = await tx.product.create({
      data: { ...input, abv_percent: 0 },
      include: includeCategory,
    });
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
  return transaction(async (tx) => {
    const current = await tx.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!current) {
      throw new AppError(404, 'Produto não encontrado.');
    }
    const targetCategoryId = input.category_id ?? current.category_id;
    const category = await tx.category.findUnique({ where: { id: targetCategoryId } });
    if (!category) {
      throw new AppError(400, 'Categoria não encontrada.');
    }
    const targetActive = input.active ?? current.active;
    const targetName = input.name ?? current.name;
    const targetDesc = input.description !== undefined ? input.description : current.description;
    if (targetActive) {
      if (!category.active || !isAllowedCategoryName(category.name)) {
        throw new AppError(
          400,
          'Não é possível manter ou ativar produto em categoria inativa ou fora do escopo não alcoólico.',
        );
      }
      if (!isNonAlcoholicProductName(targetName, targetDesc)) {
        throw new AppError(400, 'Produto fora do escopo acadêmico de bebidas não alcoólicas.');
      }
    }
    const updated = await tx.product.update({
      where: { id },
      data: {
        ...input,
        ...(targetActive ? { abv_percent: 0 } : {}),
      },
      include: includeCategory,
    });
    return { ...updated, in_stock: updated.stock_quantity > 0 };
  });
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
export async function listCategories(input: z.infer<typeof schemas.categoryQuery>, admin = false) {
  const where: Prisma.CategoryWhereInput =
    admin && input.include_inactive === 'true'
      ? {}
      : { active: true, name: { in: [...ALLOWED_CATEGORIES] } };
  const [items, count] = await prisma.$transaction([
    prisma.category.findMany({ where, ...pageArgs(input), orderBy: { name: 'asc' } }),
    prisma.category.count({ where }),
  ]);
  return paged(items, count, input);
}
export async function saveCategory(input: z.infer<typeof schemas.category>, id?: number) {
  return id
    ? prisma.category.update({ where: { id }, data: input })
    : prisma.category.create({ data: input });
}
export async function deleteCategory(id: number) {
  const linkedProducts = await prisma.product.count({ where: { category_id: id } });
  if (linkedProducts > 0) {
    throw new AppError(
      409,
      'Categoria possui produtos vinculados. Desative a categoria em vez de excluí-la.',
    );
  }
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
