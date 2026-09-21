import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { register } from '../src/schemas';

const db = new PrismaClient({ log: [] });
async function seed(): Promise<void> {
  const input = register.parse({
    name: process.env.ADMIN_NAME || 'Administrador Adega Express',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    birth_date: '1990-01-01',
  });
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    if (existing.role !== 'ADMINISTRADOR' || !existing.active) {
      throw new Error(
        'O email informado já pertence a uma conta sem acesso administrativo ativo. Nenhum perfil foi alterado.',
      );
    }
    console.info('Administrador já cadastrado. Senha e dados existentes preservados.');
    return;
  }
  if (await db.user.count({ where: { role: 'ADMINISTRADOR' } })) {
    throw new Error('Já existe administrador. Cadastre novos membros pela API /staff.');
  }
  await db.user.create({
    data: {
      name: input.name,
      email: input.email,
      password_hash: await bcrypt.hash(input.password, 12),
      role: 'ADMINISTRADOR',
    },
  });
  console.info('Administrador inicial criado. Use as credenciais configuradas no .env.');
}
void seed()
  .catch(() => {
    console.error(
      'Seed não concluído. Verifique ADMIN_EMAIL/ADMIN_PASSWORD, conexão, migrations e se já existe administrador. Nenhuma senha existente é redefinida.',
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
