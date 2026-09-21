import { config } from './config';
import app from './app';
import prisma from './services/prisma.service';

async function start(): Promise<void> {
  await prisma.$connect();
  const server = app.listen(config.PORT, () =>
    console.info(`Adega Express API: http://localhost:${config.PORT}/docs`),
  );
  server.on('error', () => {
    console.error('Falha ao iniciar servidor. Verifique se a porta está disponível.');
    void prisma.$disconnect().finally(() => process.exit(1));
  });
  const shutdown = () => {
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(() => {
      void prisma.$disconnect().finally(() => {
        clearTimeout(timeout);
        process.exit(0);
      });
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
void start().catch(() => {
  console.error(
    'Não foi possível iniciar a API. Confira DATABASE_URL, credenciais do MySQL e migrations.',
  );
  void prisma.$disconnect().finally(() => process.exit(1));
});
