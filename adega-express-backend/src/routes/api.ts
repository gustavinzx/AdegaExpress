import { Router, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/requireRole.middleware';
import { AppError } from '../lib/errors';
import * as s from '../schemas';
import * as auth from '../services/auth.service';
import * as address from '../services/address.service';
import * as catalog from '../services/catalog.service';
import * as orders from '../services/order.service';
import * as delivery from '../services/delivery.service';
import * as admin from '../services/admin.service';
import prisma from '../services/prisma.service';

export const apiRouter = Router();
const ADMIN: Role[] = ['ADMINISTRADOR'];
const OPERATIONS: Role[] = ['ADMINISTRADOR', 'ATENDENTE'];
const CLIENT: Role[] = ['CLIENTE'];
const DRIVER: Role[] = ['ENTREGADOR'];
const ALL: Role[] = ['CLIENTE', 'ADMINISTRADOR', 'ATENDENTE', 'ENTREGADOR'];
type Endpoint = {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  summary: string;
  roles?: Role[];
  body?: z.ZodType;
  query?: z.ZodType;
  status?: number;
};
const paths: Record<string, Record<string, unknown>> = {};
function jsonSchema(schema: z.ZodType) {
  return z.toJSONSchema(schema, { io: 'input', target: 'openapi-3.0', unrepresentable: 'any' });
}
function route(endpoint: Endpoint, action: (req: Request, res: Response) => unknown) {
  const middleware = endpoint.roles ? [authMiddleware, requireRole(...endpoint.roles)] : [];
  apiRouter[endpoint.method](endpoint.path, ...middleware, (req, res, next) => {
    void (async () => {
      if (req.params.id && !/^[1-9]\d{0,9}$/.test(req.params.id)) {
        throw new AppError(400, 'Identificador inválido.');
      }
      if (req.params.id) {
        s.id.parse(Number(req.params.id));
      }
      res.status(endpoint.status ?? 200);
      const result = await action(req, res);
      if (endpoint.status === 204) {
        res.status(204).send();
        return;
      }
      const isPage = result && typeof result === 'object' && 'meta' in result && 'data' in result;
      res.json({ status: 'success', ...(isPage ? result : { data: result }) });
    })().catch(next);
  });
  const path = endpoint.path.replace(/:([a-z_]+)/g, '{$1}');
  const parameters: unknown[] = [];
  if (endpoint.path.includes(':id')) {
    parameters.push({
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'integer', minimum: 1 },
    });
  }
  if (endpoint.query) {
    const schema = jsonSchema(endpoint.query);
    for (const [name, value] of Object.entries(schema.properties ?? {})) {
      parameters.push({
        name,
        in: 'query',
        required: schema.required?.includes(name) ?? false,
        schema: value,
      });
    }
  }
  if (endpoint.path === '/orders' && endpoint.method === 'post') {
    parameters.push({
      name: 'Idempotency-Key',
      in: 'header',
      required: false,
      schema: { type: 'string', minLength: 8, maxLength: 100 },
      description: 'Reutilize a mesma chave e o mesmo corpo ao repetir uma compra.',
    });
  }
  paths[path] ??= {};
  paths[path][endpoint.method] = {
    summary: endpoint.summary,
    tags: [endpoint.path.split('/')[1]],
    description: endpoint.roles ? 'Perfis: ' + endpoint.roles.join(', ') : 'Acesso público.',
    security: endpoint.roles ? [{ bearerAuth: [] }] : [],
    parameters,
    ...(endpoint.body
      ? {
          requestBody: {
            required: true,
            content: { 'application/json': { schema: jsonSchema(endpoint.body) } },
          },
        }
      : {}),
    responses: {
      [endpoint.status ?? 200]: {
        description:
          'Sucesso. Envelope {status, data}; listas paginadas incluem meta. Valores monetários Decimal são strings.',
      },
      400: { description: 'Entrada inválida' },
      401: { description: 'Sessão ausente, expirada ou revogada' },
      403: { description: 'Sem permissão' },
      404: { description: 'Recurso não encontrado' },
      409: { description: 'Conflito de regra de negócio' },
      429: { description: 'Limite de requisições' },
    },
  };
}

route(
  {
    method: 'post',
    path: '/auth/register',
    summary: 'Cadastrar cliente maior de idade',
    body: s.register,
    status: 201,
  },
  (req) => auth.register(s.register.parse(req.body)),
);
route({ method: 'post', path: '/auth/login', summary: 'Autenticar', body: s.login }, (req) =>
  auth.login(s.login.parse(req.body)),
);
route(
  { method: 'get', path: '/auth/me', summary: 'Consultar perfil autenticado', roles: ALL },
  (req) => auth.me(req.user!.sub),
);
route(
  {
    method: 'post',
    path: '/auth/logout',
    summary: 'Revogar todas as sessões do usuário',
    roles: ALL,
    status: 204,
  },
  (req) => auth.logout(req.user!.sub),
);
route(
  {
    method: 'patch',
    path: '/auth/password',
    summary: 'Trocar senha e revogar sessões',
    roles: ALL,
    body: s.passwordChange,
    status: 204,
  },
  (req) => auth.changePassword(req.user!.sub, s.passwordChange.parse(req.body)),
);

route(
  { method: 'get', path: '/addresses', summary: 'Listar meus endereços', roles: CLIENT },
  (req) => address.listAddresses(req.user!.sub),
);
route(
  {
    method: 'post',
    path: '/addresses',
    summary: 'Cadastrar endereço',
    roles: CLIENT,
    body: s.address,
    status: 201,
  },
  (req) => address.saveAddress(req.user!.sub, s.address.parse(req.body)),
);
route(
  {
    method: 'put',
    path: '/addresses/:id',
    summary: 'Substituir endereço',
    roles: CLIENT,
    body: s.address,
  },
  (req) => address.saveAddress(req.user!.sub, s.address.parse(req.body), Number(req.params.id)),
);
route(
  {
    method: 'delete',
    path: '/addresses/:id',
    summary: 'Arquivar endereço preservando pedidos',
    roles: CLIENT,
    status: 204,
  },
  (req) => address.deleteAddress(req.user!.sub, Number(req.params.id)),
);

route(
  { method: 'get', path: '/products', summary: 'Consultar catálogo ativo', query: s.productQuery },
  (req) => catalog.listProducts(s.productQuery.parse(req.query)),
);
route({ method: 'get', path: '/products/:id', summary: 'Consultar produto ativo' }, (req) =>
  catalog.getProduct(Number(req.params.id)),
);
route(
  {
    method: 'post',
    path: '/products',
    summary: 'Criar produto e registrar estoque inicial',
    roles: ADMIN,
    body: s.product,
    status: 201,
  },
  (req) => catalog.createProduct(s.product.parse(req.body), req.user!.sub),
);
route(
  {
    method: 'put',
    path: '/products/:id',
    summary: 'Editar produto sem alterar estoque diretamente',
    roles: ADMIN,
    body: s.productUpdate,
  },
  (req) => catalog.updateProduct(Number(req.params.id), s.productUpdate.parse(req.body)),
);
route(
  {
    method: 'delete',
    path: '/products/:id',
    summary: 'Desativar produto',
    roles: ADMIN,
    status: 204,
  },
  async (req) => {
    await catalog.updateProduct(Number(req.params.id), { active: false });
  },
);
route(
  {
    method: 'get',
    path: '/admin/products',
    summary: 'Listar produtos ativos e inativos',
    roles: ADMIN,
    query: s.productQuery,
  },
  (req) => catalog.listProducts(s.productQuery.parse(req.query), true),
);
route(
  {
    method: 'post',
    path: '/products/:id/stock',
    summary: 'Registrar entrada ou saída de estoque',
    roles: ADMIN,
    body: s.stock,
    status: 201,
  },
  (req) => catalog.moveStock(Number(req.params.id), s.stock.parse(req.body), req.user!.sub),
);
route(
  {
    method: 'get',
    path: '/products/:id/stock',
    summary: 'Consultar histórico de estoque',
    roles: ADMIN,
    query: s.pagination,
  },
  (req) => catalog.stockHistory(Number(req.params.id), s.pagination.strict().parse(req.query)),
);

route(
  { method: 'get', path: '/categories', summary: 'Listar categorias', query: s.pagination },
  (req) => catalog.listCategories(s.pagination.strict().parse(req.query)),
);
route(
  {
    method: 'post',
    path: '/categories',
    summary: 'Criar categoria',
    roles: ADMIN,
    body: s.category,
    status: 201,
  },
  (req) => catalog.saveCategory(s.category.parse(req.body)),
);
route(
  {
    method: 'put',
    path: '/categories/:id',
    summary: 'Editar categoria',
    roles: ADMIN,
    body: s.category,
  },
  (req) => catalog.saveCategory(s.category.parse(req.body), Number(req.params.id)),
);
route(
  {
    method: 'delete',
    path: '/categories/:id',
    summary: 'Excluir categoria sem produtos vinculados',
    roles: ADMIN,
    status: 204,
  },
  (req) => catalog.deleteCategory(Number(req.params.id)),
);

route(
  { method: 'get', path: '/coupons', summary: 'Listar cupons', roles: ADMIN, query: s.pagination },
  (req) => catalog.listCoupons(s.pagination.strict().parse(req.query)),
);
route(
  {
    method: 'post',
    path: '/coupons',
    summary: 'Criar cupom',
    roles: ADMIN,
    body: s.coupon,
    status: 201,
  },
  (req) => catalog.saveCoupon(s.coupon.parse(req.body)),
);
route(
  { method: 'put', path: '/coupons/:id', summary: 'Editar cupom', roles: ADMIN, body: s.coupon },
  (req) => catalog.saveCoupon(s.coupon.parse(req.body), Number(req.params.id)),
);

route(
  {
    method: 'post',
    path: '/orders/quote',
    summary: 'Calcular compra e frete sem reservar estoque',
    roles: CLIENT,
    body: s.checkout,
  },
  (req) => orders.quoteOrder(req.user!.sub, s.checkout.parse(req.body)),
);
route(
  {
    method: 'post',
    path: '/orders',
    summary: 'Criar pedido com baixa atômica de estoque',
    roles: CLIENT,
    body: s.checkout,
    status: 201,
  },
  async (req, res) => {
    const key = req.header('Idempotency-Key');
    if (key !== undefined && !/^[A-Za-z0-9._:-]{8,100}$/.test(key)) {
      throw new AppError(
        400,
        'Idempotency-Key deve ter de 8 a 100 caracteres alfanuméricos, ponto, hífen, dois-pontos ou sublinhado.',
      );
    }
    const result = await orders.createOrder(req.user!.sub, s.checkout.parse(req.body), key);
    res.status(result.replayed ? 200 : 201);
    res.setHeader('Idempotency-Replayed', String(result.replayed));
    return result.order;
  },
);
route(
  {
    method: 'get',
    path: '/orders/me',
    summary: 'Consultar meus pedidos',
    roles: CLIENT,
    query: s.orderQuery,
  },
  (req) => orders.listOrders(s.orderQuery.parse(req.query), req.user!.sub),
);
route(
  {
    method: 'get',
    path: '/orders',
    summary: 'Consultar pedidos da operação',
    roles: OPERATIONS,
    query: s.orderQuery,
  },
  (req) => orders.listOrders(s.orderQuery.parse(req.query)),
);
route(
  {
    method: 'get',
    path: '/orders/:id',
    summary: 'Consultar pedido e histórico',
    roles: [...CLIENT, ...OPERATIONS],
  },
  (req) => orders.getOrderById(Number(req.params.id), req.user!),
);
route(
  {
    method: 'patch',
    path: '/orders/:id/status',
    summary: 'Confirmar, separar ou cancelar pedido',
    roles: OPERATIONS,
    body: s.orderStatus,
  },
  (req) => {
    const input = s.orderStatus.parse(req.body);
    return orders.updateOrderStatus(Number(req.params.id), input.status, req.user!, input.reason);
  },
);
route(
  {
    method: 'post',
    path: '/orders/:id/cancel',
    summary: 'Cancelar pedido pendente do cliente',
    roles: CLIENT,
    body: s.cancel,
  },
  (req) =>
    orders.updateOrderStatus(
      Number(req.params.id),
      'CANCELADO',
      req.user!,
      s.cancel.parse(req.body).reason,
    ),
);
route(
  {
    method: 'patch',
    path: '/orders/:id/payment',
    summary: 'Registrar conferência manual de pagamento ou estorno',
    roles: OPERATIONS,
    body: s.payment,
  },
  (req) => orders.recordPayment(Number(req.params.id), s.payment.parse(req.body), req.user!.sub),
);
route(
  {
    method: 'get',
    path: '/orders/:id/payments',
    summary: 'Consultar auditoria de pagamentos',
    roles: OPERATIONS,
  },
  (req) => orders.paymentHistory(Number(req.params.id)),
);

route(
  {
    method: 'get',
    path: '/deliveries/me',
    summary: 'Consultar minhas entregas',
    roles: DRIVER,
    query: s.deliveryQuery,
  },
  (req) => delivery.listDeliveries(s.deliveryQuery.parse(req.query), req.user!.sub),
);
route(
  {
    method: 'get',
    path: '/deliveries',
    summary: 'Consultar entregas da operação',
    roles: OPERATIONS,
    query: s.deliveryQuery,
  },
  (req) => delivery.listDeliveries(s.deliveryQuery.parse(req.query)),
);
route(
  {
    method: 'patch',
    path: '/deliveries/:id/assign',
    summary: 'Atribuir entregador',
    roles: OPERATIONS,
    body: s.assignment,
  },
  (req) =>
    delivery.assignDeliverer(Number(req.params.id), s.assignment.parse(req.body).deliverer_id),
);
route(
  {
    method: 'patch',
    path: '/deliveries/:id/status',
    summary: 'Avançar entrega e sincronizar pedido',
    roles: DRIVER,
    body: s.deliveryStatus,
  },
  (req) =>
    delivery.updateDeliveryStatus(
      Number(req.params.id),
      req.user!.sub,
      s.deliveryStatus.parse(req.body).status,
    ),
);
route(
  {
    method: 'get',
    path: '/staff/deliverers',
    summary: 'Listar entregadores ativos para atribuição',
    roles: OPERATIONS,
  },
  () => admin.listDeliverers(),
);
route(
  { method: 'get', path: '/staff', summary: 'Listar equipe', roles: ADMIN, query: s.pagination },
  (req) => admin.listStaff(s.pagination.strict().parse(req.query)),
);
route(
  {
    method: 'post',
    path: '/staff',
    summary: 'Cadastrar membro da equipe',
    roles: ADMIN,
    body: s.staff,
    status: 201,
  },
  (req) => {
    const { role, ...input } = s.staff.parse(req.body);
    return auth.register(input, role);
  },
);
route(
  {
    method: 'patch',
    path: '/users/:id/active',
    summary: 'Ativar ou desativar usuário',
    roles: ADMIN,
    body: s.active,
  },
  (req) =>
    admin.setUserActive(Number(req.params.id), s.active.parse(req.body).active, req.user!.sub),
);
route(
  {
    method: 'get',
    path: '/reports/sales',
    summary: 'Relatório de vendas por período',
    roles: ADMIN,
    query: s.reportQuery,
  },
  (req) => {
    const { from, to } = s.reportQuery.parse(req.query);
    return admin.salesReport(from, to);
  },
);
route({ method: 'get', path: '/health', summary: 'Verificar processo da API' }, () => ({
  alive: true,
  timestamp: new Date().toISOString(),
}));
route(
  { method: 'get', path: '/health/ready', summary: 'Verificar conexão com banco de dados' },
  async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { ready: true };
  },
);

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Adega Express API',
    version: '2.0.0',
    description:
      'E-commerce B2C. Pagamentos são conferidos manualmente; esta API não efetua cobranças externas. Datas civis em AAAA-MM-DD, dinheiro em BRL. Listas usam page/limit (máximo 100).',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
  },
  paths,
};
