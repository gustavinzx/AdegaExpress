# Adega Express Backend

API do e-commerce B2C da Adega Express, projeto acadêmico baseado na Adega Cristal. Implementa catálogo, contas, endereços, pedidos, estoque, entregas, cupons, equipe e relatórios. O frontend fica em projeto separado.

A API registra PIX e cartão como formas de pagamento e permite **conferência manual** pela equipe. Ela **não cobra cartões, não gera PIX bancário e não executa estornos no banco**. A integração com um gateway é uma etapa futura; nunca informe dados de cartão nesta API.

## 1. Requisitos

- Node.js 20.19 ou superior; o projeto foi verificado com Node.js 24.
- MySQL 8.0, com um banco e usuário de desenvolvimento.
- Terminal aberto nesta pasta, `adega-express-backend`.
- Para testar sem navegador: Swagger em `/docs`, Postman ou os exemplos de `docs/api.http`.

Tecnologias: Express 4, TypeScript com modo estrito, Prisma 5, Zod, JWT e bcrypt. Dependências exatas ficam no `package-lock.json`. A inferência dos retornos do Prisma é preservada; o TypeScript verifica código, seeds e testes.

## 2. Instalar e preparar configuração

No PowerShell:

```powershell
cd "C:\Users\gsds0\Desktop\Adega Express\adega-express-backend"
npm ci
npm run setup
```

`setup` cria `.env` com segredo aleatório se o arquivo não existir. Se já existir, **preserva todo o conteúdo**. Use `.env.example` para conferir as opções novas.

Configure o `.env`:

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
ADMIN_EMAIL="seu-email@example.com"
ADMIN_PASSWORD="SUA_SENHA_FORTE"
```

Os nomes, cidade e frete acima são **exemplos**. Configure os dados da distribuidora. `SHIPPING_FEE` é taxa fixa em reais. `DELIVERY_CITIES` vazia não limita as cidades; omitir `DELIVERY_STATE` não limita a UF. A comparação de cidade ignora maiúsculas, mas mantém acentos. Não há cálculo por distância ou consulta automática de CEP.

Para gerar um segredo, execute o comando abaixo e copie o resultado para `JWT_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Se a senha do MySQL contiver `@`, `:`, `/`, `#` ou outros caracteres especiais, codifique-os para URL na `DATABASE_URL` (por exemplo, `@` vira `%40`). Nunca publique o `.env`; ele está no `.gitignore`.

## 3. Preparar MySQL

Se você já tem o banco com dados do projeto, mantenha-o e confira as credenciais. Não execute reset.

Para um ambiente novo, abra o MySQL Workbench com uma conta que tenha permissão e execute, substituindo a senha:

```sql
CREATE DATABASE IF NOT EXISTS adega_express
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'adega_app'@'localhost' IDENTIFIED BY 'SUA_SENHA_FORTE';
GRANT ALL PRIVILEGES ON adega_express.* TO 'adega_app'@'localhost';
```

Se o usuário já existir, use suas credenciais ou faça a gestão da senha pelo administrador do banco. O acesso acima serve ao ambiente de desenvolvimento e às migrations. Em produção, separe a credencial de migração da credencial de execução.

Gere o cliente Prisma e aplique as migrations existentes:

```powershell
npm run prisma:generate
npm run prisma:deploy
npm run seed
npm run seed:demo
npm run doctor
```

- `prisma:deploy` aplica migrations pendentes; não redefine o banco.
- `seed` cria somente o primeiro administrador com as variáveis `ADMIN_*`. Não promove contas existentes e não redefine senhas. Depois do primeiro administrador, novos membros são cadastrados pela API `/staff`.
- `seed:demo` é opcional e cria quatro produtos fictícios, incluindo um sem estoque. Repetir o comando não duplica os exemplos nem repõe estoque. É bloqueado em produção.
- `doctor` verifica Node, segredo JWT, conexão, migration nova e administrador ativo, sem imprimir credenciais.

Após criar o administrador, você pode retirar `ADMIN_PASSWORD` do `.env`. Anote a senha em local apropriado; ela será necessária para entrar.

**Estado encontrado nesta máquina:** o serviço MySQL estava ativo, mas as credenciais existentes retornaram `P1000`. A senha precisa ser corrigida no `.env` antes de usar o banco original. Os testes automatizados usam outro banco e não dependem dessa correção.

## 4. Executar

```powershell
npm run dev
```

Com `PORT=3001`:

- Saúde do processo: `http://localhost:3001/health`
- Conexão com banco: `http://localhost:3001/health/ready`
- Documentação interativa: `http://localhost:3001/docs`
- Contrato OpenAPI: `http://localhost:3001/openapi.json`

A inicialização falha com mensagem clara se não conseguir conectar ao MySQL. Para executar o compilado:

```powershell
npm run build
npm start
```

`Ctrl+C` encerra o servidor e desconecta o Prisma. O backend usa a porta 3001 por padrão para reservar a 3000 ao futuro frontend. Se seu `.env` antigo usar 3000, ele prevalece.

## 5. Demonstrar uma compra completa no Swagger

1. Abra `/docs` e execute `POST /auth/login` com o administrador criado pelo seed. Copie `data.token`. Em **Authorize**, informe somente o token.
2. Cadastre um atendente e um entregador em `POST /staff`. Os perfis são `ATENDENTE` e `ENTREGADOR`; informe nome, email, senha e data de nascimento. Anote o ID do entregador.
3. Cadastre categorias e produtos, ou use o catálogo de demonstração. `GET /products` retorna IDs e estoques.
4. Execute `POST /auth/register` para um cliente maior de idade. Troque o token em **Authorize** pelo token do cliente.
5. Cadastre o endereço em `POST /addresses`. Anote seu ID. Ele deve atender à cidade/UF configuradas.
6. Calcule o pedido em `POST /orders/quote`. Informe `address_id`, `payment_method` (`PIX` ou `CARTAO`) e `items` com `product_id` e `quantity`. Cupom é opcional. A cotação não reserva estoque.
7. Envie o mesmo corpo para `POST /orders`, com um cabeçalho `Idempotency-Key` exclusivo, por exemplo `compra-demonstracao-001`. O pedido nasce `PENDENTE`, o estoque é debitado e o pagamento permanece `PENDENTE`.
8. Entre como atendente ou administrador e troque o token. Use `PATCH /orders/{id}/status` para passar primeiro a `CONFIRMADO` e depois a `SEPARADO`. A segunda operação cria a entrega `AGUARDANDO`.
9. Consulte `GET /deliveries` e atribua o entregador com `PATCH /deliveries/{id}/assign`.
10. Entre como entregador. Consulte `GET /deliveries/me` e envie `SAIU_PARA_ENTREGA` em `PATCH /deliveries/{id}/status`. O pedido também passa a `EM_ROTA`.
11. Quando a equipe realmente conferir o recebimento, use o token do atendente em `PATCH /orders/{id}/payment`, com `status: "PAGO"` e `reference` descrevendo a conferência. No exercício, use uma referência claramente identificada como demonstração.
12. Com o token do entregador, marque a entrega `ENTREGUE`. O pedido acompanha a mudança. Sem pagamento confirmado, a conclusão é bloqueada.
13. Como cliente, consulte `GET /orders/me` e `GET /orders/{id}`. Como administrador, consulte `GET /reports/sales?from=2026-09-01&to=2026-09-30`, ajustando o período.

Use sempre IDs devolvidos pela API. **Endereço 1 não é uma regra do sistema.**

## 6. Regras importantes

- O cadastro público cria apenas `CLIENTE`. Somente administrador cadastra a equipe. Senhas têm mínimo de 8 caracteres e máximo de 72 bytes UTF-8.
- Maioridade é conferida no cadastro e novamente na compra, pela data civil em `America/Sao_Paulo`. A data é declarada pelo usuário; não há verificação documental de identidade.
- Clientes acessam somente os próprios endereços e pedidos. Entregadores consultam suas entregas; não têm acesso geral aos pedidos.
- A API valida tipos, campos inesperados, datas reais, enumerações, quantidades inteiras positivas, limites e precisão monetária.
- O total é calculado no servidor: subtotal menos desconto, mais frete. Valores monetários usam Decimal e arredondamento em centavos. Respostas do Prisma representam valores monetários como strings.
- O checkout usa transação serializável, baixa condicional de estoque e tentativas limitadas em conflitos. Produtos repetidos no corpo devem ser agrupados em um item.
- Com `Idempotency-Key`, repetir o mesmo corpo retorna o pedido original sem nova baixa (`200` e `Idempotency-Replayed: true`). Reutilizar a chave com outro conteúdo dá `409`. Sem a chave, cada envio pode criar um pedido distinto.
- Cupom inválido interrompe a compra com `400`; o cliente precisa remover ou corrigir o código. A vigência inclui o dia final em São Paulo. Desconto nunca torna o subtotal negativo e não desconta o frete.
- Editar produto não altera estoque diretamente. Use `/products/{id}/stock` com tipo, quantidade e motivo. Cada entrada/saída gera histórico.
- Pedidos guardam nome e preço dos itens, valores e endereço da compra. Endereços excluídos são arquivados; produtos excluídos são desativados.
- Cliente só cancela pedido `PENDENTE`. Administrador/atendente também cancelam `CONFIRMADO` e `SEPARADO`, sempre com motivo. A devolução do estoque ocorre uma única vez. Pedidos `EM_ROTA` e `ENTREGUE` não podem ser cancelados por esse fluxo.
- As etapas são `PENDENTE → CONFIRMADO → SEPARADO → EM_ROTA → ENTREGUE`. A ida para rota e a conclusão são feitas pela entrega atribuída, sem saltos ou retorno de etapas.
- Pedido pago e cancelado passa a `ESTORNO_PENDENTE`. A equipe registra `ESTORNADO` somente depois de efetuar/conferir o estorno fora da API. Nenhuma transação bancária é feita automaticamente.
- Reatribuição de entrega só ocorre em `AGUARDANDO`, com pedido `SEPARADO`. Entregador com entrega ativa não pode ser desativado.
- Logout e troca de senha invalidam todas as sessões do usuário. Desativação bloqueia tokens já emitidos. O perfil efetivo é consultado no banco a cada requisição autenticada.
- Relatório considera **pedidos criados no período**, com a situação de pagamento atual. Receita soma pedidos pagos não cancelados, inclui frete e não é um relatório contábil de recebimentos por data de pagamento. Estoque baixo mostra a situação atual e limita a lista a 100 produtos.

## 7. Contrato para o futuro frontend

Sucesso usa `{ "status": "success", "data": ... }`. Listagens paginadas preservam `data` como array e acrescentam `meta` com `page`, `limit`, `total` e `total_pages`. A página padrão é 1, o limite padrão é 20 e o máximo é 100. O frontend precisará implementar navegação entre páginas.

Erros usam `{ "status": "error", "statusCode": 400, "message": "...", "details": [...], "request_id": "..." }`; `details` existe em erros de validação. O cabeçalho `X-Request-Id` permite correlacionar uma resposta com o log. Limites de requisição têm resposta própria com `status` e `message`.

Na futura integração configure `NEXT_PUBLIC_API_URL=http://localhost:3001`. O frontend atual ainda usa endereço fixo e não tem todas as telas operacionais; essa etapa não foi alterada neste trabalho. Também será necessário trocar rótulos como “Total Pago” quando `payment_status` ainda for `PENDENTE`.

## 8. Verificar qualidade

```powershell
npm run check
npm run test:integration
npm audit
```

Ou execute tudo com `npm run check:all`.

`check` gera o Prisma Client, verifica tipos do código/seeds/testes, lint sem avisos, testes unitários e build. `format:check` verifica a formatação separadamente.

Os testes de integração iniciam um **MySQL separado**, em porta livre e diretório temporário. Aplicam as migrations antigas, inserem um pedido legado, aplicam a nova migration e verificam a preservação dos dados. Também executam os seeds duas vezes, exercitam as rotas HTTP e conferem se o banco corresponde ao schema Prisma. O servidor de teste é encerrado e apenas o diretório temporário criado pelo teste é removido.

No Windows, o executável padrão é `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe`. Para outro local, defina no terminal:

```powershell
$env:MYSQLD_BIN = 'C:\caminho\mysql\bin\mysqld.exe'
npm run test:integration
```

Como alternativa, defina `TEST_DATABASE_URL` no ambiente do terminal para um banco **vazio**, cujo nome comece com `adega_test_`. Esse banco será preenchido e preservado no fim. A execução recusa bancos não vazios e não apaga dados para repetir testes; crie outro banco vazio para outra execução. As variáveis `MYSQLD_BIN` e `TEST_DATABASE_URL` são lidas do ambiente do terminal, não do `.env` da aplicação.

## 9. Organização

- `src/routes/api.ts`: rotas, permissões, contratos e geração do OpenAPI.
- `src/schemas.ts`: validações de entrada compartilhadas com a documentação.
- `src/services/`: regras de autenticação, endereços, catálogo, pedidos, entregas e administração.
- `src/lib/`: erros, transações e regras reutilizáveis de datas, descontos e estados.
- `src/middlewares/`: autenticação, autorização e erros.
- `prisma/schema.prisma`: modelo de dados; `prisma/migrations`: evolução do banco.
- `tests/`: testes de regras e integração HTTP com MySQL.
- `scripts/`: configuração, diagnóstico e execução isolada dos testes.
- `docs/api.http`: exemplos de chamadas; `docs/DECISOES.md`: decisões e limites do backend.

Os antigos scripts `write_auth_files.py`, `write_delivery.py` e a pasta duplicada `adega-express-backend/prisma` são arquivos legados, fora do build. **Não execute esses geradores sobre o backend atualizado.** As migrations válidas ficam em `prisma/migrations`, diretamente nesta pasta.

## 10. Problemas comuns

- `P1000`: usuário/senha recusados. Corrija a URL; confirme também a codificação da senha.
- `P1001`: MySQL não está acessível. Confira serviço `MySQL80`, host e porta.
- `P1003`: banco ainda não foi criado.
- `P2021` ou coluna inexistente: aplique `npm run prisma:deploy` e gere o cliente Prisma.
- `Configuração inválida: JWT_SECRET`: gere um segredo aleatório real, sem o texto de exemplo.
- `EADDRINUSE`: mude `PORT` ou encerre o processo que já utiliza a porta.
- `403 Origem não permitida`: inclua a origem exata do frontend em `CORS_ORIGINS`, separando múltiplas origens por vírgula.
- `401` após atualização: faça login novamente; tokens antigos não possuem a versão de sessão.
- `409` no checkout: estoque insuficiente, chave reutilizada com outro corpo ou conflito concorrente. Corrija a causa e repita a requisição com a mesma chave somente quando estiver repetindo a mesma compra.
- `429`: aguarde a janela indicada no cabeçalho `Retry-After`.

## 11. Etapas futuras

Integração real com gateway (webhooks autenticados, conciliação e estornos), recuperação de senha por email, confirmação documental quando definida pelo negócio, cálculo de frete por região/distância, notificações, devoluções após entrega e telas do frontend ainda não foram implementados. Em produção também serão necessários HTTPS, backups, monitoramento e armazenamento compartilhado dos limites de requisição caso haja várias instâncias.

Referências técnicas: [Express](https://expressjs.com/en/advanced/best-practice-security/), [Prisma Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) e [Zod](https://zod.dev/api).
