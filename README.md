# 🥤 Adega Express — E-commerce & Operação de Bebidas Não Alcoólicas (v4.3)

Sistema completo de comércio eletrônico B2C e gestão operacional desenvolvido em monorepo (**Next.js 16 + Node.js/Express + Prisma ORM + MySQL**), adequado integralmente ao **Documento de Visão do Adega Express — Versão 4.3 (Escopo Acadêmico Não Alcoólico)**.

![Status](https://img.shields.io/badge/Status-Conclu%C3%ADdo-success)
![Version](https://img.shields.io/badge/Documento_de_Vis%C3%A3o-v4.3-amber)
![Escopo](https://img.shields.io/badge/Escopo-Bebidas_N%C3%A3o_Alco%C3%B3licas-emerald)

---

## 🎯 Escopo do Projeto (Documento de Visão v4.3)

O **Adega Express** é uma loja virtual demonstrativa voltada **exclusivamente à comercialização de bebidas não alcoólicas** para consumo doméstico, reuniões familiares e pequenos eventos, atendendo às 4 categorias oficiais:
- **Água** (com e sem gás)
- **Sucos** (integrais e néctares)
- **Refrigerantes**
- **Chás** (prontos para consumo)

> **Restrições e Delimitações de Escopo:**
> - **Sem bebidas alcoólicas ou tabacaria:** O sistema bloqueia, tanto na interface quanto na API/banco de dados, o cadastro e a exibição de produtos alcoólicos (`abv_percent > 0`) ou itens de tabacaria. Não há exigência de verificação de maioridade (18+).
> - **Pagamento Demonstrativo (Sem Cobrança Real):** No checkout, o cliente escolhe entre **PIX** ou **Cartão** apenas como modalidade demonstrativa registrada no pedido. **Não há geração de QR Code bancário, código copia-e-cola, gateway financeiro ou cobrança real.** A confirmação do pagamento (`PAGO`) é registrada manualmente por um **Atendente** ou **Administrador** com auditoria de responsável, data/hora e referência demonstrativa.
> - **Sem Rastreamento GPS em Tempo Real (RF19 — Won't):** O acompanhamento da entrega é realizado por mudança de status (`PENDENTE` → `CONFIRMADO` → `SEPARADO` → `EM_ROTA` → `ENTREGUE`).

---

## 👥 Perfis de Usuário e Permissões

Toda autorização é validada no backend via JWT (`HttpOnly` cookie + header `Authorization: Bearer`) e conferida no banco a cada requisição:

| Perfil | Responsabilidades e Funcionalidades |
| :--- | :--- |
| **Visitante** | Consultar o catálogo público de bebidas não alcoólicas, buscar/filtrar produtos (nome, categoria, marca, volume e faixa de preço), visualizar produtos "Em Falta" e realizar cadastro como Cliente. |
| **Cliente** | Gerenciar carrinho, aplicar cupons válidos, gerenciar múltiplos endereços (criar, editar, definir padrão e arquivar), realizar pedidos com checkout demonstrativo, acompanhar etapas do pedido e cancelar pedidos `PENDENTE`. |
| **Atendente** | Consultar pedidos, registrar confirmação manual do pagamento demonstrativo (`PAGO` / `ESTORNADO`), avançar status para `CONFIRMADO` e `SEPARADO` e atribuir entregadores. |
| **Entregador** | Consultar exclusivamente as entregas atribuídas ao seu perfil e atualizar o status para `SAIU_PARA_ENTREGA` (sincronizando pedido para `EM_ROTA`) e `ENTREGUE` (permitido somente quando o pagamento está `PAGO`). |
| **Administrador** | Possui todas as permissões operacionais + gestão completa de produtos, categorias, cupons de desconto, movimentações manuais de estoque (entrada/saída com histórico auditável), gestão de equipe (`ATENDENTE`, `ENTREGADOR`, `ADMINISTRADOR`) e relatórios de vendas por período. |

---

## ⚙️ Regras de Negócio Implementadas (RN01 a RN13)

1. **Baixa Atômica de Estoque (RN01 / RN02):** Ao criar um pedido (`PENDENTE`), o estoque é debitado atomicamente em transação serializável no MySQL.
2. **Produtos Sem Estoque (RF02 / RN03):** Produtos com `stock_quantity = 0` permanecem visíveis no catálogo com selo **"Em Falta"** e têm a adição ao carrinho e compra bloqueadas no frontend e no backend.
3. **Confirmação Manual de Pagamento antes da Confirmação do Pedido (RN08 / RN12):** Um pedido só pode avançar para `CONFIRMADO` ou `SEPARADO` após o pagamento demonstrativo ser confirmado como `PAGO` por Atendente ou Administrador, gerando registro em `payment_records` (responsável, data/hora e referência).
4. **Expiração Automática em 30 Minutos (RN07 / RF18):** Pedidos `PENDENTE` cujo pagamento não seja confirmado em até **30 minutos** são cancelados automaticamente, devolvendo os itens ao estoque na mesma transação com registro em `stock_movements`.
5. **Devolução Idempotente de Estoque (RN07 / RF15):** O cancelamento (manual ou automático por expiração) devolve o estoque uma única vez de forma idempotente.
6. **Geração Automática de Entrega (RN05):** Quando o pedido avança para `SEPARADO`, o sistema cria automaticamente o registro de entrega com status `AGUARDANDO`.
7. **Sincronização Entrega ↔ Pedido (RN06 / RN09):** Quando o entregador registra `SAIU_PARA_ENTREGA`, o pedido passa para `EM_ROTA`. Quando registra `ENTREGUE`, o pedido passa para `ENTREGUE` (bloqueado caso `payment_status !== 'PAGO'`).
8. **Proteção de Histórico (RN10 / RN11):** Pedidos preservam snapshots imutáveis de endereço, preços e nomes dos itens. Endereços em uso são arquivados logicamente e produtos com histórico são inativados sem exclusão física.

---

## 🛠️ Tecnologias Utilizadas

### Frontend (`adega-express-frontend`)
- **Next.js 16** (App Router) & **React 19**
- **TypeScript** (Modo Estrito)
- **Tailwind CSS v4**
- **Lucide React** & **React Hot Toast**

### Backend (`adega-express-backend`)
- **Node.js** & **Express 4**
- **TypeScript** (Modo Estrito)
- **Prisma ORM 5** & **MySQL 8**
- **Zod** (Validação de schemas e geração de contrato OpenAPI 3.0 / Swagger em `/docs`)
- **JWT (`jsonwebtoken`)** (Sessão via cookie `HttpOnly` `adega_token` + `Bearer`, controle de `token_version` e proteção CSRF por `Origin`/`Referer`)
- **Bcrypt** (Hash seguro de senhas com limite de 72 bytes UTF-8)

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
- **Node.js** v20.19+ (ou v22/v24)
- **MySQL 8.0** ativo localmente

### 2. Configurando e Iniciando o Backend (`http://localhost:3001`)

```powershell
cd adega-express-backend

# Instalar dependências
npm install

# Gerar arquivo .env inicial (se não existir)
npm run setup
```

Edite o arquivo `adega-express-backend/.env` com as credenciais do seu MySQL local:
```dotenv
PORT=3001
NODE_ENV=development
DATABASE_URL="mysql://root:SUA_SENHA@127.0.0.1:3306/adega_express"
JWT_SECRET="SEU_SEGREDO_ALEATORIO_COM_PELO_MENOS_32_CARACTERES"
JWT_EXPIRES_IN="8h"
CORS_ORIGINS="http://localhost:3000"
SHIPPING_FEE=5.00
DELIVERY_CITIES="São Paulo"
DELIVERY_STATE=SP
ADMIN_NAME="Administrador Adega Express"
ADMIN_EMAIL="admin@adegaexpress.com.br"
ADMIN_PASSWORD="AdminPassword123!"
```

Execute as migrações e popule o banco de demonstração (bebidas não alcoólicas):
```powershell
npm run prisma:generate
npm run prisma:deploy
npm run seed
npm run seed:demo

# Iniciar servidor de desenvolvimento na porta 3001
npm run dev
```
- **API Base:** `http://localhost:3001`
- **Swagger UI (Documentação Interativa):** `http://localhost:3001/docs`

### 3. Configurando e Iniciando o Frontend (`http://localhost:3000`)

Em outro terminal:
```powershell
cd adega-express-frontend

# Instalar dependências
npm install

# Criar .env.local (opcional, padrão já aponta para http://localhost:3001)
cp .env.example .env.local

# Iniciar servidor Next.js na porta 3000
npm run dev
```
Acesse **`http://localhost:3000`** no navegador.

---

## 🧪 Como Executar os Testes Automatizados

### Backend (Testes Unitários, Typecheck, Lint, Build e Integração com MySQL)
```powershell
cd adega-express-backend

# Verificação completa (Prisma generate + TypeScript + ESLint + 12 Testes Unitários + Build)
npm run check

# Testes de Integração HTTP + Migrações + Seeds em instância MySQL isolada (24 cenários)
npm run test:integration
```

### Frontend (TypeScript, ESLint e Build de Produção)
```powershell
cd adega-express-frontend

npx tsc --noEmit
npm run lint
npm run build
```

---

## 📂 Estrutura do Repositório

- [`adega-express-backend/`](./adega-express-backend): API RESTful Express + Prisma + MySQL, migrações não destrutivas, seeds não alcoólicos, documentação OpenAPI e suíte de testes automatizados.
- [`adega-express-frontend/`](./adega-express-frontend): Aplicação web Next.js com catálogo público, filtros, carrinho com cotação no servidor, checkout demonstrativo, área do cliente, mesa de operações (Atendente/Admin) e painel do entregador.
