# 🥤 Adega Express — E-commerce & Gestão Operacional (v5.9)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-indigo?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![Testes Automatizados](https://img.shields.io/badge/Testes-50%20Aprovados-success)](docs/evidencias/2026-11-10)
[![Documento de Visão](https://img.shields.io/badge/Documento_de_Visão-v5.9-success)](docs/documento_de_visao)

Sistema monorepo de comércio eletrônico B2C e retaguarda operacional desenvolvido para uma distribuidora de bebidas não alcoólicas (águas, sucos integrais, refrigerantes e chás prontos), com foco em integridade de estoque, controle de entregas e auditoria de transações.

---

## 📌 Documentação Oficial e Entregáveis Acadêmicos

Os documentos formais de especificação e padrões de projeto estão centralizados na pasta [`docs/`](docs/):

| Documento | Descrição | Formato |
| :--- | :--- | :---: |
| **Documento de Visão v5.9** | Especificação completa contendo Requisitos (RF/RNF), Regras de Negócio (RN), **Diagrama de Classes (Seção 11)**, **5 Diagramas de Sequência (Seção 12)**, **Protótipo de Telas T01–T15 (Seção 13)**, Modelo Físico/DDL (Seção 14), APIs (Seção 15) e Resultados dos Testes (Seção 16). | [PDF](docs/documento_de_visao/Adega_Express_Documento_de_Visao_v5_9_FINAL.pdf) \| [DOCX](docs/documento_de_visao/Adega_Express_Documento_de_Visao_v5_9_FINAL.docx) |
| **Resumo de Padrões de Projeto** | Estudo detalhado dos **22 padrões GoF** clássicos em TypeScript, com **Apêndice A** demonstrando a aplicação prática no código real do Adega Express (*Singleton*, *Chain of Responsibility* e *State*). | [PDF](docs/padroes_de_projeto/22-Padroes-de-Projetos.pdf) |
| **Pacote de Evidências Técnicas** | Logs de execução (`A1` a `D5`), conferência de 50 testes automatizados, integridade transacional de estoque e capturas de tela em ambiente publicado. | [`docs/evidencias/2026-11-10`](docs/evidencias/2026-11-10) |

---

## 🌐 Ambientes Publicados (Demonstração)

- **Frontend (Loja & Painel):** [https://adega-express-six.vercel.app](https://adega-express-six.vercel.app)
- **Backend (API REST):** [https://adegaexpress.onrender.com/health](https://adegaexpress.onrender.com/health)

---

## 📁 Estrutura do Repositório

```text
AdegaExpress/
├── adega-express-backend/     # API REST em Node.js/Express, TypeScript e Prisma ORM
│   ├── prisma/                # Schema de banco de dados e migrações PostgreSQL
│   ├── src/
│   │   ├── controllers/       # Controladores de rotas HTTP
│   │   ├── lib/               # Regras de negócio atômicas e validações
│   │   ├── middlewares/       # Autenticação JWT, autorização RBAC e segurança
│   │   ├── routes/            # Declaração das 45 rotas da API
│   │   └── services/          # Camada de serviços e persistência
│   └── tests/                 # Suíte de testes unitários e de integração
│
├── adega-express-frontend/    # Interface Web em Next.js 16 (App Router) + Tailwind CSS
│   ├── src/
│   │   ├── app/               # Páginas públicas e rotas protegidas por perfil
│   │   ├── components/        # Componentes visuais e interativos
│   │   └── context/           # Gerenciamento de estado global (Auth, Carrinho)
│
└── docs/                      # Documentação de engenharia e evidências
    ├── documento_de_visao/    # Documento de Visão v5.9 (PDF e DOCX)
    ├── padroes_de_projeto/    # Resumo acadêmico dos 22 padrões GoF (PDF)
    ├── evidencias/            # Logs de compilação, testes, métricas e capturas
    └── historico/             # Relatórios técnicos de versões anteriores
```

---

## 👥 Perfis de Usuário e Segurança (RBAC)

O controle de acesso é gerenciado via tokens **JWT** transmitidos em cookies `HttpOnly` e validados a cada requisição:

- **Visitante:** Navegação no catálogo público por categorias, busca textual e visualização de produtos em falta.
- **Cliente:** Gestão de carrinho, aplicação de cupons válidos, múltiplos endereços de entrega, checkout demonstrativo e acompanhamento do histórico de pedidos.
- **Atendente:** Consulta da fila operacional de pedidos, conferência e confirmação manual do pagamento demonstrativo (`PAGO`), avanço para separação e despacho.
- **Entregador:** Visão restrita aos pedidos sob sua responsabilidade, com registro de saída para entrega (`EM_ROTA`) e confirmação de recebimento (`ENTREGUE`).
- **Administrador:** Acesso irrestrito — gestão de catálogo, movimentação manual de estoque (`moveStock`), controle de equipe, cupons e emissão de relatórios consolidados de vendas (`salesReport`).

---

## 🧪 Qualidade de Software e Testes Automatizados

A estabilidade técnica do projeto é validada por **50 testes automatizados** distribuídos entre:

1. **Testes Unitários (12 testes):** Executados com `node:test`, cobrindo transições da máquina de estados de pedidos, cálculo de totais, regras de desconto de cupons e tratamento de timezone civil.
2. **Testes de Fumaça (9 testes):** Validação de conectividade com banco de dados, integridade dos endpoints públicos e rotas de saúde.
3. **Testes de Integração (29 testes):** Executados via `node:test` e `Supertest`, validando o ciclo completo de compras, débito atômico de estoque (`transaction()`), expiração automática de pedidos em 30 minutos e idempotência de cancelamento.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 20+ (recomendado Node.js 24)
- PostgreSQL local ou instância remota
- Git

### 1. Backend

```bash
cd adega-express-backend
npm install
npx prisma generate
npm run dev
```

Executar a suíte de testes:
```bash
npm test
```

### 2. Frontend

```bash
cd ../adega-express-frontend
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.
