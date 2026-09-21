import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({ log: [] });
let failed = false;
const result = (ok, message) => {
  console.log(`${ok ? 'OK' : 'ERRO'}: ${message}`);
  if (!ok) {
    failed = true;
  }
};
result(Number(process.versions.node.split('.')[0]) >= 20, 'Node.js 20 ou superior');
result(
  Boolean(
    process.env.JWT_SECRET &&
    process.env.JWT_SECRET.length >= 32 &&
    !/GENERATE|troque|change.me/i.test(process.env.JWT_SECRET),
  ),
  'JWT_SECRET aleatório com pelo menos 32 caracteres',
);
try {
  await db.$connect();
  result(true, 'Conexão com MySQL');
  const migrations =
    await db.$queryRaw`SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations`;
  const ready = migrations.some(
    (m) =>
      m.migration_name === '20260921120000_backend_business_rules' &&
      m.finished_at &&
      !m.rolled_back_at,
  );
  result(ready, 'Migration de regras de negócio aplicada');
  if (ready) {
    result(
      (await db.user.count({ where: { role: 'ADMINISTRADOR', active: true } })) > 0,
      'Administrador ativo cadastrado',
    );
  }
} catch (error) {
  const code = error.errorCode || error.code || 'UNKNOWN';
  const hints = {
    P1000: 'Credenciais recusadas. Corrija DATABASE_URL no .env.',
    P1001: 'Servidor MySQL inacessível. Confira serviço, host e porta.',
    P1003: 'Banco não existe. Crie o banco antes das migrations.',
    P2010: 'Tabela de migrations não disponível. Execute npm run prisma:deploy.',
  };
  result(
    false,
    hints[code] || `Falha de banco (${code}). Consulte o README; credenciais não serão exibidas.`,
  );
} finally {
  await db.$disconnect();
}
console.log(`Porta configurada da API: ${process.env.PORT || '3001'}. Documentação: /docs`);
if (failed) {
  process.exitCode = 1;
}
