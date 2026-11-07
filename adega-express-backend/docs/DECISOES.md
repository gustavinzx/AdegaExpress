# Decisões de Arquitetura — Backend Adega Express (v4.3)

## 1. Alinhamento ao Documento de Visão v4.3 (Escopo Não Alcoólico)

- **Escopo de Catálogo:** O sistema opera exclusivamente como loja demonstrativa de bebidas não alcoólicas nas categorias **Água**, **Sucos**, **Refrigerantes** e **Chás**. Validações em `src/lib/business.ts` e `src/schemas.ts` impedem a criação ou reativação de categorias fora dessa lista, exigem `abv_percent = 0` e rejeitam nomes com termos de bebidas alcoólicas ou tabacaria.
- **Migração Segura de Legado (`20261107120000_non_alcoholic_scope`):** Categorias e produtos antigos fora do escopo não alcoólico são desativados logicamente (`active = false`) sem apagar pedidos ou itens históricos (RN11).
- **Cadastro sem Restrição Etária (UC02 / RF04):** Como o escopo é estritamente não alcoólico, o cadastro de cliente exige apenas `name`, `email` e `password` (mínimo 8 caracteres), sem bloqueio de maioridade (18+).

## 2. Compra, Estoque e Expiração em 30 Minutos

- **Cotação e Checkout Atômico (RN01 / RN02 / RF06):** `POST /orders/quote` calcula subtotal, desconto de cupom e taxa de entrega no servidor sem reservar estoque. `POST /orders` recalcula todos os valores no servidor e debita o estoque em transação `Serializable` com verificação condicional `stock_quantity >= quantity`.
- **Expiração Automática de 30 Minutos (RN07 / RF18):** Pedidos `PENDENTE` com `payment_status = PENDENTE` cujo `created_at` ultrapasse 30 minutos são cancelados automaticamente por `expirePendingOrders()` (executado em background e antes das consultas/operações de pedidos e relatórios), devolvendo o estoque na mesma transação com registro em `stock_movements` (`Cancelamento automático (RN07) - Pedido #ID`).
- **Devolução Idempotente de Estoque (RN07 / RF15):** O cancelamento verifica o status atual dentro da transação antes de devolver os itens ao saldo do produto, garantindo que nenhuma devolução ocorra em duplicidade.

## 3. Pagamento Demonstrativo e Confirmação Manual

- **Sem Cobrança Real (RF07 / RNF05):** `payment_method` (`PIX` ou `CARTAO`) registra apenas a modalidade demonstrativa escolhida pelo cliente. Não há integração bancária ou geração de QR Code.
- **Confirmação Manual Auditável (UC11 / RN08 / RN12):** A confirmação é registrada por `ATENDENTE` ou `ADMINISTRADOR` em `PATCH /orders/:id/payment`, gravando `actor_id`, `paid_at`, `status` e `reference` em `payment_records`.
- **Bloqueio de Avanço Operacional (RN08):** `PATCH /orders/:id/status` impede que um pedido avance para `CONFIRMADO` ou `SEPARADO` enquanto `payment_status !== 'PAGO'`.

## 4. Entregas e Sincronização de Status

- **Fluxo Sequencial (RN04 / RN05 / RN06 / RN09):** As etapas seguem `PENDENTE` → `CONFIRMADO` → `SEPARADO` → `EM_ROTA` → `ENTREGUE`. Ao avançar para `SEPARADO`, é criado o registro em `deliveries` com status `AGUARDANDO`.
- O entregador atribuído (`deliverer_id`) atualiza sua entrega para `SAIU_PARA_ENTREGA` (sincronizando o pedido para `EM_ROTA`) e `ENTREGUE` (sincronizando o pedido para `ENTREGUE`, exigindo `payment_status = PAGO`).

## 5. Segurança de Sessão e Autorização

- **Cookies `HttpOnly` + Bearer Token (RNF07 / UC13):** O login e o cadastro definem o cookie `adega_token` (`HttpOnly`, `SameSite=Lax`, `Secure` em produção) além de retornar o JWT no corpo para clientes de API.
- **Revogação Imediata (RF20):** `POST /auth/logout`, `PATCH /auth/password` e a desativação de usuário incrementam `token_version` e limpam o cookie, invalidando imediatamente sessões anteriores.
