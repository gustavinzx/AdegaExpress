import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Role } from '@prisma/client';
import prisma from './prisma.service';
import { config } from '../config';
import { AppError } from '../lib/errors';
import { isAdult } from '../lib/business';
import * as schemas from '../schemas';

export const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  birth_date: true,
  active: true,
  created_at: true,
} as const;
export type RegisterInput = z.infer<typeof schemas.register>;
export type LoginInput = z.infer<typeof schemas.login>;
export async function register(input: RegisterInput, role: Role = 'CLIENTE') {
  const birthDate = new Date(input.birth_date + 'T00:00:00Z');
  if (!isAdult(birthDate)) {
    throw new AppError(400, 'É necessário ter 18 anos ou mais.');
  }
  const password_hash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, password_hash, birth_date: birthDate, role, cpf: input.cpf },
    select: userSelect,
  });
  if (role !== 'CLIENTE') {
    return { user };
  }
  return { user, token: signToken(user.id, role, 0) };
}
function signToken(id: number, role: Role, version: number): string {
  return jwt.sign({ sub: id, role, ver: version }, config.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: config.JWT_EXPIRES_IN,
  });
}
const dummyHash = bcrypt.hash('unused-comparison-value', 12);
export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const matches = await bcrypt.compare(input.password, user?.password_hash ?? (await dummyHash));
  if (!user || !matches || !user.active) {
    throw new AppError(401, 'Email ou senha inválidos.');
  }
  return { token: signToken(user.id, user.role, user.token_version), user: await me(user.id) };
}
export async function me(id: number) {
  return prisma.user.findUniqueOrThrow({ where: { id }, select: userSelect });
}
export async function logout(id: number) {
  await prisma.user.update({ where: { id }, data: { token_version: { increment: 1 } } });
}
export async function changePassword(id: number, input: z.infer<typeof schemas.passwordChange>) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  if (!(await bcrypt.compare(input.current_password, user.password_hash))) {
    throw new AppError(400, 'Senha atual incorreta.');
  }
  const password_hash = await bcrypt.hash(input.new_password, 12);
  await prisma.user.update({
    where: { id },
    data: { password_hash, token_version: { increment: 1 } },
  });
}
