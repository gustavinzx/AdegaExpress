import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().startsWith('mysql://'),
  JWT_SECRET: z
    .string()
    .min(32)
    .refine(
      (v) => !/GENERATE_WITH|troque|change.me|seu.segredo/i.test(v),
      'Configure um segredo aleatório.',
    ),
  JWT_EXPIRES_IN: z.enum(['15m', '1h', '8h', '1d', '7d']).default('8h'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  SHIPPING_FEE: z
    .string()
    .regex(/^\d{1,5}(\.\d{1,2})?$/)
    .default('0.00'),
  DELIVERY_CITIES: z.string().default(''),
  DELIVERY_STATE: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Never print values: the environment contains database credentials and secrets.
  throw new Error(
    'Configuração inválida: ' + parsed.error.issues.map((i) => i.path.join('.')).join(', '),
  );
}
export const config = parsed.data;
