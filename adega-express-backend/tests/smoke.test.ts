import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import app from '../src/app';
import prisma from '../src/services/prisma.service';
import { expirePendingOrders } from '../src/services/order.service';

const api = request(app);

let adminToken = '';
let atendenteToken = '';
let entregador1Token = '';
let entregador2Token = '';
let clienteToken = '';
let otherClienteToken = '';

let adminId = 0;
let clienteId = 0;
let otherClienteId = 0;
let deliverer1Id = 0;
let deliverer2Id = 0;

let testCategoryId = 0;
let inStockProductId = 0;
let zeroStockProductId = 0;
let addressId = 0;
let otherAddressId = 0;

before(async () => {
  // Configuração inicial de usuários para teste
  const passwordHash = await bcrypt.hash('Smoke@123', 8);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin.smoke@adegaexpress.com' },
    create: {
      name: 'Admin Smoke',
      email: 'admin.smoke@adegaexpress.com',
      password_hash: passwordHash,
      role: Role.ADMINISTRADOR,
      active: true,
    },
    update: { password_hash: passwordHash, active: true },
  });
  adminId = admin.id;

  // Atendente
  await prisma.user.upsert({
    where: { email: 'atendente.smoke@adegaexpress.com' },
    create: {
      name: 'Atendente Smoke',
      email: 'atendente.smoke@adegaexpress.com',
      password_hash: passwordHash,
      role: Role.ATENDENTE,
      active: true,
    },
    update: { password_hash: passwordHash, active: true },
  });

  // Entregador 1
  const ent1 = await prisma.user.upsert({
    where: { email: 'entregador1.smoke@adegaexpress.com' },
    create: {
      name: 'Entregador 1 Smoke',
      email: 'entregador1.smoke@adegaexpress.com',
      password_hash: passwordHash,
      role: Role.ENTREGADOR,
      active: true,
    },
    update: { password_hash: passwordHash, active: true },
  });
  deliverer1Id = ent1.id;

  // Entregador 2
  const ent2 = await prisma.user.upsert({
    where: { email: 'entregador2.smoke@adegaexpress.com' },
    create: {
      name: 'Entregador 2 Smoke',
      email: 'entregador2.smoke@adegaexpress.com',
      password_hash: passwordHash,
      role: Role.ENTREGADOR,
      active: true,
    },
    update: { password_hash: passwordHash, active: true },
  });
  deliverer2Id = ent2.id;

  // Cliente 1
  const cl1 = await prisma.user.upsert({
    where: { email: 'cliente.smoke@adegaexpress.com' },
    create: {
      name: 'Cliente Smoke',
      email: 'cliente.smoke@adegaexpress.com',
      password_hash: passwordHash,
      role: Role.CLIENTE,
      active: true,
    },
    update: { password_hash: passwordHash, active: true },
  });
  clienteId = cl1.id;

  // Cliente 2 (para testar isolamento)
  const cl2 = await prisma.user.upsert({
    where: { email: 'cliente2.smoke@adegaexpress.com' },
    create: {
      name: 'Outro Cliente Smoke',
      email: 'cliente2.smoke@adegaexpress.com',
      password_hash: passwordHash,
      role: Role.CLIENTE,
      active: true,
    },
    update: { password_hash: passwordHash, active: true },
  });
  otherClienteId = cl2.id;

  // Categoria de teste
  const cat = await prisma.category.upsert({
    where: { name: 'Água' },
    create: { name: 'Água', active: true },
    update: { active: true },
  });
  testCategoryId = cat.id;

  // Produtos de teste
  const p1 = await prisma.product.create({
    data: {
      name: `Água Teste Smoke ${Date.now()}`,
      category_id: testCategoryId,
      price: '5.00',
      volume_ml: 500,
      abv_percent: '0.00',
      brand: 'SmokeBrand',
      stock_quantity: 10,
      active: true,
    },
  });
  inStockProductId = p1.id;

  const pZero = await prisma.product.create({
    data: {
      name: `Água Esgotada Smoke ${Date.now()}`,
      category_id: testCategoryId,
      price: '7.50',
      volume_ml: 500,
      abv_percent: '0.00',
      brand: 'SmokeBrand',
      stock_quantity: 0,
      active: true,
    },
  });
  zeroStockProductId = pZero.id;

  // Endereços de teste
  const addr1 = await prisma.address.create({
    data: {
      user_id: clienteId,
      street: 'Rua das Palmeiras',
      number: '123',
      neighborhood: 'Asa Sul',
      city: 'Brasília',
      state: 'DF',
      zip: '70000-000',
      is_default: true,
    },
  });
  addressId = addr1.id;

  const addr2 = await prisma.address.create({
    data: {
      user_id: otherClienteId,
      street: 'Rua das Acácias',
      number: '45',
      neighborhood: 'Jardim Primavera',
      city: 'São Paulo',
      state: 'SP',
      zip: '01000-000',
      is_default: true,
    },
  });
  otherAddressId = addr2.id;
});

after(async () => {
  await prisma.$disconnect();
});

test('1. Cadastro, Login e Logout', async () => {
  // Cadastro de novo cliente
  const newEmail = `novo.${Date.now()}@teste.com`;
  const regRes = await api.post('/auth/register').send({
    name: 'Novo Usuario',
    email: newEmail,
    password: 'Password@123',
  });
  assert.equal(regRes.status, 201);
  assert.equal(regRes.body.data.user.role, 'CLIENTE');

  // Login como cada perfil
  const loginAdmin = await api.post('/auth/login').send({
    email: 'admin.smoke@adegaexpress.com',
    password: 'Smoke@123',
  });
  assert.equal(loginAdmin.status, 200);
  adminToken = loginAdmin.body.data.token;
  assert(adminToken);
  assert(adminId);
  assert(deliverer2Id);

  const loginAtendente = await api.post('/auth/login').send({
    email: 'atendente.smoke@adegaexpress.com',
    password: 'Smoke@123',
  });
  assert.equal(loginAtendente.status, 200);
  atendenteToken = loginAtendente.body.data.token;

  const loginEnt1 = await api.post('/auth/login').send({
    email: 'entregador1.smoke@adegaexpress.com',
    password: 'Smoke@123',
  });
  assert.equal(loginEnt1.status, 200);
  entregador1Token = loginEnt1.body.data.token;

  const loginEnt2 = await api.post('/auth/login').send({
    email: 'entregador2.smoke@adegaexpress.com',
    password: 'Smoke@123',
  });
  assert.equal(loginEnt2.status, 200);
  entregador2Token = loginEnt2.body.data.token;

  const loginCliente = await api.post('/auth/login').send({
    email: 'cliente.smoke@adegaexpress.com',
    password: 'Smoke@123',
  });
  assert.equal(loginCliente.status, 200);
  clienteToken = loginCliente.body.data.token;

  const loginOther = await api.post('/auth/login').send({
    email: 'cliente2.smoke@adegaexpress.com',
    password: 'Smoke@123',
  });
  assert.equal(loginOther.status, 200);
  otherClienteToken = loginOther.body.data.token;

  // Logout com token revogado
  const logoutRes = await api
    .post('/auth/logout')
    .set('Authorization', `Bearer ${regRes.body.data.token}`);
  assert.equal(logoutRes.status, 204);

  // Tentativa de usar token após logout deve falhar
  const meRes = await api
    .get('/auth/me')
    .set('Authorization', `Bearer ${regRes.body.data.token}`);
  assert.equal(meRes.status, 401);
});

test('2. Catálogo e Filtros', async () => {
  const res = await api.get('/products?limit=10&min_price=1.00&max_price=50.00');
  assert.equal(res.status, 200);
  assert(Array.isArray(res.body.data));
  assert(res.body.data.length > 0);

  // Verifica que produto com estoque zero retorna in_stock = false
  const zeroProd = res.body.data.find((p: { id: number }) => p.id === zeroStockProductId);
  if (zeroProd) {
    assert.equal(zeroProd.in_stock, false);
  }
});

test('3. Produto sem estoque recusado via API no checkout', async () => {
  const res = await api
    .post('/orders')
    .set('Authorization', `Bearer ${clienteToken}`)
    .send({
      address_id: addressId,
      payment_method: 'PIX',
      items: [{ product_id: zeroStockProductId, quantity: 1 }],
    });
  assert.equal(res.status, 409);
  assert.match(res.body.message, /Estoque insuficiente/);
});

test('4. Cupons: Válido, Inválido e Expirado', async () => {
  // Cotação com cupom válido
  const quoteValid = await api
    .post('/orders/quote')
    .set('Authorization', `Bearer ${clienteToken}`)
    .send({
      address_id: addressId,
      payment_method: 'PIX',
      coupon_code: 'BEMVINDO10',
      items: [{ product_id: inStockProductId, quantity: 1 }],
    });
  assert.equal(quoteValid.status, 200);
  assert(Number(quoteValid.body.data.discount) > 0);

  // Cotação com cupom expirado
  const quoteExpired = await api
    .post('/orders/quote')
    .set('Authorization', `Bearer ${clienteToken}`)
    .send({
      address_id: addressId,
      payment_method: 'PIX',
      coupon_code: 'EXPIRADO20',
      items: [{ product_id: inStockProductId, quantity: 1 }],
    });
  assert.equal(quoteExpired.status, 400);

  // Cotação com cupom inexistente
  const quoteNonexistent = await api
    .post('/orders/quote')
    .set('Authorization', `Bearer ${clienteToken}`)
    .send({
      address_id: addressId,
      payment_method: 'PIX',
      coupon_code: 'NAOEXISTE123',
      items: [{ product_id: inStockProductId, quantity: 1 }],
    });
  assert.equal(quoteNonexistent.status, 400);
});

test('5. Fluxo Completo: Checkout -> Confirmação -> Separação -> Entrega', async () => {
  // 5.1 Criar Pedido
  const orderRes = await api
    .post('/orders')
    .set('Authorization', `Bearer ${clienteToken}`)
    .send({
      address_id: addressId,
      payment_method: 'PIX',
      items: [{ product_id: inStockProductId, quantity: 2 }],
    });
  assert.equal(orderRes.status, 201);
  const orderId = orderRes.body.data.id;
  assert.equal(orderRes.body.data.status, 'PENDENTE');

  // 5.2 Confirmar Pagamento (Operador / Atendente)
  const payRes = await api
    .patch(`/orders/${orderId}/payment`)
    .set('Authorization', `Bearer ${atendenteToken}`)
    .send({
      status: 'PAGO',
      reference: 'PIX-SMOKE-CONFIRM-99',
    });
  assert.equal(payRes.status, 200);
  assert.equal(payRes.body.data.payment_status, 'PAGO');

  // Avançar para CONFIRMADO
  const confRes = await api
    .patch(`/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${atendenteToken}`)
    .send({ status: 'CONFIRMADO', reason: 'Pagamento conferido' });
  assert.equal(confRes.status, 200);
  assert.equal(confRes.body.data.status, 'CONFIRMADO');

  // 5.3 Separar Pedido (Cria entrega AGUARDANDO automaticamente)
  const sepRes = await api
    .patch(`/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${atendenteToken}`)
    .send({ status: 'SEPARADO', reason: 'Itens embalados' });
  assert.equal(sepRes.status, 200);
  assert.equal(sepRes.body.data.status, 'SEPARADO');

  // 5.4 Atribuir Entregador
  // Obter a entrega criada
  const delivery = await prisma.delivery.findUnique({ where: { order_id: orderId } });
  assert(delivery);

  const assignRes = await api
    .patch(`/deliveries/${delivery.id}/assign`)
    .set('Authorization', `Bearer ${atendenteToken}`)
    .send({ deliverer_id: deliverer1Id });
  assert.equal(assignRes.status, 200);
  const updatedDelivery = await prisma.delivery.findUnique({ where: { order_id: orderId } });
  assert.equal(updatedDelivery?.deliverer_id, deliverer1Id);

  // 5.5 Entregador 1 avança para SAIU_PARA_ENTREGA (atualiza pedido para EM_ROTA)
  const dispatchRes = await api
    .patch(`/deliveries/${delivery.id}/status`)
    .set('Authorization', `Bearer ${entregador1Token}`)
    .send({ status: 'SAIU_PARA_ENTREGA' });
  assert.equal(dispatchRes.status, 200);

  const checkRota = await prisma.order.findUnique({ where: { id: orderId } });
  assert.equal(checkRota?.status, 'EM_ROTA');

  // 5.6 Entregador 1 conclui entrega (atualiza pedido para ENTREGUE)
  const deliverRes = await api
    .patch(`/deliveries/${delivery.id}/status`)
    .set('Authorization', `Bearer ${entregador1Token}`)
    .send({ status: 'ENTREGUE' });
  assert.equal(deliverRes.status, 200);

  const checkEntregue = await prisma.order.findUnique({ where: { id: orderId } });
  assert.equal(checkEntregue?.status, 'ENTREGUE');
});

test('6. Expiração de Pedido com Relógio Controlável (30 minutos)', async () => {
  // Criar pedido pendente
  const orderRes = await api
    .post('/orders')
    .set('Authorization', `Bearer ${clienteToken}`)
    .send({
      address_id: addressId,
      payment_method: 'PIX',
      items: [{ product_id: inStockProductId, quantity: 1 }],
    });
  assert.equal(orderRes.status, 201);
  const orderId = orderRes.body.data.id;

  // Verificar estoque antes do cancelamento
  const prodBefore = await prisma.product.findUnique({ where: { id: inStockProductId } });
  const stockBefore = prodBefore!.stock_quantity;

  // Forçar expiração com relógio avançado em 31 minutos
  const futureClock = new Date(Date.now() + 31 * 60 * 1000);
  const cancelledCount = await expirePendingOrders(futureClock, 30 * 60 * 1000);
  assert(cancelledCount >= 1);

  // Verificar se pedido foi cancelado
  const expiredOrder = await prisma.order.findUnique({ where: { id: orderId } });
  assert.equal(expiredOrder?.status, 'CANCELADO');

  // Verificar se estoque foi devolvido
  const prodAfter = await prisma.product.findUnique({ where: { id: inStockProductId } });
  assert.equal(prodAfter!.stock_quantity, stockBefore + 1);

  // Idempotência: rodar de novo não deve cancelar novamente
  const secondRun = await expirePendingOrders(futureClock, 30 * 60 * 1000);
  assert.equal(secondRun, 0);
});

test('7. Concorrência de Estoque (Não permite vender além do saldo)', async () => {
  // Criar um produto com saldo exatamente 1
  const limitedProd = await prisma.product.create({
    data: {
      name: `Estoque Limitado Smoke ${Date.now()}`,
      category_id: testCategoryId,
      price: '10.00',
      volume_ml: 500,
      abv_percent: '0.00',
      brand: 'SmokeBrand',
      stock_quantity: 1,
      active: true,
    },
  });

  // Tentar realizar 2 pedidos concorrentes pelo mesmo item
  const [resA, resB] = await Promise.all([
    api
      .post('/orders')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        address_id: addressId,
        payment_method: 'PIX',
        items: [{ product_id: limitedProd.id, quantity: 1 }],
      }),
    api
      .post('/orders')
      .set('Authorization', `Bearer ${otherClienteToken}`)
      .send({
        address_id: otherAddressId,
        payment_method: 'PIX',
        items: [{ product_id: limitedProd.id, quantity: 1 }],
      }),
  ]);

  const statuses = [resA.status, resB.status];
  assert(statuses.includes(201), 'Ao menos um pedido deve ter sucesso');
  assert(statuses.includes(409), 'O segundo pedido simultâneo deve ser rejeitado por estoque insuficiente');

  const finalProd = await prisma.product.findUnique({ where: { id: limitedProd.id } });
  assert.equal(finalProd?.stock_quantity, 0);
});

test('8. Isolamento de Segurança e Autorização (RBAC)', async () => {
  // 8.1 Cliente tentando acessar rota administrativa (deve ser 403)
  const adminRouteTry = await api
    .get('/admin/products')
    .set('Authorization', `Bearer ${clienteToken}`);
  assert.equal(adminRouteTry.status, 403);

  // 8.2 Cliente tentando ver pedido de outro cliente (deve ser negado 403 ou 404)
  // Criar pedido pertencente ao otherCliente
  const otherOrderRes = await api
    .post('/orders')
    .set('Authorization', `Bearer ${otherClienteToken}`)
    .send({
      address_id: otherAddressId,
      payment_method: 'PIX',
      items: [{ product_id: inStockProductId, quantity: 1 }],
    });
  assert.equal(otherOrderRes.status, 201);
  const otherOrderId = otherOrderRes.body.data.id;

  // Cliente 1 tenta visualizar pedido do Cliente 2
  const viewOtherOrder = await api
    .get(`/orders/${otherOrderId}`)
    .set('Authorization', `Bearer ${clienteToken}`);
  assert([403, 404].includes(viewOtherOrder.status));

  // 8.3 Entregador 2 tentando alterar entrega atribuída ao Entregador 1 (deve falhar 403/404)
  // Criar e separar um pedido atribuído ao Entregador 1
  const deliveryOrder = await api
    .post('/orders')
    .set('Authorization', `Bearer ${clienteToken}`)
    .send({
      address_id: addressId,
      payment_method: 'PIX',
      items: [{ product_id: inStockProductId, quantity: 1 }],
    });
  const delOrderId = deliveryOrder.body.data.id;

  await api
    .patch(`/orders/${delOrderId}/payment`)
    .set('Authorization', `Bearer ${atendenteToken}`)
    .send({ status: 'PAGO', reference: 'PIX-SECURITY' });

  await api
    .patch(`/orders/${delOrderId}/status`)
    .set('Authorization', `Bearer ${atendenteToken}`)
    .send({ status: 'CONFIRMADO' });

  await api
    .patch(`/orders/${delOrderId}/status`)
    .set('Authorization', `Bearer ${atendenteToken}`)
    .send({ status: 'SEPARADO' });

  const assignedDel = await prisma.delivery.findUnique({ where: { order_id: delOrderId } });
  assert(assignedDel);

  await api
    .patch(`/deliveries/${assignedDel.id}/assign`)
    .set('Authorization', `Bearer ${atendenteToken}`)
    .send({ deliverer_id: deliverer1Id });

  // Entregador 2 tenta alterar o status da entrega do Entregador 1
  const hijackAttempt = await api
    .patch(`/deliveries/${assignedDel.id}/status`)
    .set('Authorization', `Bearer ${entregador2Token}`)
    .send({ status: 'SAIU_PARA_ENTREGA' });
  assert([403, 404].includes(hijackAttempt.status));
});
