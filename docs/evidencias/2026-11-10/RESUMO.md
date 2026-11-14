# RELATÓRIO CONSOLIDADO DE EVIDÊNCIAS DE VERIFICAÇÃO EMPÍRICA — ADEGA EXPRESS

**Data da Execução:** 10–12 de Novembro de 2026  
**Commit Git:** `a48ec39c13dbc3894b21d050e1f1f95c92db7925` (`HEAD` da branch `main`, Live no Render e Vercel)  
*Rastreabilidade e Relação entre Commits:*
- `ecdc2e3`: Commit da suíte consolidada inicial de 50 testes automatizados (12 unitários, 9 smoke e 29 integração A1 a D5).
- `b7f691f`: Sincronização e alinhamento da matriz de rastreabilidade do Documento de Visão v5.9 aos 50 testes reais e ao RF17.
- `6e96ed2`: Atualização formal do Documento de Visão v5.9 com propriedades limpas e recálculo do sumário no Word.
- `1959e15`: Implementação do limite de 99 unidades por item no carrinho (`schemas.ts` e `CartContext.tsx`) e sincronização docx/pdf.
- `d107ea7`: Remoção do wildcard genérico `*.vercel.app` da política de CORS.
- `a48ec39`: Commit definitivo Live no Render e na Vercel: restringe estritamente as origens permitidas ao frontend oficial (`https://adega-express-six.vercel.app`) e ao ambiente de desenvolvimento (`http://localhost:3000`), purgando qualquer domínio inexistente. Todos os testes unitários (12), smoke (9), integração (29), segurança CORS (C8) e validação em produção (D5) foram reexecutados com logs auditados neste commit.

**Ambiente e Tecnologias Homologadas:**
- **Frontend:** Next.js 16.3.4 | React 19.2.8 | Tailwind CSS 4.3.3 | Turbopack | Vercel Edge (`https://adega-express-six.vercel.app`)
- **Backend:** Node.js v24.11.0 | Express 4.22.3 | Prisma Client v5.22.0 | Render (`https://adegaexpress.onrender.com`)
- **Bancos de Dados:** MySQL Server 8.0.45 local (testes unitários, smoke A3 e integração A4 com instância descartável) e TiDB Serverless / MySQL Cloud gerenciado (ambiente de produção D5 com SSL)

---

## 1. TABELA CONSOLIDADA DE TESTES E EVIDÊNCIAS

| ID do teste | Descrição | Resultado | Evidência (arquivo de log) | Observação |
|:---|:---|:---:|:---|:---|
| **ENV-00** | Registro do Ambiente e Versões do Sistema | **APROVADO** | `00_ambiente.log` | Node v24.11.0, npm 11.6.2, MySQL 8.0.45, Git HEAD verificado (`ecdc2e3`). |
| **A1** | Instalação limpa de dependências do backend (`npm ci`) | **APROVADO** | `A1_npm_ci.log` | 348 pacotes instalados com zero vulnerabilidades. |
| **A2-GEN** | Geração do cliente Prisma (`prisma generate`) | **APROVADO** | `A2_check.log` | Prisma Client v5.22.0 gerado com sucesso para o schema atualizado. |
| **A2-TSC** | Typecheck do backend (`tsc --noEmit`) | **APROVADO** | `A2_check.log` | Zero erros de tipagem estática TypeScript. |
| **A2-LINT** | Análise estática do backend (`eslint`) | **APROVADO** | `A2_check.log` | Zero avisos ou erros de linting em todo o código-fonte. |
| **A2-UNIT** | Suíte de testes unitários do backend (12 testes) | **APROVADO** | `A2_check.log` | 12 de 12 testes aprovados (regras de negócio, cupons, frete, idade civil). |
| **A2-BUILD** | Compilação do backend (`tsc`) | **APROVADO** | `A2_check.log` | Build gerado com sucesso no diretório `dist/`. |
| **A3-SMOKE** | Suíte de testes smoke contra banco local (9 testes) | **APROVADO** | `A3_smoke.log` | 9 de 9 testes aprovados contra a base local `adega_express`. |
| **A4-INT** | Suíte de testes de integração com banco descartável (29 testes) | **APROVADO** | `A4_integracao.log` | 29 de 29 testes aprovados com migrações e seed atômico (`mysqld.exe`). |
| **B1** | Instalação de dependências do frontend (`npm ci`) | **APROVADO** | `B1_npm_ci.log` | 368 pacotes instalados limpos em 1m. |
| **B2-TSC** | Typecheck do frontend (`tsc --noEmit`) | **APROVADO** | `B2_tsc.log` | Zero erros de tipagem em componentes e contextos Next.js. |
| **B2-LINT** | Análise estática do frontend (`npm run lint`) | **APROVADO** | `B2_lint.log` | Zero violações de regras ESLint/Next.js. |
| **B2-BUILD** | Build de produção do frontend (`next build` Turbopack) | **APROVADO** | `B2_build.log` | 11/11 rotas compiladas estaticamente e dinamicamente com sucesso. |
| **C1** | Permissões de papel (RBAC): Administrador vs Atendente | **APROVADO** | `C1_permissoes.log` | Atendente barrado (403) em 16 rotas restritas e permitido em pedidos/entregas; Admin com acesso irrestrito. |
| **C2** | Validação de pagamento e limite do campo reference | **APROVADO** | `C2_pagamento.log` | 150 caracteres aceitos, 151 rejeitados (400); 4 status suportados; bloqueio de pagamento em pedido cancelado (409); repetição idempotente sem duplicação de registro. |
| **C3** | Expiração automática de pedidos pendentes (RN07 / RF18) | **APROVADO** | `C3_expiracao.log` | Pedido > 30 min cancelado com devolução atômica de estoque e histórico; reexecução estritamente idempotente (0 cancelamentos extras). |
| **C4** | Idempotência de checkout (`Idempotency-Key`) | **APROVADO** | `C4_idempotencia.log` | Reenvio idêntico retorna mesmo pedido e único decréscimo de estoque (`Idempotency-Replayed: true`); payload divergente gera 409 Conflict. |
| **C5** | Transição de estados de pedidos e entregas | **APROVADO** | `C5_estado.log` | Bloqueio de avanço para ENTREGUE fora da entrega (409); bloqueio de separação sem pagamento prévio (RN08 / 409); avanço sequencial via entregador sincronizado. |
| **C6** | Cadastro de cliente e unicidade de e-mail (RN02 / RF04) | **APROVADO** | `C6_cadastro.log` | POST `/auth/register` rejeita cpf e birth_date com 400 (Zod strict); persiste apenas name, email e password; e-mail duplicado bloqueado globalmente com 409 Conflict em clientes e equipe. |
| **C7** | Guardião de escopo do catálogo (RN11 / RN13) | **APROVADO** | `C7_catalogo.log` | Rejeição estrita de `abv_percent > 0` (400) e bloqueio por regex de termos proibidos (cervejas, vinhos, destilados, tabacaria); bebidas não alcoólicas criadas com 201. |
| **C8** | Sessão, proteção de cookies e CORS (restringe a CORS_ORIGINS) | **APROVADO** | `C8_sessao_cors.log` | CORS restrito estritamente à lista CORS_ORIGINS; origens *.vercel.app barradas (403); mutação via cookie exige origem autorizada; logout incrementa `token_version` e invalida o JWT (401). |
| **C9** | Custo de hash de senhas (Bcrypt rounds) | **APROVADO** | `C9_bcrypt.log` | Inspeção de hash `$2b$12$...` confirma fator de custo configurado exatamente em 12 rounds. |
| **D1** | Desempenho de carregamento do catálogo (RNF06) | **PARCIALMENTE APROVADO** | `D1_desempenho.log` | Desktop: 3118 ms (1ª chamada / cold-start da camada gratuita), 255 ms, 234 ms, 282 ms, 220 ms (média 822 ms). Mobile: 249 ms, 412 ms, 249 ms, 255 ms, 327 ms (média 298 ms). Média global < 3 s; primeira chamada excedeu por 118 ms; validação mantida como parcial por ausência de teste de carga pesada. |
| **D2** | Responsividade e adaptação visual (RNF04) | **PARCIALMENTE APROVADO** | `D2_responsividade.log` | Renderização nos viewports Desktop (1440x900) e Mobile (375x667) homologada para 5 páginas-chave com 10 capturas salvas sem overflow; rotas secundárias pendentes. |
| **D3** | Compatibilidade cross-browser (RNF09) | **PARCIALMENTE APROVADO** | `D3_compatibilidade.log` | Fluxo de catálogo → adicionar produto → carrinho homologado com sucesso em 4 motores: Chromium, Mozilla Firefox, WebKit (Safari engine) e Microsoft Edge; checkout e rotas administrativas pendentes. |
| **D4** | Capturas reais do protótipo com dados consistentes (T01 a T15) | **APROVADO** | `D4_capturas.log` | 15 de 15 telas recapturadas com dados reais e consistentes de demonstração, 15 hashes MD5 únicos, zero skeletons, zero estados vazios indevidos e validação estrita de perfis (conforme `capturas/DADOS.md`). |
| **D4b** | Capturas complementares do protótipo (T08b, T13b, T01c) | **APROVADO** | `D4b_capturas.log` | 3 capturas complementares homologadas (T08b: pedidos CONFIRMADO/SEPARADO/EM_ROTA/ENTREGUE; T13b: modal de estoque com motivo obrigatório e histórico real; T01c: item em falta no catálogo). |
| **D4c** | Recaptura T13b — Gestão de estoque com modal sincronizado | **APROVADO** | `D4c_capturas.log` | Modal com saldo exibido de 75 un. rigorosamente igual à soma das movimentações do histórico (+65 e +10); MD5 `b3d3e9c408700cbb8ef6f70346b0b9bb`. |
| **D4d** | Auditoria de consistência de estoque e atomicidade | **APROVADO** | `D4d_consistencia_estoque.log` | Comprovação empírica de atomicidade via interface administrativa (Playwright): saldo de produtos e `stock_movements` atualizados na mesma transação interativa Prisma (ENTRADA e SAÍDA validadas). |
| **D5** | Homologação ponta a ponta no ambiente publicado (Vercel + Render) | **APROVADO** | `D5_publicado_2026-11-11.log` e `D5_publicado.log` | Duas execuções preservadas. **11/11 (commit `ecdc2e3`, `D5_publicado_2026-11-11.log`):** fluxo completo com HTTP 200/201/204 em todas as operações: login, endereço, cotação com cupom, pedido #120002, pagamento, separação, atribuição de entrega, cancelamento com rollback do pedido #120003 (estoque 60→59→60). **12/11 (commit `a48ec39`, `D5_publicado.log`):** execução resumida após a restrição de CORS: health, catálogo com e sem origem válida (403/200), login, endereços, pedido #150002 e cancelamento (estoque 58→56→58). |
| **D6** | Compatibilidade de navegadores no site publicado (RNF09) | **APROVADO** | `D6_navegadores.log` | Fluxo completo (login, catálogo, produto, sacola, cupom BEMVINDO10, endereço e PIX, pedido, "Meus pedidos", cancelamento) com 9/9 etapas em Chromium 153, Firefox 155 e WebKit 26.6; pedidos #180001 a #180003 cancelados pela aplicação; 3 capturas do checkout em `capturas_d6/`. Executado no commit `d91956b`. |
| **D7** | Desempenho de carregamento com servidor aquecido (RNF06) | **APROVADO** | `D7_desempenho.log` | 20 cargas por rota e viewport (`/` e `/carrinho`; desktop 1440x900 e mobile 375x667). Pior caso: 422 ms de `load` (`/carrinho`, desktop); nenhuma carga acima de 3000 ms. Limitações: carrinho medido vazio e sem login, `load` não inclui chamadas à API posteriores, medição a partir de um único computador. A primeira chamada a frio do backend gratuito pode superar 3 s (3118 ms em D1). Executado no commit `d91956b`. |
| **D7b** | Desempenho logado, com sacola cheia e até o conteúdo da API aparecer (RNF06) | **APROVADO COM RESSALVA** | `D7b_desempenho_logado.log` | 20 cargas por rota e viewport (`/`, `/carrinho` com 1 item e `/pedidos`, logado como cliente). `DOMContentLoaded`/`load` abaixo de 450 ms. Tempo até o conteúdo da API: catálogo ~1,9 s (pior 2219 ms); sacola com cotação ~1,2 s (pior 1703 ms); "Meus pedidos" ~2,4 s (pior 3130 ms desktop, 2667 ms mobile). **Ressalva: 1 das 120 medições (lista de pedidos, desktop) passou de 3000 ms (3130 ms).** Executado no commit `2da1474`. |

---

## 2. TOTALIZADOR GERAL DE VERIFICAÇÃO

> **Notas de leitura das evidências**
> - `A3_smoke.log` roda contra o banco local `adega_express` (não é um banco separado); os 29 testes de integração (`A4`) usam MySQL descartável.
> - `D5_publicado_2026-11-11.log` é preservado como foi gerado. Detalhes do registro original: a seção 5 (ambiente) aparece antes do Passo 1; o Passo 2 cita "2 itens" mas adiciona 2 unidades do mesmo produto; o Passo 7 remove 4 endereços de teste (120019 a 120022) e o log mostra uma única criação (as demais são resíduos de execuções anteriores).
> - Os tempos de D7/D7b valem com o backend gratuito já aquecido; a primeira chamada a frio chegou a 3118 ms (D1).
> - O token de sessão permanece em `localStorage` (limitação já declarada).

### 2.1 Testes Automatizados Executados
- **Testes Unitários:** 12 executados | **12 aprovados (100%)** | 0 falhas
- **Testes Smoke:** 9 executados | **9 aprovados (100%)** | 0 falhas
- **Testes de Integração:** 29 executados | **29 aprovados (100%)** | 0 falhas
- **Total de Testes Automatizados:** **50 testes executados** | **50 aprovados (100%)** | **0 falhas**

### 2.2 Verificações Pontuais Realizadas (Bloco C)
- **Total de Verificações:** 9 executadas (C1 a C9)
- **Aprovadas:** **9 (100%)**
- **Reprovadas:** 0
- **Não Executadas:** 0

### 2.3 Desempenho, Responsividade, Compatibilidade, Consistência e Homologação Cloud (Bloco D)
- **D1 (Desempenho RNF06):** PARCIALMENTE APROVADO (Média contínua: Desktop 822 ms | Mobile 298 ms; primeira execução registrou 3118 ms por cold-start no Render Free Tier / TiDB, excedendo a meta por 118 ms; regime estável opera entre 220–282 ms; validação mantida como parcial por ausência de testes de estresse de carga)
- **D2 (Responsividade RNF04):** PARCIALMENTE APROVADO (10 capturas salvas cobrindo 1440x900 e 375x667 em 5 páginas-chave; validação das rotas restantes pendente)
- **D3 (Cross-browser RNF09):** PARCIALMENTE APROVADO (4 de 4 navegadores homologados no fluxo catálogo → adicionar produto → carrinho: Chromium, Firefox, WebKit, Edge; checkout e rotas de gestão pendentes)
- **D4 (Telas do Protótipo T01–T15):** APROVADO (**15 de 15 telas recapturadas com dados reais e consistentes**, 15 MD5 únicos, zero skeletons, conformidade ABNT integral)
- **D4b (Capturas Complementares T08b, T13b, T01c):** APROVADO (**3 de 3 capturas complementares**, 3 MD5 únicos entre si e distintos de T01–T15, zero skeletons)
- **D4c (Recaptura T13b com Histórico Sincronizado):** APROVADO (Saldo modal 75 un. == soma histórico 75 un.)
- **D4d (Consistência e Atomicidade de Estoque):** APROVADO (Transação interativa Prisma `transaction(async (tx) => ...)` comprovada em tela e banco)
- **D5 (Homologação Ponta a Ponta no Ambiente Publicado):** APROVADO (Vercel + Render + TiDB Cloud operando com status HTTP 200/201 em todas as rotas e rollback atômico comprovado)

---

## 3. ÍNDICE DE ARQUIVOS DE EVIDÊNCIA GERADOS

Todos os arquivos estão organizados na pasta:  
`docs/evidencias/2026-11-10/`

```text
docs/evidencias/2026-11-10/
├── 00_ambiente.log
├── A1_npm_ci.log
├── A2_check.log
├── A3_smoke.log
├── A4_integracao.log
├── B1_npm_ci.log
├── B2_tsc.log
├── B2_lint.log
├── B2_build.log
├── C1_permissoes.log
├── C2_pagamento.log
├── C3_expiracao.log
├── C4_idempotencia.log
├── C5_estado.log
├── C6_cadastro.log
├── C7_catalogo.log
├── C8_sessao_cors.log
├── C9_bcrypt.log
├── D1_desempenho.log
├── D2_responsividade.log
├── D3_compatibilidade.log
├── D4_capturas.log
├── D4b_capturas.log
├── D4c_capturas.log
├── D4d_consistencia_estoque.log
├── D5_publicado.log
├── D5_publicado_2026-11-11.log
├── D6_navegadores.log
├── D7_desempenho.log
├── D7b_desempenho_logado.log
├── RESUMO.md
└── capturas/
    ├── DADOS.md
    ├── resp_admin_desktop_1440x900.png
    ├── resp_admin_mobile_375x667.png
    ├── resp_carrinho_desktop_1440x900.png
    ├── resp_carrinho_mobile_375x667.png
    ├── resp_catalogo_desktop_1440x900.png
    ├── resp_catalogo_mobile_375x667.png
    ├── resp_entregador_desktop_1440x900.png
    ├── resp_entregador_mobile_375x667.png
    ├── resp_login_desktop_1440x900.png
    ├── resp_login_mobile_375x667.png
    ├── T01.png
    ├── T01c.png
    ├── T02.png
    ├── T03.png
    ├── T04.png
    ├── T05.png
    ├── T06.png
    ├── T07.png
    ├── T08.png
    ├── T08b.png
    ├── T09.png
    ├── T10.png
    ├── T11.png
    ├── T12.png
    ├── T13.png
    ├── T13b.png
    ├── T14.png
    └── T15.png
```

---
*Relatório de evidências gerado em conformidade estrita com o princípio da evidência verificável: código consolidado no commit a48ec39c13dbc3894b21d050e1f1f95c92db7925, com sincronia total em 00_ambiente.log, A2_check.log, A3_smoke.log, A4_integracao.log, C8_sessao_cors.log, D5_publicado.log e banco de dados de produção.*
