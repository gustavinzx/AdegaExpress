# Adega Express — Frontend Web

Interface web do **Adega Express**, construída com **Next.js 16 (App Router)**, **React 19**, **TypeScript** e **Tailwind CSS v4**, adequada ao **Documento de Visão v4.3** (loja virtual demonstrativa exclusivamente de bebidas não alcoólicas).

## 1. Escopo e Funcionalidades Implementadas

- **Catálogo Público Não Alcoólico (`/`):**
  - Exibição das categorias permitidas (**Água**, **Sucos**, **Refrigerantes** e **Chás**).
  - Filtros combinados por nome, categoria, marca, volume (mL) e faixa de preço mínimo/máximo (RF01 / UC04).
  - Indicação clara de produtos **"Em Falta"** (`stock_quantity = 0`) com bloqueio de adição ao carrinho (RF02 / RN03).
  - Seção integrada de **Ajuda On-line e Perguntas Frequentes (`/#ajuda`)** (Seção 8.3 do Documento de Visão).
- **Detalhes do Produto (`/produto/[id]`):**
  - Informações completas de marca, categoria, volume, preço, disponibilidade em estoque e seletor de quantidade para compras unitárias ou para pequenos eventos (RF17).
- **Autenticação e Cadastro (`/cadastro`, `/login`):**
  - Cadastro simplificado de cliente com nome, e-mail e senha (mínimo de 8 caracteres) conforme UC02 / RF04, sem exigência de CPF ou verificação de maioridade (18+).
  - Sessão integrada via cookie `HttpOnly` (`credentials: 'include'`) + token Bearer e invalidação no backend via `POST /auth/logout` (UC13 / RF20).
- **Carrinho e Checkout Demonstrativo (`/carrinho`):**
  - Cotação em tempo real no servidor (`POST /orders/quote`) calculando subtotal, desconto de cupom e taxa fixa de entrega (RF06 / UC06).
  - Seleção de modalidade de pagamento demonstrativa (**PIX** ou **Cartão**) com aviso explícito de que nenhuma cobrança financeira real é realizada e sem geração de QR Code (RF07 / RNF05).
  - Envio de chave de idempotência (`Idempotency-Key`) na criação do pedido (`POST /orders`).
- **Perfil e Endereços do Cliente (`/perfil`):**
  - Cadastro, edição (`PUT /addresses/:id`), definição de endereço padrão e arquivamento (`DELETE /addresses/:id`) de endereços de entrega (UC14 / RF21 / RN10).
  - Alteração de senha com revogação de sessões anteriores (`PATCH /auth/password`).
- **Meus Pedidos (`/pedidos`):**
  - Linha do tempo visual das 5 etapas do pedido (`PENDENTE` → `CONFIRMADO` → `SEPARADO` → `EM_ROTA` → `ENTREGUE`), situação do pagamento demonstrativo e opção de cancelamento pelo cliente enquanto `PENDENTE` (RF10 / RF15).
- **Painel Administrativo e Operacional (`/admin`):**
  - **Pedidos (Atendente e Administrador):** Filtros por status e período, registro de confirmação manual do pagamento demonstrativo (`PAGO` / `ESTORNADO` com referência — UC11 / RN12), avanço de status operacional respeitando RN08 e atribuição de entregador (UC08 / RF11).
  - **Catálogo (Administrador):** Criação, edição e ativação/inativação de categorias e produtos não alcoólicos (UC09 / RF13).
  - **Estoque (Administrador):** Filtro de estoque baixo, registro de movimentações manuais (`ENTRADA` e `SAIDA` com motivo obrigatório) e consulta ao histórico auditável de movimentações (UC10 / RF14).
  - **Cupons (Administrador):** Criação e gerenciamento de cupons percentuais ou fixos com data de validade e limite de usos (UC06).
  - **Equipe (Administrador):** Cadastro de usuários internos (`ATENDENTE`, `ENTREGADOR`, `ADMINISTRADOR`) e ativação/desativação de contas.
  - **Relatórios (Administrador):** Relatório de vendas por período (`from`, `to`, `group_by`) com receita paga, total de pedidos pagos, ticket médio, produtos mais vendidos, vendas por categoria, vendas por modalidade de pagamento e alertas de estoque baixo (UC12 / RF16).
- **Painel do Entregador (`/entregador`):**
  - Consulta exclusiva às entregas atribuídas ao entregador autenticado e botões de atualização para `SAIU_PARA_ENTREGA` e `ENTREGUE` (bloqueado enquanto o pagamento não estiver `PAGO` — UC03 / RF12 / RN06 / RN09).

## 2. Configuração e Execução

```powershell
cd adega-express-frontend
npm install
cp .env.example .env.local
npm run dev
```

Variável de ambiente em `.env.local`:
```dotenv
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 3. Verificação de Qualidade

```powershell
npx tsc --noEmit
npm run lint
npm run build
```
