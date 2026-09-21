import { z } from 'zod';
import prisma from './prisma.service';
import { transaction } from '../lib/transaction';
import { AppError } from '../lib/errors';
import { address } from '../schemas';

export async function listAddresses(user_id: number) {
  return prisma.address.findMany({
    where: { user_id, archived: false },
    orderBy: [{ is_default: 'desc' }, { id: 'asc' }],
  });
}
export async function saveAddress(user_id: number, input: z.infer<typeof address>, id?: number) {
  return transaction(async (tx) => {
    if (id && !(await tx.address.findFirst({ where: { id, user_id, archived: false } }))) {
      throw new AppError(404, 'Endereço não encontrado.');
    }
    const existing = await tx.address.findFirst({
      where: { user_id, archived: false, is_default: true },
    });
    const is_default = input.is_default || !existing || existing.id === id;
    if (is_default) {
      await tx.address.updateMany({
        where: { user_id, archived: false },
        data: { is_default: false },
      });
    }
    const data = {
      ...input,
      user_id,
      is_default,
      zip: input.zip.replace(/^(\d{5})(\d{3})$/, '$1-$2'),
    };
    return id ? tx.address.update({ where: { id }, data }) : tx.address.create({ data });
  });
}
export async function deleteAddress(user_id: number, id: number) {
  return transaction(async (tx) => {
    const address = await tx.address.findFirst({ where: { id, user_id, archived: false } });
    if (!address) {
      throw new AppError(404, 'Endereço não encontrado.');
    }
    await tx.address.update({ where: { id }, data: { archived: true, is_default: false } });
    if (address.is_default) {
      const next = await tx.address.findFirst({
        where: { user_id, archived: false },
        orderBy: { id: 'asc' },
      });
      if (next) {
        await tx.address.update({ where: { id: next.id }, data: { is_default: true } });
      }
    }
  });
}
