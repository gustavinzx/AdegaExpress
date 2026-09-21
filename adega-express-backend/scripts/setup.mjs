import { readFile, writeFile, access } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, '.env');
let exists = false;
try {
  await access(target);
  exists = true;
} catch {
  /* New environment. */
}
if (exists) {
  console.log(
    '.env existente preservado. Confira DATABASE_URL, JWT_SECRET e PORT seguindo o README.',
  );
} else {
  const template = await readFile(resolve(root, '.env.example'), 'utf8');
  await writeFile(
    target,
    template.replace('GENERATE_WITH_NPM_RUN_SETUP', randomBytes(48).toString('hex')),
    { flag: 'wx', mode: 0o600 },
  );
  console.log(
    '.env criado com JWT_SECRET aleatório. Configure DATABASE_URL e ADMIN_EMAIL/ADMIN_PASSWORD antes de continuar.',
  );
}
