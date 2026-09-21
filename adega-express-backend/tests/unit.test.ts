import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import {
  businessDate,
  isAdult,
  startBusinessDay,
  discountedTotal,
  assertOrderTransition,
  assertDeliveryTransition,
} from '../src/lib/business';
import * as s from '../src/schemas';

test('maioridade considera aniversário completo e data civil de São Paulo', () => {
  const now = new Date('2026-09-21T15:00:00Z');
  assert.equal(isAdult(new Date('2008-09-21'), now), true);
  assert.equal(isAdult(new Date('2008-09-22'), now), false);
  assert.equal(businessDate(new Date('2026-09-21T01:00:00Z')), '2026-09-20');
  assert.equal(isAdult(new Date('2008-09-21'), new Date('2026-09-21T01:00:00Z')), false);
});
test('datas impossíveis e ano inferior a 1900 são rejeitados', () => {
  for (const date of ['2025-02-29', '2026-04-31', '0000-01-01', '21/09/2000']) {
    assert.equal(s.date.safeParse(date).success, false);
  }
  assert.equal(s.date.safeParse('2000-02-29').success, true);
});
test('relatórios respeitam o fuso e o horário de verão histórico', () => {
  assert.equal(startBusinessDay('2026-09-21').toISOString(), '2026-09-21T03:00:00.000Z');
  assert.equal(startBusinessDay('2018-12-01').toISOString(), '2018-12-01T02:00:00.000Z');
  assert.equal(startBusinessDay('2018-11-04').toISOString(), '2018-11-04T03:00:00.000Z');
});
test('desconto utiliza decimal, arredonda centavos e nunca fica negativo', () => {
  assert.equal(
    discountedTotal(new Prisma.Decimal('10.05'), 'PERCENTUAL', new Prisma.Decimal(10)).toFixed(2),
    '9.05',
  );
  assert.equal(
    discountedTotal(new Prisma.Decimal(10), 'FIXO', new Prisma.Decimal(20)).toFixed(2),
    '0.00',
  );
});
test('quantidades fracionárias, repetição de item e forma de pagamento desconhecida são rejeitadas', () => {
  const base = { address_id: 1, payment_method: 'PIX', items: [{ product_id: 1, quantity: 1 }] };
  assert.equal(s.checkout.safeParse(base).success, true);
  assert.equal(
    s.checkout.safeParse({ ...base, items: [{ product_id: 1, quantity: 0.5 }] }).success,
    false,
  );
  assert.equal(
    s.checkout.safeParse({ ...base, items: [...base.items, ...base.items] }).success,
    false,
  );
  assert.equal(s.checkout.safeParse({ ...base, payment_method: 'BOLETO' }).success, false);
});
test('preços negativos, NaN e precisão excessiva são rejeitados', () => {
  for (const value of [-1, NaN, Infinity, 10.001]) {
    assert.equal(s.money.safeParse(value).success, false);
  }
  assert.equal(s.money.safeParse(19.99).success, true);
});
test('senha evita truncamento silencioso do bcrypt em UTF-8', () => {
  const data = {
    name: 'Cliente',
    email: 'test@example.com',
    password: 'á'.repeat(40),
    birth_date: '2000-01-01',
  };
  assert.equal(s.register.safeParse(data).success, false);
  assert.equal(s.register.safeParse({ ...data, password: 'uma-senha-longa' }).success, true);
});
test('máquina de estados rejeita saltos e reabertura de pedidos', () => {
  assert.doesNotThrow(() => assertOrderTransition('PENDENTE', 'CONFIRMADO'));
  assert.throws(() => assertOrderTransition('PENDENTE', 'ENTREGUE'));
  assert.throws(() => assertOrderTransition('CANCELADO', 'CONFIRMADO'));
  assert.throws(() => assertDeliveryTransition('AGUARDANDO', 'ENTREGUE'));
  assert.throws(() => assertDeliveryTransition('ENTREGUE', 'AGUARDANDO'));
});
test('paginação e filtros rejeitam limites abusivos e faixas invertidas', () => {
  assert.deepEqual(s.pagination.parse({}), { page: 1, limit: 20 });
  for (const query of [{ limit: '101' }, { page: '-1' }, { page: '1.5' }]) {
    assert.equal(s.pagination.safeParse(query).success, false);
  }
  assert.equal(s.productQuery.safeParse({ min_price: '20', max_price: '10' }).success, false);
});
test('cupom percentual tem limite e vigência coerente', () => {
  const data = {
    code: 'teste',
    discount_type: 'PERCENTUAL',
    discount_value: 10,
    valid_from: '2026-01-01',
    valid_until: '2026-12-31',
  };
  assert.equal(s.coupon.parse(data).code, 'TESTE');
  assert.equal(s.coupon.safeParse({ ...data, discount_value: 101 }).success, false);
  assert.equal(s.coupon.safeParse({ ...data, valid_until: '2025-01-01' }).success, false);
});
