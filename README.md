# 🍷 Adega Express

Um sistema completo, moderno e de alto padrão (E-commerce & Sistema de Gestão) para adegas, cervejarias e lojas de conveniência. 

![Status](https://img.shields.io/badge/Status-Conclu%C3%ADdo-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎯 Sobre o Projeto

O **Adega Express** é uma plataforma ponta-a-ponta que unifica a experiência de compra premium do cliente final com um sistema robusto de gestão de operações para os donos e entregadores. O projeto possui um design *dark premium*, remetendo à identidade clássica de tabacarias e adegas de luxo.

O sistema é dividido em duas partes operando em um monorepo:
- **Frontend:** Interface Web ultrarrápida construída com **Next.js 15** e Tailwind CSS v4.
- **Backend:** API RESTful robusta desenvolvida em **Node.js** com TypeScript, Express e **Prisma ORM** (MySQL).

## ✨ Principais Funcionalidades

### 🛒 Para o Cliente (E-commerce)
- **Trava de Idade Rigorosa:** Verificação de maioridade baseada na Data de Nascimento no momento do cadastro (compliance legal).
- **Catálogo Premium:** Divisão inteligente por categorias (Cervejas, Destilados, Vinhos, Tabacaria e Sem Álcool).
- **Checkout Completo:** Sistema de carrinho de compras fluido, com aplicação dinâmica de cupons de desconto.
- **Simulação de Pagamento:** Fluxo de finalização integrado suportando Cartão de Crédito e simulação realista de **PIX (QR Code & Copia-e-Cola)**.
- **Painel de Perfil:** Gerenciamento de múltiplos endereços de entrega e visualização do histórico e status de pedidos.

### 👔 Para o Dono (Painel Administrador)
- **Mesa de Operações:** Dashboard centralizado acessível por usuários com permissão `ADMINISTRADOR`.
- **Gestão de Pedidos:** Acompanhamento do ciclo de vida completo do pedido (Aguardando Pagamento -> Em Separação -> Saiu para Entrega -> Entregue).
- **Despacho Logístico:** Atribuição manual de pedidos aos entregadores disponíveis.
- **Gestão de Catálogo e Estoque:** Visualização de todos os produtos, preços e disponibilidade.

### 🛵 Para o Motoboy (Painel do Entregador)
- **Interface Mobile-First:** Tela simplificada com botões gigantes e design focado para uso na rua (celular).
- **Aceite de Corridas:** Entregador visualiza os pedidos despachados para ele.
- **Mudança de Status Rápida:** Botões de ação para registrar "Saiu para Entrega" e, posteriormente, "Pedido Entregue", atualizando em tempo real para o administrador e para o cliente.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- [Next.js 15](https://nextjs.org/) (App Router & React 19)
- [Tailwind CSS v4](https://tailwindcss.com/) (Estilização Utilitária)
- [Framer Motion](https://www.framer.com/motion/) (Animações Fluídas)
- [Lucide React](https://lucide.dev/) (Ícones)
- [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/) (Validação Client-side)

### Backend
- [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) (API)
- [TypeScript](https://www.typescriptlang.org/) (Tipagem Segura)
- [Prisma ORM](https://www.prisma.io/) (Banco de Dados)
- [MySQL](https://www.mysql.com/) (Armazenamento Relacional)
- [JSON Web Tokens (JWT)](https://jwt.io/) (Autenticação Stateless via Cookies HTTP-Only)
- [Bcryptjs](https://www.npmjs.com/package/bcryptjs) (Criptografia de Senhas)

---

## 🚀 Como Rodar o Projeto Localmente

Siga os passos abaixo para testar o projeto na sua máquina:

### 1. Pré-requisitos
- Node.js (v18+)
- MySQL rodando localmente (ou via Docker)
- Git

### 2. Clonando o Repositório
```bash
git clone https://github.com/gustavinzx/AdegaExpress.git
cd AdegaExpress
```

### 3. Configurando o Backend
```bash
cd adega-express-backend

# Instale as dependências
npm install

# Crie e preencha suas variáveis de ambiente baseado no exemplo
cp .env.example .env

# Configure a URL do seu MySQL no arquivo .env gerado, exemplo:
# DATABASE_URL="mysql://root:suasenha@localhost:3306/adega_express"

# Rode as migrações para criar as tabelas no banco de dados
npx prisma migrate dev

# Popule o banco com dados de exemplo (Cervejas, Destilados, etc.)
npx ts-node seed_full_catalog.ts

# Inicie o servidor
npm run dev
```
O servidor da API estará rodando em `http://localhost:3001`.

### 4. Configurando o Frontend
Abra um novo terminal e navegue até a pasta do frontend:
```bash
cd adega-express-frontend

# Instale as dependências
npm install

# Crie o arquivo de ambiente apontando para a API local
cp .env.example .env.local

# Inicie a aplicação
npm run dev
```
O site estará acessível em `http://localhost:3000`.

---

## 🛡️ Segurança e Decisões de Arquitetura

- **Autenticação Segura:** Tokens JWT não ficam expostos em `localStorage`. A aplicação utiliza o padrão `httpOnly` para gravar os cookies no navegador, neutralizando ataques de XSS (Cross-Site Scripting).
- **Idempotência no Carrinho:** Validações rigorosas no backend previnem cobranças duplicadas e manipulações de preço no client-side durante o checkout.
- **Layout Furtivo:** O botão de acesso ao Painel de Administração fica escondido no rodapé e é reativo à credencial do banco de dados (só é montado no HTML se o usuário for `ADMINISTRADOR`).

---

## 👨‍💻 Desenvolvido por
**Gustavo** (gustavinzx)

Um projeto criado com amor à boa interface, engenharia de software sólida e respeito à sede da sexta-feira! 🥃
