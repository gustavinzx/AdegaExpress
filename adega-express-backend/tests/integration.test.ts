import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcrypt';
import SwaggerParser from '@apidevtools/swagger-parser';
import { Role } from '@prisma/client';
import app from '../src/app';
import prisma from '../src/services/prisma.service';
import { businessDate } from '../src/lib/business';
import { setUserActive } from '../src/services/admin.service';

const api = request(app);
const tokens: Record<string, string> = {};
const ids: Record<string, number> = {};
let categoryId: number;
let addressId: number;
let sequence = 0;
const address = {
  street: 'Rua Teste',
  number: '10',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zip: '01001000',
};
const auth = (token: string) => ({ Authorization: `Bearer ${tokens[token]}` });
async function product(stock = 10, price = 10) {
  const response = await api
    .post('/products')
    .set(auth('admin'))
    .send({
      name: `Produto ${++sequence}`,
      category_id: categoryId,
      price,
      volume_ml: 350,
      abv_percent: 4.5,
      brand: 'Teste',
      stock_quantity: stock,
    })
    .expect(201);
  return response.body.data.id as number;
}
async function order(productId: number, quantity = 1, extra = {}) {
  return api
    .post('/orders')
    .set(auth('client'))
    .send({
      address_id: addressId,
      payment_method: 'PIX',
      items: [{ product_id: productId, quantity }],
      ...extra,
    });
}
async function separated(productId: number) {
  const created = await order(productId);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const id = created.body.data.id as number;
  await api
    .patch(`/orders/${id}/status`)
    .set(auth('attendant'))
    .send({ status: 'CONFIRMADO' })
    .expect(200);
  const response = await api
    .patch(`/orders/${id}/status`)
    .set(auth('attendant'))
    .send({ status: 'SEPARADO' })
    .expect(200);
  return { id, deliveryId: response.body.data.delivery.id as number };
}
before(async () => {
  const password_hash = await bcrypt.hash('Teste-Seguro-123!', 12);
  const roles: Record<string, Role> = {
    admin: 'ADMINISTRADOR',
    attendant: 'ATENDENTE',
    driver: 'ENTREGADOR',
    otherDriver: 'ENTREGADOR',
    client: 'CLIENTE',
    stranger: 'CLIENTE',
  };
  for (const [name, role] of Object.entries(roles)) {
    const email = name.toLowerCase() + '@example.com';
    const user = await prisma.user.create({
      data: { name, email, role, password_hash, birth_date: new Date('1990-01-01') },
    });
    ids[name] = user.id;
    const logged = await api
      .post('/auth/login')
      .send({ email, password: 'Teste-Seguro-123!' })
      .expect(200);
    tokens[name] = logged.body.data.token;
  }
  categoryId = (
    await api.post('/categories').set(auth('admin')).send({ name: 'Bebidas' }).expect(201)
  ).body.data.id;
  addressId = (await api.post('/addresses').set(auth('client')).send(address).expect(201)).body.data
    .id;
});
after(async () => {
  await prisma.$disconnect();
});

test('saúde, OpenAPI e documentação estão disponíveis', async () => {
  await api.get('/health').expect(200);
  await api.get('/health/ready').expect(200);
  const spec = await api.get('/openapi.json').expect(200);
  assert.ok(Object.keys(spec.body.paths).length >= 25);
  await SwaggerParser.validate(spec.body);
  await api.get('/docs/').expect(200);
});
test('migração preserva pedidos antigos e não presume pagamento', async () => {
  const legacy = await prisma.order.findFirstOrThrow({
    where: { user: { email: 'legacy@example.com' } },
    include: { items: true },
  });
  assert.equal(Number(legacy.subtotal), 20);
  assert.equal(Number(legacy.discount), 2);
  assert.equal(Number(legacy.total), 18);
  assert.equal(legacy.payment_status, 'PENDENTE');
  assert.equal((legacy.address_snapshot as { street: string }).street, 'Rua Legada');
  assert.equal(legacy.items[0].product_name, 'Produto Legado');
});
test('seeds podem ser repetidos sem duplicar contas ou repor estoque', async () => {
  assert.equal(await prisma.user.count({ where: { email: 'bootstrap@example.com' } }), 1);
  assert.equal(
    await prisma.product.count({
      where: { description: 'Produto fictício para demonstração acadêmica.' },
    }),
    4,
  );
  const sample = await prisma.product.findFirstOrThrow({
    where: { name: 'Cerveja Pilsen Demonstração' },
  });
  assert.equal(sample.stock_quantity, 48);
  assert.equal(await prisma.stockMovement.count({ where: { product_id: sample.id } }), 1);
});
test('JSON inválido, rota inexistente e CORS retornam erros controlados', async () => {
  await api.post('/auth/register').set('Content-Type', 'application/json').send('{').expect(400);
  await api.get('/missing').expect(404);
  await api.get('/products').set('Origin', 'https://unknown.example').expect(403);
  const response = await api
    .options('/orders')
    .set('Origin', 'http://localhost:3000')
    .set('Access-Control-Request-Method', 'POST')
    .expect(204);
  assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:3000');
  assert.ok(response.headers['x-content-type-options']);
});
test('cadastro valida idade e não permite escalar perfil', async () => {
  const data = {
    name: 'Novo Cliente',
    email: 'NEW@example.com',
    password: 'Segredo-Teste-123',
    birth_date: '2000-01-01',
  };
  await api
    .post('/auth/register')
    .send({ ...data, birth_date: businessDate() })
    .expect(400);
  await api
    .post('/auth/register')
    .send({ ...data, role: 'ADMINISTRADOR' })
    .expect(400);
  const created = await api.post('/auth/register').send(data).expect(201);
  assert.equal(created.body.data.user.email, 'new@example.com');
  assert.equal(created.body.data.user.role, 'CLIENTE');
  assert.equal(created.body.data.user.password_hash, undefined);
  await api.post('/auth/register').send(data).expect(409);
  await api.post('/auth/login').send({ email: data.email, password: 'errada' }).expect(401);
});
test('permissões protegem catálogo, relatórios e pedidos', async () => {
  await api.post('/products').send({}).expect(401);
  await api.post('/products').set(auth('client')).send({}).expect(403);
  await api.get('/orders').set(auth('client')).expect(403);
  await api.get('/reports/sales?from=2026-01-01&to=2026-12-31').set(auth('attendant')).expect(403);
  await api.post('/orders').set(auth('driver')).send({}).expect(403);
});
test('endereços pertencem ao cliente e mantêm exatamente um padrão', async () => {
  await api.put(`/addresses/${addressId}`).set(auth('stranger')).send(address).expect(404);
  const another = await api
    .post('/addresses')
    .set(auth('client'))
    .send({ ...address, number: '20', is_default: true })
    .expect(201);
  const listed = await api.get('/addresses').set(auth('client')).expect(200);
  assert.equal(listed.body.data.filter((a: { is_default: boolean }) => a.is_default).length, 1);
  await api.delete(`/addresses/${another.body.data.id}`).set(auth('client')).expect(204);
  const restored = await api.get('/addresses').set(auth('client')).expect(200);
  assert.equal(restored.body.data[0].id, addressId);
  assert.equal(restored.body.data[0].is_default, true);
});
test('catálogo pagina, filtra e mantém produto sem estoque visível', async () => {
  const id = await product(0, 19.99);
  const item = await api.get(`/products/${id}`).expect(200);
  assert.equal(item.body.data.in_stock, false);
  const list = await api.get('/products?limit=1&brand=Teste&min_price=19&max_price=20').expect(200);
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.meta.limit, 1);
  await api.get('/products?limit=1000').expect(400);
  await api.get('/products/not-an-id').expect(400);
  await api.put(`/products/${id}`).set(auth('admin')).send({ stock_quantity: 100 }).expect(400);
});
test('movimentações registram entrada e impedem estoque negativo', async () => {
  const id = await product(2);
  await api
    .post(`/products/${id}/stock`)
    .set(auth('admin'))
    .send({ type: 'SAIDA', quantity: 3, reason: 'Avaria' })
    .expect(409);
  await api
    .post(`/products/${id}/stock`)
    .set(auth('admin'))
    .send({ type: 'ENTRADA', quantity: 5, reason: 'Reposição' })
    .expect(201);
  const history = await api.get(`/products/${id}/stock`).set(auth('admin')).expect(200);
  assert.equal(history.body.meta.total, 2);
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id } })).stock_quantity, 7);
});
test('cotação calcula frete e cupom válido até o fim do dia sem consumir estoque', async () => {
  const id = await product(5, 10.05);
  const today = businessDate();
  await api
    .post('/coupons')
    .set(auth('admin'))
    .send({
      code: 'HOJE10',
      discount_type: 'PERCENTUAL',
      discount_value: 10,
      valid_from: today,
      valid_until: today,
    })
    .expect(201);
  const quote = await api
    .post('/orders/quote')
    .set(auth('client'))
    .send({
      address_id: addressId,
      payment_method: 'PIX',
      coupon_code: 'hoje10',
      items: [{ product_id: id, quantity: 1 }],
    })
    .expect(200);
  assert.equal(Number(quote.body.data.total), 14.05);
  assert.equal(Number(quote.body.data.discount), 1);
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id } })).stock_quantity, 5);
});
test('cupom inválido faz rollback de pedido e estoque', async () => {
  const id = await product(5);
  const count = await prisma.order.count();
  assert.equal((await order(id, 1, { coupon_code: 'INVALIDO' })).status, 400);
  assert.equal(await prisma.order.count(), count);
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id } })).stock_quantity, 5);
});
test('checkout rejeita endereço de outro cliente e região não atendida', async () => {
  const id = await product();
  const other = await api.post('/addresses').set(auth('stranger')).send(address).expect(201);
  assert.equal((await order(id, 1, { address_id: other.body.data.id })).status, 400);
  const far = await api
    .post('/addresses')
    .set(auth('client'))
    .send({ ...address, city: 'Campinas' })
    .expect(201);
  assert.equal((await order(id, 1, { address_id: far.body.data.id })).status, 400);
});
test('maioridade é verificada novamente no checkout de contas legadas', async () => {
  const id = await product();
  await prisma.user.update({ where: { id: ids.client }, data: { birth_date: null } });
  try {
    assert.equal((await order(id)).status, 403);
  } finally {
    await prisma.user.update({
      where: { id: ids.client },
      data: { birth_date: new Date('1990-01-01') },
    });
  }
});
test('snapshot preserva endereço e nome do produto após edições', async () => {
  const id = await product();
  const created = await order(id);
  assert.equal(created.status, 201);
  const orderId = created.body.data.id;
  const originalName = created.body.data.items[0].product_name;
  await api
    .put(`/addresses/${addressId}`)
    .set(auth('client'))
    .send({ ...address, street: 'Outra Rua' })
    .expect(200);
  await api
    .put(`/products/${id}`)
    .set(auth('admin'))
    .send({ name: 'Nome novo', price: 20 })
    .expect(200);
  const saved = await api.get(`/orders/${orderId}`).set(auth('client')).expect(200);
  assert.equal(saved.body.data.address.street, address.street);
  assert.equal(saved.body.data.items[0].product_name, originalName);
  assert.equal(Number(saved.body.data.items[0].unit_price), 10);
  await api.get(`/orders/${orderId}`).set(auth('stranger')).expect(404);
  await api.get(`/orders/${orderId}`).set(auth('driver')).expect(403);
  await api.put(`/addresses/${addressId}`).set(auth('client')).send(address).expect(200);
});
test('Idempotency-Key impede duplicação e rejeita reutilização com outro conteúdo', async () => {
  const id = await product(10);
  const body = {
    address_id: addressId,
    payment_method: 'PIX',
    items: [{ product_id: id, quantity: 2 }],
  };
  const first = await api
    .post('/orders')
    .set(auth('client'))
    .set('Idempotency-Key', 'checkout-repeat-1')
    .send(body)
    .expect(201);
  const repeated = await api
    .post('/orders')
    .set(auth('client'))
    .set('Idempotency-Key', 'checkout-repeat-1')
    .send(body)
    .expect(200);
  assert.equal(repeated.body.data.id, first.body.data.id);
  assert.equal(repeated.headers['idempotency-replayed'], 'true');
  await api
    .post('/orders')
    .set(auth('client'))
    .set('Idempotency-Key', 'checkout-repeat-1')
    .send({ ...body, payment_method: 'CARTAO' })
    .expect(409);
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id } })).stock_quantity, 8);
});
test('compras simultâneas não vendem além do estoque', async () => {
  const id = await product(1);
  const results = await Promise.all([order(id), order(id)]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id } })).stock_quantity, 0);
  assert.equal(await prisma.orderItem.count({ where: { product_id: id } }), 1);
});
test('mesma chave simultânea produz apenas um pedido e uma baixa', async () => {
  const id = await product(2);
  const body = {
    address_id: addressId,
    payment_method: 'PIX',
    items: [{ product_id: id, quantity: 1 }],
  };
  const results = await Promise.all(
    [0, 1].map(() =>
      api
        .post('/orders')
        .set(auth('client'))
        .set('Idempotency-Key', 'concurrent-repeat-1')
        .send(body),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 201]);
  assert.equal(results[0].body.data.id, results[1].body.data.id);
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id } })).stock_quantity, 1);
});
test('cancelamento repetido devolve estoque uma única vez e impede reabertura', async () => {
  const id = await product(5);
  const created = await order(id, 2);
  const orderId = created.body.data.id;
  const results = await Promise.all(
    [0, 1].map(() =>
      api.post(`/orders/${orderId}/cancel`).set(auth('client')).send({ reason: 'Desistência' }),
    ),
  );
  assert.deepEqual(
    results.map((r) => r.status),
    [200, 200],
  );
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id } })).stock_quantity, 5);
  assert.equal(
    await prisma.stockMovement.count({
      where: { product_id: id, reason: `Cancelamento - Pedido #${orderId}` },
    }),
    1,
  );
  await api
    .patch(`/orders/${orderId}/status`)
    .set(auth('admin'))
    .send({ status: 'CONFIRMADO' })
    .expect(409);
});
test('pedido com item indisponível não debita os demais itens', async () => {
  const available = await product(3);
  const unavailable = await product(0);
  const response = await api
    .post('/orders')
    .set(auth('client'))
    .send({
      address_id: addressId,
      payment_method: 'PIX',
      items: [
        { product_id: available, quantity: 1 },
        { product_id: unavailable, quantity: 1 },
      ],
    });
  assert.equal(response.status, 409);
  assert.equal(
    (await prisma.product.findUniqueOrThrow({ where: { id: available } })).stock_quantity,
    3,
  );
  assert.equal(await prisma.orderItem.count({ where: { product_id: available } }), 0);
});
test('entrega cancelada não pode sair e entregador ocupado não pode ser desativado', async () => {
  const { id, deliveryId } = await separated(await product());
  await api
    .patch(`/deliveries/${deliveryId}/assign`)
    .set(auth('admin'))
    .send({ deliverer_id: ids.driver })
    .expect(200);
  await api
    .patch(`/users/${ids.driver}/active`)
    .set(auth('admin'))
    .send({ active: false })
    .expect(409);
  await api
    .patch(`/orders/${id}/status`)
    .set(auth('admin'))
    .send({ status: 'CANCELADO', reason: 'Cancelamento operacional' })
    .expect(200);
  await api
    .patch(`/deliveries/${deliveryId}/status`)
    .set(auth('driver'))
    .send({ status: 'SAIU_PARA_ENTREGA' })
    .expect(409);
  const listed = await api.get('/deliveries/me').set(auth('driver')).expect(200);
  assert.equal(
    listed.body.data.some((d: { id: number }) => d.id === deliveryId),
    false,
  );
});
test('fluxo operacional sincroniza pedido e entrega e exige pagamento para concluir', async () => {
  const { id, deliveryId } = await separated(await product());
  await api
    .patch(`/deliveries/${deliveryId}/assign`)
    .set(auth('attendant'))
    .send({ deliverer_id: ids.driver })
    .expect(200);
  await api
    .patch(`/deliveries/${deliveryId}/status`)
    .set(auth('otherDriver'))
    .send({ status: 'SAIU_PARA_ENTREGA' })
    .expect(404);
  await api
    .patch(`/deliveries/${deliveryId}/status`)
    .set(auth('driver'))
    .send({ status: 'ENTREGUE' })
    .expect(409);
  const out = await api
    .patch(`/deliveries/${deliveryId}/status`)
    .set(auth('driver'))
    .send({ status: 'SAIU_PARA_ENTREGA' })
    .expect(200);
  assert.equal(out.body.data.order.status, 'EM_ROTA');
  await api
    .patch(`/orders/${id}/status`)
    .set(auth('admin'))
    .send({ status: 'CANCELADO', reason: 'Teste' })
    .expect(409);
  await api
    .patch(`/deliveries/${deliveryId}/assign`)
    .set(auth('admin'))
    .send({ deliverer_id: ids.otherDriver })
    .expect(409);
  await api
    .patch(`/deliveries/${deliveryId}/status`)
    .set(auth('driver'))
    .send({ status: 'ENTREGUE' })
    .expect(409);
  await api
    .patch(`/orders/${id}/payment`)
    .set(auth('attendant'))
    .send({ status: 'PAGO', reference: 'PIX conferido no extrato de teste' })
    .expect(200);
  const done = await api
    .patch(`/deliveries/${deliveryId}/status`)
    .set(auth('driver'))
    .send({ status: 'ENTREGUE' })
    .expect(200);
  assert.equal(done.body.data.order.status, 'ENTREGUE');
  await api
    .patch(`/deliveries/${deliveryId}/status`)
    .set(auth('driver'))
    .send({ status: 'AGUARDANDO' })
    .expect(409);
  const history = await prisma.orderHistory.findMany({
    where: { order_id: id },
    orderBy: { id: 'asc' },
  });
  assert.deepEqual(
    history.map((h) => h.status),
    ['PENDENTE', 'CONFIRMADO', 'SEPARADO', 'EM_ROTA', 'ENTREGUE'],
  );
});
test('cancelar pedido pago exige estorno explícito e guarda registro', async () => {
  const created = await order(await product());
  const id = created.body.data.id;
  await api
    .patch(`/orders/${id}/payment`)
    .set(auth('attendant'))
    .send({ status: 'PAGO', reference: 'PIX recebido' })
    .expect(200);
  const cancelled = await api
    .post(`/orders/${id}/cancel`)
    .set(auth('client'))
    .send({ reason: 'Desistência' })
    .expect(200);
  assert.equal(cancelled.body.data.payment_status, 'ESTORNO_PENDENTE');
  await api
    .patch(`/orders/${id}/payment`)
    .set(auth('client'))
    .send({ status: 'ESTORNADO', reference: 'Proibido' })
    .expect(403);
  await api
    .patch(`/orders/${id}/payment`)
    .set(auth('admin'))
    .send({ status: 'ESTORNADO', reference: 'Devolução conferida' })
    .expect(200);
  assert.equal(await prisma.paymentRecord.count({ where: { order_id: id } }), 2);
  const history = await api.get(`/orders/${id}/payments`).set(auth('admin')).expect(200);
  assert.deepEqual(
    history.body.data.map((p: { status: string }) => p.status),
    ['PAGO', 'ESTORNADO'],
  );
  await api.get(`/orders/${id}/payments`).set(auth('client')).expect(403);
});
test('relatório distingue receitas pagas de pedidos pendentes e valida período', async () => {
  const today = businessDate();
  const report = await api
    .get(`/reports/sales?from=${today}&to=${today}`)
    .set(auth('admin'))
    .expect(200);
  const paid = await prisma.order.aggregate({
    where: { payment_status: 'PAGO', status: { not: 'CANCELADO' } },
    _sum: { total: true },
  });
  assert.equal(Number(report.body.data.paid_revenue), Number(paid._sum.total));
  await api.get('/reports/sales?from=2026-12-31&to=2026-01-01').set(auth('admin')).expect(400);
});
test('categoria vinculada não é apagada e produto desativado não pode ser comprado', async () => {
  await api.delete(`/categories/${categoryId}`).set(auth('admin')).expect(409);
  const id = await product();
  await api.delete(`/products/${id}`).set(auth('admin')).expect(204);
  await api.get(`/products/${id}`).expect(404);
  assert.equal((await order(id)).status, 400);
  const adminList = await api.get('/admin/products?active=false').set(auth('admin')).expect(200);
  assert.ok(adminList.body.data.some((p: { id: number }) => p.id === id));
});
test('desativação revoga acesso imediatamente e logout invalida o token', async () => {
  await api
    .patch(`/users/${ids.admin}/active`)
    .set(auth('admin'))
    .send({ active: false })
    .expect(400);
  await api
    .patch(`/users/${ids.stranger}/active`)
    .set(auth('admin'))
    .send({ active: false })
    .expect(200);
  await api.get('/auth/me').set(auth('stranger')).expect(401);
  await api.post('/auth/logout').set(auth('client')).expect(204);
  await api.get('/auth/me').set(auth('client')).expect(401);
});
test('troca de senha exige senha atual e revoga sessões anteriores', async () => {
  await api
    .patch('/auth/password')
    .set(auth('otherDriver'))
    .send({ current_password: 'incorreta', new_password: 'Nova-Senha-456!' })
    .expect(400);
  await api
    .patch('/auth/password')
    .set(auth('otherDriver'))
    .send({ current_password: 'Teste-Seguro-123!', new_password: 'Nova-Senha-456!' })
    .expect(204);
  await api.get('/auth/me').set(auth('otherDriver')).expect(401);
  await api
    .post('/auth/login')
    .send({ email: 'otherdriver@example.com', password: 'Teste-Seguro-123!' })
    .expect(401);
  await api
    .post('/auth/login')
    .send({ email: 'otherdriver@example.com', password: 'Nova-Senha-456!' })
    .expect(200);
});
test('equipe é criada pelo administrador e não recebe token de outro perfil', async () => {
  const input = {
    name: 'Novo Atendente',
    email: 'newstaff@example.com',
    password: 'Senha-Equipe-123!',
    birth_date: '1990-01-01',
    role: 'ATENDENTE',
  };
  await api.post('/staff').set(auth('attendant')).send(input).expect(403);
  const created = await api.post('/staff').set(auth('admin')).send(input).expect(201);
  assert.equal(created.body.data.user.role, 'ATENDENTE');
  assert.equal(created.body.data.token, undefined);
});
test('desativações concorrentes preservam ao menos um administrador ativo', async () => {
  const bootstrap = await prisma.user.findUniqueOrThrow({
    where: { email: 'bootstrap@example.com' },
  });
  const second = await prisma.user.create({
    data: {
      name: 'Segundo Admin',
      email: 'secondadmin@example.com',
      password_hash: 'not-for-login',
      role: 'ADMINISTRADOR',
    },
  });
  await prisma.user.update({ where: { id: bootstrap.id }, data: { active: false } });
  try {
    const results = await Promise.allSettled([
      setUserActive(second.id, false, ids.admin),
      setUserActive(ids.admin, false, second.id),
    ]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(await prisma.user.count({ where: { role: 'ADMINISTRADOR', active: true } }), 1);
  } finally {
    await prisma.user.update({ where: { id: bootstrap.id }, data: { active: true } });
    await prisma.user.update({ where: { id: ids.admin }, data: { active: true } });
  }
});
test('limite de autenticação bloqueia tentativas repetidas', async () => {
  let lastStatus = 0;
  for (let i = 0; i < 32; i++) {
    lastStatus = (await api.post('/auth/login').send({})).status;
  }
  assert.equal(lastStatus, 429);
});
