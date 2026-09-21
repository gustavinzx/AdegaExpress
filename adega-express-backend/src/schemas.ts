import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);
export const id = z.number().int().positive().max(2147483647);
export const money = z
  .number()
  .finite()
  .min(0)
  .max(99999999.99)
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001,
    'Use no máximo duas casas decimais.',
  );
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + 'T00:00:00.000Z');
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v && v >= '1900-01-01';
  }, 'Data inválida; use AAAA-MM-DD.');
const password = z
  .string()
  .min(8)
  .max(72)
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Senha deve ter até 72 bytes.');
export const register = z
  .object({
    name: text(150),
    email: z.string().trim().toLowerCase().email().max(200),
    password,
    cpf: z.string().max(14).optional(),
    birth_date: date,
  })
  .strict();
export const login = z
  .object({
    email: z.string().trim().toLowerCase().email().max(200),
    password: z.string().min(1).max(256),
  })
  .strict();
export const staff = register.extend({
  role: z.enum(['ADMINISTRADOR', 'ATENDENTE', 'ENTREGADOR']),
});
export const active = z.object({ active: z.boolean() }).strict();
export const passwordChange = z
  .object({ current_password: z.string().min(1).max(256), new_password: password })
  .strict();
const states = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;
export const address = z
  .object({
    street: text(200),
    number: text(20),
    complement: text(100).nullable().optional(),
    neighborhood: text(100),
    city: text(100),
    state: z.enum(states),
    zip: z.string().regex(/^\d{5}-?\d{3}$/),
    is_default: z.boolean().default(false),
  })
  .strict();
export const category = z
  .object({ name: text(100), description: text(5000).nullable().optional() })
  .strict();
export const product = z
  .object({
    name: text(200),
    description: text(5000).nullable().optional(),
    category_id: id,
    price: money.refine((v) => v > 0, 'Preço deve ser positivo.'),
    volume_ml: id,
    abv_percent: z.number().min(0).max(100).multipleOf(0.01),
    brand: text(150),
    stock_quantity: z.number().int().min(0).max(1000000).default(0),
    image_url: z
      .string()
      .url()
      .max(500)
      .refine((v) => /^https?:\/\//.test(v), 'Use HTTP ou HTTPS.')
      .nullable()
      .optional(),
  })
  .strict();
export const productUpdate = product
  .omit({ stock_quantity: true })
  .extend({ active: z.boolean() })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Informe ao menos um campo.');
export const stock = z
  .object({
    type: z.enum(['ENTRADA', 'SAIDA']),
    quantity: z.number().int().min(1).max(1000000),
    reason: text(300),
  })
  .strict();
export const coupon = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,50}$/),
    discount_type: z.enum(['PERCENTUAL', 'FIXO']),
    discount_value: money.refine((v) => v > 0),
    valid_from: date,
    valid_until: date,
    active: z.boolean().default(true),
  })
  .strict()
  .refine(
    (v) => v.valid_until >= v.valid_from,
    'Vigência final deve ser posterior ou igual à inicial.',
  )
  .refine(
    (v) => v.discount_type !== 'PERCENTUAL' || v.discount_value <= 100,
    'Desconto percentual não pode exceder 100.',
  );
export const checkout = z
  .object({
    address_id: id,
    payment_method: z.enum(['PIX', 'CARTAO']),
    coupon_code: z.string().trim().toUpperCase().min(3).max(50).optional(),
    items: z
      .array(z.object({ product_id: id, quantity: z.number().int().min(1).max(1000000) }).strict())
      .min(1)
      .max(100),
  })
  .strict()
  .refine(
    (v) => new Set(v.items.map((i) => i.product_id)).size === v.items.length,
    'Agrupe produtos repetidos em um único item.',
  );
export const orderStatus = z
  .object({
    status: z.enum(['PENDENTE', 'CONFIRMADO', 'SEPARADO', 'EM_ROTA', 'ENTREGUE', 'CANCELADO']),
    reason: text(300).optional(),
  })
  .strict();
export const cancel = z.object({ reason: text(300) }).strict();
export const deliveryStatus = z
  .object({ status: z.enum(['AGUARDANDO', 'SAIU_PARA_ENTREGA', 'ENTREGUE']) })
  .strict();
export const assignment = z.object({ deliverer_id: id }).strict();
export const payment = z
  .object({ status: z.enum(['PAGO', 'ESTORNADO']), reference: text(150) })
  .strict();
const positiveQuery = z.string().regex(/^\d+$/).transform(Number).pipe(id);
export const pagination = z.object({
  page: positiveQuery.default(1),
  limit: positiveQuery.pipe(z.number().max(100)).default(20),
});
const amountQuery = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/)
  .transform(Number)
  .pipe(money);
export const productQuery = pagination
  .extend({
    category_id: positiveQuery.optional(),
    name: text(200).optional(),
    brand: text(150).optional(),
    min_price: amountQuery.optional(),
    max_price: amountQuery.optional(),
    min_abv: amountQuery.pipe(z.number().max(100)).optional(),
    max_abv: amountQuery.pipe(z.number().max(100)).optional(),
    active: z.enum(['true', 'false']).optional(),
  })
  .strict()
  .refine(
    (v) => v.min_price === undefined || v.max_price === undefined || v.min_price <= v.max_price,
    'Faixa de preço inválida.',
  )
  .refine(
    (v) => v.min_abv === undefined || v.max_abv === undefined || v.min_abv <= v.max_abv,
    'Faixa de teor alcoólico inválida.',
  );
export const orderQuery = pagination
  .extend({ status: orderStatus.shape.status.optional() })
  .strict();
export const deliveryQuery = pagination
  .extend({ status: deliveryStatus.shape.status.optional() })
  .strict();
export const reportQuery = z
  .object({ from: date, to: date })
  .strict()
  .refine(
    (v) =>
      v.to >= v.from && new Date(v.to).getTime() - new Date(v.from).getTime() <= 366 * 86400000,
    'Período deve ter até 366 dias e início anterior ao fim.',
  );
export type CheckoutInput = z.infer<typeof checkout>;
export type Page = z.infer<typeof pagination>;
