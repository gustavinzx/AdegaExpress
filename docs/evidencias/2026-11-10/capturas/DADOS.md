# REGISTRO DE DADOS DE DEMONSTRAÇÃO E RASTREABILIDADE DAS CAPTURAS
**Data de Emissão:** 10 de Novembro de 2026  
**Ambiente:** Local (Frontend http://localhost:3000 | Backend http://localhost:3001)  
**Banco de Dados:** MySQL local (`adega_express`)

---

## 1. Contas Oficiais de Demonstração

| Perfil | Nome | E-mail | Papel no Sistema |
|:---|:---|:---|:---|
| **Administrador** | Administrador Adega Express | `admin@adegaexpress.com` | Gestão completa (produtos, categorias, estoque, pedidos, relatórios) |
| **Atendente** | Atendente Adega Express | `atendente@adegaexpress.com` | Operação de pedidos, conferência de pagamentos e atribuição de entregas |
| **Entregador** | Entregador Adega Express | `entregador@adegaexpress.com` | Visualização de entregas atribuídas e atualização de status em rota |
| **Cliente** | Cliente Adega Express | `cliente@adegaexpress.com` | Navegação, carrinho, checkout, consulta de pedidos e gestão de endereços |

---

## 2. Endereço Padrão do Cliente

- **ID do Endereço:** #38
- **Logradouro:** Rua das Palmeiras, nº 123 (Bloco B, Sala 4)
- **Bairro:** Asa Sul
- **Cidade / UF:** Brasília - DF
- **CEP:** 70000-000
- **Padrão:** Sim (`is_default: true`)

---

## 3. Pedidos Demonstrativos do Cliente (cliente@adegaexpress.com)

| ID do Pedido | Status do Pedido | Status Pagamento | Método | Valor Total | Itens / Resumo | Motivo de Cancelamento / Histórico |
|:---:|:---:|:---:|:---:|:---:|:---|:---|
| **#111** | `PENDENTE` | `PENDENTE` | PIX | R$ 32.7 | Água Prata 1,5L (2 un) + Chá Verde Feel Good 1L (1 un) | Aguardando conferência do atendente |
| **#109** | `CONFIRMADO` | `PAGO` | CARTÃO | R$ 39.7 | Coca-Cola Lata 350ml (4 un) + Fuze Tea Pêssego (2 un) | Pagamento confirmado pelo operador |
| **#108** | `SEPARADO` | `PAGO` | PIX | R$ 38.4 | Suco Laranja Natural One (2 un) + Matte Leão 1,5L (1 un) | Itens separados no estoque; entrega aguardando |
| **#107** | `EM_ROTA` | `PAGO` | PIX | R$ 39.7 | Água Com Gás 500ml (3 un) + Guaraná Antarctica (4 un) | Entregador em trânsito para o cliente |
| **#106** | `ENTREGUE` | `PAGO` | CARTÃO | R$ 50.92 | Suco Aurora Tinto 1L (2 un) + Água Sem Gás 500ml (4 un) | Entregue com sucesso |
| **#110** | `CANCELADO` | `PENDENTE` | PIX | R$ 22.1 | Suco de Maçã Integral 1L (1 un) | "Pagamento demonstrativo não confirmado no prazo de 30 minutos (RN07)." |

---

## 4. Entregas Atribuídas ao Entregador (entregador@adegaexpress.com)

| ID da Entrega | Pedido Vinculado | Status da Entrega | Status do Pedido | Destinatário e Endereço | Ação Disponível |
|:---:|:---:|:---:|:---:|:---|:---|
| **#41** | Pedido #108 | `AGUARDANDO` | `SEPARADO` | Cliente Adega Express - Rua das Acácias, 45 | Registrar Saída para Entrega |
| **#40** | Pedido #107 | `SAIU_PARA_ENTREGA` | `EM_ROTA` | Cliente Adega Express - Rua das Palmeiras, 123 | Confirmar Entrega Realizada |

---

## 5. Catálogo de Produtos Não Alcoólicos

| ID | Categoria | Nome do Produto | Marca | Preço Unit. | Estoque | Situação no Catálogo |
|:---:|:---|:---|:---|:---:|:---:|:---|
| #222 | Água | Água Mineral Sem Gás 500ml | Minalba | R$ 3.5 | 90 un | Disponível (Gelada / Comprar) |
| #223 | Água | Água Mineral Com Gás 500ml | São Lourenço | R$ 4.2 | 65 un | Disponível (Gelada / Comprar) |
| #224 | Água | Água Mineral Premium Sem Gás 1,5L | Prata | R$ 7.8 | 40 un | Disponível (Gelada / Comprar) |
| #225 | Água | Água Tônica Citrus Sem Açúcar 350ml | Antarctica | R$ 5.9 | 0 un | **Em falta / Esgotado** (Selo Esgotado) |
| #226 | Sucos | Suco Integral de Uva Tinto 1L | Aurora | R$ 16.9 | 35 un | Disponível (Gelada / Comprar) |
| #227 | Sucos | Suco de Laranja Integral 900ml | Natural One | R$ 13.5 | 50 un | Disponível (Gelada / Comprar) |
| #228 | Sucos | Suco de Maçã Integral 1L | Campo Largo | R$ 14.2 | 28 un | Disponível (Gelada / Comprar) |
| #229 | Sucos | Néctar de Maracujá 1L | Maguary | R$ 9.9 | 30 un | Disponível (Gelada / Comprar) |
| #230 | Refrigerantes | Refrigerante Guaraná Antarctica 350ml | Antarctica | R$ 4.8 | 90 un | Disponível (Gelada / Comprar) |
| #231 | Refrigerantes | Coca-Cola Original 350ml Lata | Coca-Cola | R$ 5.2 | 120 un | Disponível (Gelada / Comprar) |
| #232 | Refrigerantes | Refrigerante Sprite Lemon Fresh 500ml | Sprite | R$ 5.8 | 45 un | Disponível (Gelada / Comprar) |
| #233 | Refrigerantes | Refrigerante de Gengibre Ginger Ale 350ml | London Essence | R$ 8.9 | 25 un | Disponível (Gelada / Comprar) |
| #234 | Chás | Chá Gelado Matte Limão 1,5L | Matte Leão | R$ 8.5 | 40 un | Disponível (Gelada / Comprar) |
| #235 | Chás | Chá Gelado de Pêssego 450ml | Fuze Tea | R$ 5.5 | 55 un | Disponível (Gelada / Comprar) |
| #236 | Chás | Chá Verde com Limão e Hortelã 1L | Feel Good | R$ 9.2 | 32 un | Disponível (Gelada / Comprar) |
| #237 | Chás | Infusão Hibisco com Cranberry 450ml | Wewi | R$ 8.9 | 30 un | Disponível (Gelada / Comprar) |

---

## 6. Mapeamento Específico por Tela do Protótipo (T01 a T15 e Complementares)

| ID Tela | Nome da Tela | Rota | Perfil Utilizado | Entidade / IDs em Foco |
|:---|:---|:---|:---|:---|
| **T01** | Catálogo Principal (Home) | `/` | Visitante | Catálogo completo (16 produtos ativos, categorias oficiais) |
| **T01c** | Catálogo com Item em Falta | `/#catalogo` | Visitante | Catálogo com Produto #225 em falta (estoque 0) e produtos #222, #223, #224 disponíveis |
| **T02** | Detalhe do Produto | `/produto/222` | Visitante | Produto #222 (Água Mineral Sem Gás 500ml) |
| **T03** | Cadastro de Cliente | `/cadastro` | Visitante | Formulário de cadastro de cliente (nome completo, e-mail e senha) |
| **T04** | Autenticação / Login | `/login` | Visitante | Console de login com botões de 1-clique demo |
| **T05** | Carrinho de Compras | `/carrinho` | Cliente | Carrinho preenchido com 2 itens, subtotal e frete R$ 7,90 |
| **T06** | Checkout / Pagamento | `/carrinho` (etapa checkout) | Cliente | Endereço padrão #38, forma de pagamento e total |
| **T07** | Meus Endereços | `/perfil` | Cliente | Endereço padrão #38 listado |
| **T08** | Meus Pedidos (Parte 1) | `/pedidos` | Cliente | Fila de pedidos: #111 (PENDENTE) e #110 (CANCELADO) |
| **T08b** | Meus Pedidos (Parte 2) | `/pedidos` | Cliente | Pedidos #109 (CONFIRMADO), #108 (SEPARADO), #107 (EM_ROTA) e #106 (ENTREGUE) visíveis simultaneamente |
| **T09** | Painel de Operações / Atendente | `/admin` | Atendente | Lista de pedidos com filtros operacionais |
| **T10** | Painel do Entregador | `/entregador` | Entregador | As 2 entregas atribuídas: Entrega #41 e #40 |
| **T11** | Gestão de Pedidos (Admin) | `/admin` (Aba Pedidos) | Administrador | Pedido #111 com botão de confirmar pagamento |
| **T12** | Catálogo & Categorias | `/admin` (Aba Produtos) | Administrador | Tabela de produtos ativos com preços e marcas |
| **T13** | Gestão de Estoque | `/admin` (Aba Estoque) | Administrador | Tabela de saldos de estoque e histórico de movimentações |
| **T13b** | Modal de Ajuste de Estoque | `/admin#estoque` | Administrador | Modal com quantidade, motivo obrigatório e histórico real (+10 un. "Reposição de estoque") |
| **T14** | Relatórios de Vendas | `/admin` (Aba Relatórios) | Administrador | Relatório de vendas gerado com filtros de período |
| **T15** | Detalhes do Pedido | `/pedidos/111` | Cliente | Detalhe completo do pedido #111 com histórico de status |
