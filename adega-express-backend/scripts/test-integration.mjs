import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, access, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import mysql from 'mysql2/promise';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let server;
let directory;
let baselineDirectory;
let connection;
let localConnectionOptions;
let serverOutput = '';
const environment = {
  ...process.env,
  NODE_ENV: 'test',
  JWT_SECRET: randomBytes(48).toString('hex'),
  ADMIN_EMAIL: 'bootstrap@example.com',
  ADMIN_PASSWORD: randomBytes(24).toString('hex'),
  SHIPPING_FEE: '5.00',
  DELIVERY_CITIES: 'São Paulo',
  DELIVERY_STATE: 'SP',
  CORS_ORIGINS: 'http://localhost:3000',
};
function run(file, args, env = environment) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(file, args, { cwd: root, env, windowsHide: true, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) =>
      code === 0
        ? resolveRun()
        : reject(new Error(`Comando de teste terminou com código ${code}.`)),
    );
  });
}
async function freePort() {
  const socket = createServer();
  await new Promise((resolveListen) => socket.listen(0, '127.0.0.1', resolveListen));
  const port = socket.address().port;
  await new Promise((resolveClose) => socket.close(resolveClose));
  return port;
}
try {
  if (process.env.TEST_DATABASE_URL) {
    const target = new URL(process.env.TEST_DATABASE_URL);
    if (!/^\/adega_test_[a-z0-9_]+$/.test(target.pathname)) {
      throw new Error('TEST_DATABASE_URL deve apontar para banco vazio com prefixo adega_test_.');
    }
    environment.DATABASE_URL = target.toString();
    connection = await mysql.createConnection(environment.DATABASE_URL);
    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length) {
      throw new Error('O banco de testes precisa estar vazio. Nenhuma tabela será apagada.');
    }
  } else {
    const binary =
      process.env.MYSQLD_BIN ||
      (process.platform === 'win32'
        ? 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe'
        : '/usr/sbin/mysqld');
    await access(binary);
    directory = await mkdtemp(join(tmpdir(), 'adega-mysql-test-'));
    const data = join(directory, 'data');
    await mkdir(data);
    console.log('Inicializando MySQL descartável, sem usar o banco do .env...');
    await run(binary, ['--no-defaults', '--initialize-insecure', `--datadir=${data}`, '--console']);
    const port = await freePort();
    localConnectionOptions = { host: '127.0.0.1', port, user: 'root', connectTimeout: 1000 };
    server = spawn(
      binary,
      [
        '--no-defaults',
        `--datadir=${data}`,
        '--bind-address=127.0.0.1',
        `--port=${port}`,
        '--mysqlx=0',
        '--skip-log-bin',
        '--innodb-buffer-pool-size=64M',
        '--console',
      ],
      { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    server.stdout.on('data', (chunk) => {
      serverOutput += chunk.toString();
    });
    server.stderr.on('data', (chunk) => {
      serverOutput += chunk.toString();
    });
    server.on('error', (error) => {
      serverOutput += error.message;
    });
    for (let attempt = 0; attempt < 120; attempt++) {
      if (server.exitCode !== null) {
        throw new Error('MySQL de teste não iniciou: ' + serverOutput);
      }
      try {
        connection = await mysql.createConnection(localConnectionOptions);
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    if (!connection) {
      throw new Error('Tempo excedido iniciando MySQL de teste.');
    }
    const password = randomBytes(24).toString('hex');
    await connection.query('ALTER USER CURRENT_USER() IDENTIFIED BY ?', [password]);
    localConnectionOptions.password = password;
    await connection.query(
      'CREATE DATABASE adega_test_integration CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    );
    environment.DATABASE_URL = `mysql://root:${password}@127.0.0.1:${port}/adega_test_integration`;
  }
  await connection.end();
  connection = undefined;
  // Apply the original migrations, create a legacy purchase, then test the additive upgrade.
  baselineDirectory = await mkdtemp(join(tmpdir(), 'adega-migration-test-'));
  await cp(join(root, 'prisma', 'schema.prisma'), join(baselineDirectory, 'schema.prisma'));
  await mkdir(join(baselineDirectory, 'migrations'));
  for (const name of [
    '20260909223958_init',
    '20260909231557_make_deliverer_id_optional',
    'migration_lock.toml',
  ]) {
    await cp(
      join(root, 'prisma', 'migrations', name),
      join(baselineDirectory, 'migrations', name),
      { recursive: true },
    );
  }
  await run(process.execPath, [
    'node_modules/prisma/build/index.js',
    'migrate',
    'deploy',
    '--schema',
    join(baselineDirectory, 'schema.prisma'),
  ]);
  connection = await mysql.createConnection(environment.DATABASE_URL);
  const [user] = await connection.query(
    "INSERT INTO users(name,email,password_hash,role,birth_date) VALUES ('Legado','legacy@example.com','invalid-login-hash','CLIENTE','1990-01-01')",
  );
  const [address] = await connection.query(
    "INSERT INTO addresses(user_id,street,number,neighborhood,city,state,zip) VALUES (?,'Rua Legada','1','Centro','São Paulo','SP','01001-000')",
    [user.insertId],
  );
  const [category] = await connection.query("INSERT INTO categories(name) VALUES ('Legado')");
  const [product] = await connection.query(
    "INSERT INTO products(name,category_id,price,volume_ml,abv_percent,brand,stock_quantity) VALUES ('Produto Legado',?,10,350,4.5,'Legado',8)",
    [category.insertId],
  );
  const [order] = await connection.query(
    "INSERT INTO orders(user_id,address_id,status,total,payment_method,updated_at) VALUES (?,?,'ENTREGUE',18,'PIX',NOW())",
    [user.insertId, address.insertId],
  );
  await connection.query(
    'INSERT INTO order_items(order_id,product_id,quantity,unit_price) VALUES (?,?,2,10)',
    [order.insertId, product.insertId],
  );
  await connection.end();
  connection = undefined;
  await run(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy']);
  for (let i = 0; i < 2; i++) {
    await run(process.execPath, ['--import', 'tsx', 'prisma/seed.ts']);
    await run(process.execPath, ['--import', 'tsx', 'prisma/seed-demo.ts']);
  }
  await run(process.execPath, [
    '--import',
    'tsx',
    '--test',
    '--test-concurrency=1',
    'tests/integration.test.ts',
  ]);
  // Validate that migrations and the Prisma schema produce the same structure.
  await run(process.execPath, [
    'node_modules/prisma/build/index.js',
    'migrate',
    'diff',
    '--from-schema-datasource',
    'prisma/schema.prisma',
    '--to-schema-datamodel',
    'prisma/schema.prisma',
    '--exit-code',
  ]);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha nos testes.');
  process.exitCode = 1;
} finally {
  if (connection) {
    await connection.end();
  }
  if (server?.pid && server.exitCode === null) {
    try {
      const shutdown = await mysql.createConnection(localConnectionOptions);
      await shutdown.query('SHUTDOWN');
      await shutdown.end();
    } catch {
      server.kill();
    }
    if (server.exitCode === null) {
      await new Promise((r) => server.once('exit', r));
    }
  }
  // Only remove the exact temporary directory created by mkdtemp in this process.
  if (
    directory &&
    dirname(resolve(directory)) === resolve(tmpdir()) &&
    directory.startsWith(join(tmpdir(), 'adega-mysql-test-'))
  ) {
    await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  }
  if (
    baselineDirectory &&
    dirname(resolve(baselineDirectory)) === resolve(tmpdir()) &&
    baselineDirectory.startsWith(join(tmpdir(), 'adega-migration-test-'))
  ) {
    await rm(baselineDirectory, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  }
}
