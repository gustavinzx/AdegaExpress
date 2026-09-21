# Decisões do backend Adega Express

## Escopo desta etapa

Foi mantida a base Node.js, Express, TypeScript, Prisma e MySQL. O trabalho concentra as regras no backend e conserva o envelope `status/data` usado pelo frontend existente. As rotas estão agrupadas em um registro que também gera o OpenAPI, reduzindo diferenças entre documentação e implementação. Serviços implementam regras; schemas validam entradas; o middleware traduz erros de forma uniforme.

## Compra e estoque

A cotação não reserva mercadoria. A criação do pedido calcula tudo novamente, valida o proprietário do endereço e a maioridade e executa a baixa em transação. A condição `stock_quantity >= quantidade` na atualização impede saldo negativo. Transações serializáveis são repetidas no máximo três vezes após a tentativa inicial em conflitos reconhecidos pelo Prisma. Os itens são processados em ordem de ID para reduzir deadlocks.

Pedidos `PENDENTE` já consomem estoque. Não existe expiração automática; a equipe precisa cancelar pedidos abandonados. Essa decisão mantém a regra descrita no UC01 atual. Antes de disponibilizar a loja publicamente, deve-se definir uma política de expiração e eventual tarefa agendada.

O cabeçalho `Idempotency-Key` é opcional para compatibilidade, mas deve ser enviado pelo próximo frontend. A chave é única por cliente, com hash dos dados normalizados. O banco garante que uma repetição concorrente não gere outra compra. Não há serviço externo dentro da transação.

Alterações manuais de estoque têm quantidade, tipo, motivo e responsável. A API de edição do produto rejeita `stock_quantity`: correções de saldo devem ser expressas como movimentações. A auditoria começa na nova versão; não foram inventadas movimentações anteriores à migração.

## Histórico e migração

O pedido guarda subtotal, desconto, frete, endereço e nome/preço de cada item. Mudanças posteriores no catálogo ou no endereço não alteram esses campos. A tabela de endereços usa arquivamento para não quebrar relacionamentos. A tabela de produtos mantém desativação lógica.

A migration nova adiciona campos e tabelas; não apaga dados. Nos pedidos legados, utiliza o endereço e o nome do produto disponíveis na data da migração. Não é possível reconstruir alterações históricas feitas antes dela. O subtotal é reconstruído a partir dos itens e o desconto é a diferença não negativa para o total registrado. Não é inferido pagamento confirmado nem criada uma autoria fictícia para mudanças antigas de status.

## Estados e entregas

O pedido avança de `PENDENTE` para `CONFIRMADO`, depois `SEPARADO`. Ao separar, nasce uma entrega `AGUARDANDO`, inicialmente sem entregador. O atendente ou administrador atribui um entregador ativo.

Somente esse entregador pode passar a `SAIU_PARA_ENTREGA`, que sincroniza o pedido para `EM_ROTA`, e depois a `ENTREGUE`, que sincroniza a conclusão. Etapas não podem ser puladas ou desfeitas. Repetir a mesma etapa é inofensivo. O registro de histórico indica o usuário que fez cada alteração.

Cancelamento é permitido antes de sair para entrega. O cliente pode cancelar apenas o próprio pedido pendente; a equipe também pode cancelar confirmado ou separado. O estoque é devolvido uma única vez na mesma transação. Entregas de pedidos cancelados permanecem como histórico, não aparecem na fila e não podem ser movimentadas.

## Pagamentos

`payment_method` representa a opção do cliente; `payment_status` representa a conferência do recebimento. São conceitos distintos. A confirmação não depende simplesmente de criar o pedido ou mudar o status operacional.

Nesta versão, PIX e cartão são recebidos fora da API e conferidos por administrador/atendente. Uma referência e o ID do responsável ficam em `payment_records`. A equipe pode consultar o histórico de conferências na rota de pagamentos do pedido. Entrega concluída exige pagamento marcado como `PAGO`. Essa é uma regra operacional assumida para esta implementação e pode ser ajustada se a distribuidora trabalhar com crédito ou outro fluxo.

Cancelar pedido já pago gera `ESTORNO_PENDENTE`. Depois de devolver o dinheiro fora do sistema, a equipe registra `ESTORNADO`. A operação não comunica com bancos ou adquirentes. Para um gateway futuro, essa conferência precisará ser conectada a eventos autenticados e idempotentes do provedor.

## Autenticação e proteção

Senha é armazenada com bcrypt; o JWT tem algoritmo fixo e expiração configurável. Cada usuário possui versão de sessão. Logout, troca de senha e desativação revogam tokens anteriores. O perfil e o estado ativo são consultados no banco em cada requisição protegida.

O cadastro público não aceita perfil arbitrário. As validações são estritas, inclusive para campos extras, datas inválidas, valores negativos, quantidade fracionária e IDs. Erros internos não devolvem SQL, senha ou detalhes do Prisma. Logs registram método, caminho, status, duração e ID da requisição, sem corpo, token, email ou endereço.

CORS restringe origens do navegador. Autorização continua sendo exigida independentemente do CORS. Helmet adiciona cabeçalhos e há limites de tamanho de JSON e frequência de requisições. O limitador usa memória local, adequado para uma instância; múltiplas instâncias exigem armazenamento compartilhado. A aplicação não armazena números de cartão.

## Relatórios e frete

Frete usa uma taxa fixa configurada e, opcionalmente, uma lista de cidades e UF atendidas. Não se apresenta como cálculo por CEP, distância, mapa ou otimização de rota.

O relatório agrupa pedidos criados no período escolhido e considera o pagamento atual. Receita é o total de pedidos pagos não cancelados, incluindo frete. Não é fluxo de caixa por data de recebimento, nem substitui contabilidade. Datas são interpretadas no fuso de São Paulo. Períodos de consulta são limitados a 366 dias.

## Alinhamento com o Documento de Visão

- UC01: verificação de idade agora também ocorre na compra; estoque é debitado ao criar o pedido pendente.
- Cupom inválido: a implementação bloqueia a compra e solicita correção/remoção, em vez de continuar silenciosamente sem desconto. O texto do fluxo de exceção deve refletir essa decisão.
- UC03: saída para entrega agora sincroniza `EM_ROTA`. A conclusão exige pagamento conferido e o pedido precisa ter seguido as etapas.
- No UC03, `SEPARADO` é condição para iniciar a entrega; na conclusão, o pedido já está `EM_ROTA`. A pré-condição do documento precisa distinguir essas etapas.
- Os três valores de `DeliveryStatus` foram preservados: `AGUARDANDO`, `SAIU_PARA_ENTREGA`, `ENTREGUE`.
- Cobrança via gateway, ajuda on-line e manuais para cada perfil ainda são promessas do produto, não funcionalidades concluídas nesta entrega de backend.

O Word original não foi alterado. Essas decisões estão registradas para orientar uma revisão posterior da documentação acadêmica.
