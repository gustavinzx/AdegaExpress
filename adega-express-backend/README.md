# Adega Express — Backend API (v4.3)

API RESTful do e-commerce B2C **Adega Express**, adequada ao **Documento de Visão v4.3** (loja virtual demonstrativa exclusivamente de bebidas não alcoólicas: **Água**, **Sucos**, **Refrigerantes** e **Chás**).

A API registra **PIX** e **Cartão** como modalidades de pagamento demonstrativas e exige **confirmação manual** por Atendente ou Administrador autorizado (`PATCH /orders/:id/payment`) antes que o pedido avance para `CONFIRMADO` (RN08). Pedidos pendentes sem confirmação de pagamento em até **30 minutos** são cancelados automaticamente com devolução idempotente de estoque (RN07 / RF18).

---

## 1. Requisitos

- **Node.js 20.19+** (verificado com Node.js 24)
- **MySQL 8.0**
- Tecnologias: **Express 4**, **TypeScript (modo estrito)**, **Prisma ORM 5**, **Zod**, **JWT** (cookie `HttpOnly` `adega_token` + header `Authorization: Bearer`) e **bcrypt**.

---

## 2. Instalar e Configurar

```powershell
cd "c:\Users\gsds0\Desktop\Adega Express\adega-express-backend"
npm install
npm run setup
```

Configure o arquivo `.env`:

```dotenv
PORT=3001
NODE_ENV=development
DATABASE_URL="mysql://adega_app:SENHA_CODIFICADA@127.0.0.1:3306/adega_express"
JWT_SECRET="SEU_SEGREDO_ALEATORIO_COM_PELO_MENOS_32_CARACTERES"
JWT_EXPIRES_IN="8h"
CORS_ORIGINS="http://localhost:3000"
TRUST_PROXY_HOPS=0
SHIPPING_FEE=5.00
DELIVERY_CITIES="São Paulo"
DELIVERY_STATE=SP
ADMIN_NAME="Administrador Adega Express"
ADMIN_EMAIL="admin@adegaexpress.com.br"
ADMIN_PASSWORD="SUA_SENHA_FORTE"
```

Gere o Prisma Client, aplique as migrations e popule o banco de demonstração:

```powershell
npm run prisma:generate
npm run prisma:deploy
npm run seed
npm run seed:demo
npm run doctor
```

- `prisma:deploy`: aplica todas as migrations sem apagar dados históricos, incluindo a migração aditiva `20261107120000_non_alcoholic_scope` que desativa categorias e produtos fora do escopo não alcoólico.
- `seed`: cria o primeiro `ADMINISTRADOR` com as variáveis `ADMIN_*`.
- `seed:demo`: cria as 4 categorias oficiais (`Água`, `Sucos`, `Refrigerantes`, `Chás`) e produtos demonstrativos não alcoólicos (incluindo item sem estoque para demonstrar RF02 / RN03).

---

## 3. Executar a API

```powershell
npm run dev
```

Endpoints de diagnóstico e documentação (com `PORT=3001`):

- Saúde do processo: `http://localhost:3001/health`
- Prontidão do banco: `http://localhost:3001/health/ready`
- Swagger UI interativo: `http://localhost:3001/docs`
- Especificação OpenAPI 3.0: `http://localhost:3001/openapi.json`

---

## 4. Regras de Negócio e Segurança Implementadas

- **Escopo estritamente não alcoólico:** Apenas as categorias `Água`, `Sucos`, `Refrigerantes` e `Chás` são aceitas. O cadastro ou edição de produtos exige `abv_percent = 0` e bloqueia termos alcoólicos ou de tabacaria.
- **Cadastro simplificado (UC02 / RF04):** `POST /auth/register` requer apenas `name`, `email` e `password` (mínimo 8 caracteres, máximo 72 bytes UTF-8), emitindo cookie `HttpOnly` (`adega_token`) e token Bearer.
- **Proteção de sessão e CSRF:** `POST /auth/logout` e `PATCH /auth/password` incrementam `token_version` no banco e limpam o cookie `HttpOnly`. Mutacões autenticadas por cookie validam `Origin`/`Referer` contra `CORS_ORIGINS`.
- **Baixa atômica e idempotência no checkout (RN01 / RN02):** `POST /orders` recalcula preços no servidor em transação `Serializable`, debita estoque atomicamente e suporta `Idempotency-Key`.
- **Confirmação manual de pagamento demonstrativo (UC11 / RN08 / RN12):** `PATCH /orders/:id/payment` registra `PAGO` ou `ESTORNADO` com `actor_id`, `paid_at` e `reference`. Sem `payment_status = PAGO`, `PATCH /orders/:id/status` bloqueia o avanço para `CONFIRMADO` ou `SEPARADO`.
- **Expiração automática em 30 minutos (RN07 / RF18):** Pedidos `PENDENTE` com pagamento `PENDENTE` há mais de 30 minutos são cancelados automaticamente por `expirePendingOrders()`, devolvendo o estoque de forma idempotente na mesma transação.
- **Fluxo de entrega sincronizado (UC03 / RN05 / RN06 / RN09):** Passar o pedido para `SEPARADO` cria a entrega `AGUARDANDO`. O entregador atribuído avança para `SAIU_PARA_ENTREGA` (pedido → `EM_ROTA`) e `ENTREGUE` (pedido → `ENTREGUE`, permitido apenas se `payment_status = PAGO`).
- **Relatórios gerenciais (UC12 / RF16):** `GET /reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&group_by=PRODUTO|CATEGORIA|PAGAMENTO` retorna resumo financeiro dos pedidos pagos, agrupamentos por produto, categoria e modalidade de pagamento, e lista de produtos com estoque baixo.

---

## 5. Verificação de Qualidade e Testes Automatizados

```powershell
npm run check
npm run test:integration
```

- `npm run check`: executa `prisma:generate`, `typecheck`, `lint` (`--max-warnings 0`), os 12 testes unitários (`tests/unit.test.ts`) e o `build`.
- `npm run test:integration`: inicializa uma instância temporária e isolada do MySQL 8, testa a migração de pedidos legados + migração de escopo não alcoólico, executa os seeds duas vezes (idempotência), roda os 24 testes de integração HTTP (`tests/integration.test.ts`) e valida a paridade do schema com `prisma migrate diff`.
