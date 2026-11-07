# Relatório de Estabilização - Adega Express

**Data:** 07 de Novembro de 2026  
**Branch:** `fix/estabilizacao`  
**Escopo:** Funcionamento 100% íntegro, regras de negócio atômicas, segurança RBAC, dados de demonstração limpos e suíte de testes automatizados ponta a ponta.

---

## 1. Bugs Encontrados e Corrigidos

1. **Separação Rigorosa dos Painéis de Administrador e Atendente:**
   - *Problema:* O login com perfil de Administrador exibia apenas a aba única do Atendente ou operava em visual misturado sem distinção no backend.
   - *Correção:* Segregação estrita dos painéis. O Atendente acessa exclusivamente a mesa operacional de *Pedidos & Entregas* (com confirmação manual de pagamento e despacho). O Administrador possui acesso completo com as abas: *Pedidos & Entregas*, *Catálogo & Categorias*, *Gestão de Estoque* (com modal de ajuste de saldo ENTRADA/SAIDA com motivo obrigatório e histórico), *Cupons de Desconto*, *Equipe & Perfis* e *Relatórios de Vendas* (com filtros por data e agrupamentos). No backend (`routes/api.ts`), endpoints como `/admin/products`, `/admin/categories`, `/reports/sales` e `/staff` retornam estritamente `HTTP 403 Forbidden` para qualquer perfil que não seja `ADMINISTRADOR`.

2. **Isolamento de Sacola e Perfis Internos:**
   - *Problema:* A sacola persistia entre contas e perfis internos (`ADMINISTRADOR`, `ATENDENTE`, `ENTREGADOR`) viam o contador de sacola e podiam iniciar fluxos de checkout indevidos.
   - *Correção:* Em `CartContext.tsx` e `Navbar.tsx`, a sacola agora utiliza chaves de armazenamento isoladas por usuário (`cart_user_<id>` e `cart_guest`), limpando o estado na troca de sessão. Usuários internos têm o botão de sacola ocultado no cabeçalho e rodapé, e qualquer tentativa de adicionar itens à sacola ou chamar checkout por perfil interno é rejeitada com erro amigável no frontend e `HTTP 403` no backend.

3. **Consolidação da Marca:**
   - *Problema:* Ocorrência de múltiplos termos conflitantes na interface ("Boutique de Bebidas Sem Álcool", "Maison Não Alcoólica", tags técnicas de visão).
   - *Correção:* Padronização de todos os cabeçalhos, títulos de abas e metatags para a marca oficial única: **"Adega Express - bebidas não alcoólicas"**.

4. **Tratamento de Filtros e Erros de Servidor no Catálogo:**
   - *Problema:* Entradas numéricas com vírgula ou filtros de preço podiam causar erro interno `500` não tratado.
   - *Correção:* Sanitização de strings numéricas e validação robusta no frontend e no schema Zod (`productQuery`), garantindo tratamento elegante com mensagens amigáveis na interface e código `HTTP 400` para entradas inválidas.

5. **Relógio Controlável e Idempotência na Expiração de Pedidos (RN07):**
   - *Problema:* Prazo de 30 minutos de cancelamento fixo e sem capacidade de injeção de relógio para testes rápidos ou configuração customizada.
   - *Correção:* O serviço `order.service.ts` (`expirePendingOrders`) agora aceita parâmetros de relógio e duração configurável pela variável de ambiente `ORDER_EXPIRATION_MINUTES` (padrão 30). O cancelamento e devolução de estoque operam em transação isolada com proteção contra reabertura e devolução duplicada.

---

## 2. Mapeamento de Rotas e Telas

| Identificador | Tela / Módulo | Rota Frontend | Perfil de Acesso | Descrição do Conteúdo |
| :--- | :--- | :--- | :--- | :--- |
| **T01** | Catálogo / Home | `/` | Público / Cliente | Vitrine por categorias, busca, filtros de volume e preço, selo "Em Falta". |
| **T02** | Detalhe do Produto | `/produto/[id]` | Público / Cliente | Nome, foto/ilustração, especificações (volume, 0% ABV), estoque e adicionar à sacola. |
| **T03** | Cadastro | `/cadastro` | Público | Formulário completo com validação de dados, e-mail único e perfil estritamente CLIENTE. |
| **T04** | Login | `/login` | Público | Acesso unificado com autenticação via cookie seguro e JWT, direcionando por perfil. |
| **T05** | Carrinho / Sacola | `/carrinho` | Visitante / Cliente | Lista de itens, ajuste de quantidades, cálculo de subtotal, aviso de frete e cupom. |
| **T06** | Checkout Demonstrativo | `/carrinho` (Etapa 2) | Cliente | Seleção de endereço fictício, aplicação de cupom, frete R$ 7,90, pagamento PIX/Cartão e aviso acadêmico. |
| **T07** | Meus Endereços | `/perfil` | Cliente | Gestão de endereços com definição de endereço padrão único, criação e arquivamento. |
| **T08** | Meus Pedidos | `/pedidos` | Cliente | Histórico dos pedidos do cliente autenticado com status variados (Pendente, Confirmado, Em Rota, Entregue, Cancelado). |
| **T09** | Painel Atendente (Fila) | `/admin` (Aba Pedidos) | Atendente / Admin | Fila de pedidos operacionais, conferência de pagamentos e atribuição de entregador. |
| **T10** | Painel Entregador | `/entregador` | Entregador | Console móvel com entregas atribuídas exclusivamente ao entregador autenticado. |
| **T11** | Admin: Pedidos & Entregas | `/admin` (Aba Pedidos) | Administrador | Visão macro de todos os pedidos e entregas com filtros por status e intervalo de datas. |
| **T12** | Admin: Catálogo & Categorias | `/admin` (Aba Catálogo) | Administrador | 4 categorias oficiais permitidas, cadastro, edição e inativação de produtos/categorias. |
| **T13** | Admin: Gestão de Estoque | `/admin` (Aba Estoque) | Administrador | Saldos atuais, indicador de estoque baixo e modal de ajuste (ENTRADA/SAIDA) com motivo e histórico. |
| **T14** | Admin: Relatórios de Vendas | `/admin` (Aba Relatórios) | Administrador | Filtro de período, receita consolidada (apenas pedidos pagos), ticket médio, mais vendidos e métodos de pagamento. |
| **T15** | Detalhe do Pedido | `/pedidos/[id]` | Cliente / Staff | Visão completa do pedido: itens, endereço em snapshot, comprovante de pagamento e linha do tempo de status. |

---

## 3. Instruções de Execução

### Subir os Ambientes Locais
1. **Backend (Node.js + Express + Prisma):**
   ```bash
   cd adega-express-backend
   npm run dev
   # Servidor escutando em http://localhost:3001
   ```
2. **Frontend (Next.js + Tailwind):**
   ```bash
   cd adega-express-frontend
   npm run dev
   # Aplicação disponível em http://localhost:3000
   ```

### Scripts de Seed e Demonstração
1. **Carga Limpa e Idempotente de Demonstração (Exige confirmação):**
   ```bash
   cd adega-express-backend
   npm run seed:demo -- --confirm
   ```
   *Contas criadas (senha padrão `Admin@123`):*
   - `admin@adegaexpress.com` (Administrador)
   - `atendente@adegaexpress.com` (Atendente)
   - `entregador@adegaexpress.com` (Entregador)
   - `cliente@adegaexpress.com` (Cliente)

2. **Gerar Pedido PENDENTE Fresco na Hora (Para captura antes dos 30 minutos):**
   ```bash
   cd adega-express-backend
   npm run demo:pedido-pendente
   ```

### Suíte de Testes Automatizados
- **Smoke Tests Ponta a Ponta (Fluxo completo e regras de segurança):**
  ```bash
  cd adega-express-backend
  npm run test:smoke
  ```
- **Testes Unitários:**
  ```bash
  cd adega-express-backend
  npm run test
  ```

---

## 4. Matriz de Requisitos e Regras de Negócio

| Código | Requisito / Regra | Status | Onde Verificar e Evidência Técnica |
| :--- | :--- | :---: | :--- |
| **RF01** | Catálogo por categoria com filtros (nome, marca, volume, preço) | **OK** | Frontend `/` e Backend `GET /products?category_id=&min_price=...`. Validado no Smoke Test #2. |
| **RF02** | Produto sem estoque aparece "em falta" e não permite compra | **OK** | Retorna `in_stock: false`. Backend bloqueia no checkout com `409 Estoque insuficiente`. Validado no Smoke Test #3. |
| **RF03** | Cadastro, login, logout com perfis (CLIENTE, ATENDENTE, ENTREGADOR, ADMIN) | **OK** | Formulário `/cadastro` fixa `CLIENTE`. Login `/login` entrega JWT e cookie HttpOnly. Validado no Smoke Test #1. |
| **RF04** | E-mail único no cadastro | **OK** | Restrição de unicidade no banco (`User.email`) e validação Zod no backend. |
| **RF05** | Carrinho: adicionar, remover, alterar quantidade | **OK** | `CartContext.tsx` valida limites e isola storage por `user.id`. Perfis internos bloqueados. |
| **RF06** | Cotação calculada no servidor (subtotal, desconto, frete, total) | **OK** | Endpoint `POST /orders/quote` calcula frete R$ 7,90 e descontos via `Prisma.Decimal`. |
| **RF07** | Pagamento PIX e Cartão demonstrativos (sem cobrança real) | **OK** | Checkout registra método sem chamar adquirentes e sem capturar dados de cartão de crédito. |
| **RF08** | Cupons de desconto com validação de vigência e status | **OK** | `BEMVINDO10` e `ADEGA5` aceitos; `EXPIRADO20` e `INATIVO10` rejeitados com `400`. Smoke Test #4. |
| **RF09** | Pedido e baixa de estoque atômicos em transação | **OK** | `order.service.ts` executa `$transaction` com `FOR UPDATE` e verificação de saldo. Smoke Test #7. |
| **RF10** | Cliente vê apenas os próprios pedidos | **OK** | Endpoint `GET /orders` filtra `where: { user_id }` para CLIENTE. Acesso a pedido alheio retorna 403/404. Smoke Test #8. |
| **RF11** | Atendente atualiza status e atribui entregador | **OK** | Endpoints `PATCH /orders/:id/status` e `PATCH /deliveries/:id/assign`. Smoke Test #5. |
| **RF12** | Entregador vê e atualiza apenas as próprias entregas | **OK** | Endpoint `GET /deliveries/my` e `PATCH /deliveries/:id/status` com trava de titularidade. Smoke Test #8. |
| **RF13** | Admin cadastra/edita/inativa produtos e categorias sem apagar histórico | **OK** | Soft-delete com coluna `active: Boolean`, preservando integridade referencial nas FKs. |
| **RF14** | Ajuste manual de estoque com motivo obrigatório, sem saldo negativo | **OK** | Endpoint `POST /products/:id/stock` com schema `z.object({ type, quantity, reason })` e trava de saldo. |
| **RF15** | Admin vê todos os pedidos e entregas com filtros por status e período | **OK** | Aba *Pedidos & Entregas* no `/admin` com seletores de status e datas via query params. |
| **RF16** | Relatórios de vendas consideram apenas pedidos pagos | **OK** | `admin.service.ts` agrega `where: { payment_status: 'PAGO' }`, descartando cancelados/pendentes. |
| **RF17** | Quantidades grandes tratadas sem overflow | **OK** | `quantity` tipado como Int até 1.000.000 e valores monetários manipulados via `Decimal(10,2)`. |
| **RF18** | Expiração automática de pedidos pendentes em 30 min com devolução | **OK** | `expirePendingOrders` cancela pedidos > 30min, devolve estoque e gera movimentação. Smoke Test #6. |
| **RF20** | Proteção contra escalação de perfil no cadastro público | **OK** | Endpoint `/auth/register` não consome campo `role`, atribuindo imutavelmente `Role.CLIENTE`. |
| **RF21** | Endereços do cliente com padrão único e arquivamento seguro | **OK** | Endereço padrão recalculado em transação atômica; arquivamento (`archived: true`) preserva pedidos antigos. |
| **RF22** | Confirmação manual de pagamento (PAGO) por Atendente/Admin | **OK** | Endpoint `PATCH /orders/:id/payment` armazena `PaymentRecord` com ator, data e referência. Smoke Test #5. |
| **RN05** | Pedido SEPARADO cria entrega AGUARDANDO | **OK** | Transição para SEPARADO executa `tx.delivery.create({ data: { status: 'AGUARDANDO' } })`. Smoke Test #5. |
| **RN06** | Sincronização entre entrega e pedido (SAIU_PARA_ENTREGA -> EM_ROTA, ENTREGUE -> ENTREGUE) | **OK** | `updateDeliveryStatus` atualiza o pedido correspondente de forma bidirecional e atômica. Smoke Test #5. |
| **RN08** | Pedido só avança para CONFIRMADO após PAGO | **OK** | Validação `assertOrderTransition` rejeita CONFIRMADO se `payment_status !== 'PAGO'`. |
| **RN09** | Conclusão da entrega exige pagamento confirmado | **OK** | Conclusão de entrega valida se pedido foi quitado previamente. Smoke Test #5. |
| **RN11/13** | Catálogo público exibe apenas categorias e produtos ativos e não alcoólicos | **OK** | Filtro estrito `abv_percent: 0` e categorias restritas a `['Água', 'Sucos', 'Refrigerantes', 'Chás']`. |
