# PM-04 — Fornecedores e precificação: preparo para migração

**Estado:** preparação local; nenhuma migration ou gravação no Supabase foi executada.  
**Revisado em:** 11/11/2026.  
**Objetivo:** organizar a revisão de preços por fornecedor e definir uma transição segura do catálogo atual para fornecedores com IDs estáveis.

## Entendimento confirmado

| Item | Estado atual observado | Consequência |
|---|---|---|
| Catálogo | `produtos.fornecedor` guarda texto; `preco_atacado` guarda o custo informado; `preco_atual` é o preço do site. | Fornecedor não é uma entidade relacionada por ID. |
| Origem do custo | `url_fornecedor` e `fonte_preco` guardam fontes em campos existentes. | Preservar as duas origens até verificar seu uso e não inferir fornecedor pelo domínio. |
| Importação | `scraped_products` usa `supplier`, `supplier_price` e `source_url`; `price_variations` pode conter custos por variação. | A migração precisa manter a origem em análise e ligar a importação à mesma entidade de fornecedor. |
| Preços e histórico | O tipo local representa preços como números decimais; o painel e o storefront usam esses campos. O dashboard Supabase mostrou uma tabela `produto_preco_historico`, ausente dos tipos locais consultados. | Não converter nem descartar valores nesta etapa; inventariar histórico, importadores, variantes e cálculo de parcelas antes de um corte para centavos inteiros. |
| API pública | Os mapeadores públicos removem fornecedor e custo. | Manter custo e identidade do fornecedor somente no servidor e no painel administrativo. |
| Painel | `/admin` filtrava por texto e mostrava uma diferença simples entre custo e preço público. | O filtro agora permite selecionar grupos reais do catálogo; a diferença é rotulada como bruta, sem afirmar lucro líquido. |

O painel Supabase foi inspecionado apenas em leitura nesta tarefa; a visão da tabela `produtos` mostrava 2.233 registros. Esse total é uma observação da sessão, não um número fixado em código. Nenhuma consulta de escrita foi feita.

## A divisão no painel

Em **Administração → Produtos**, a área **Precificação por fornecedor** agrupa pelos nomes atualmente cadastrados e mostra:

- quantidade de produtos do grupo;
- produtos sem custo informado;
- produtos sem preço no site;
- produtos cujo preço no site está abaixo do custo registrado.

Selecionar um grupo filtra a lista; **Todos os fornecedores** mostra os grupos separados. Produtos sem nome ficam em **Sem fornecedor cadastrado** e não recebem fornecedor automático baseado em link, importador ou categoria. Os valores podem se sobrepor entre pendências; são contagens por tipo de problema.

O editor permite informar um nome novo ou selecionar um nome já usado. A diferença de preço é `preço no site − custo informado`; ela não subtrai taxas, frete, impostos ou outros custos e, por isso, não é margem nem lucro líquido. O campo de fornecedor continua interno. A mudança de interface não grava dados por conta própria; salvar no editor existente continua sendo uma ação administrativa sobre o catálogo.

## Modelo de destino proposto — ainda não criado

1. Criar `fornecedores` com `id` UUID estável, nome, estado ativo e datas de criação/atualização.
2. Acrescentar `fornecedor_id` anulável em `produtos` e `scraped_products`, com chave estrangeira e índice.
3. Manter temporariamente `produtos.fornecedor` e `scraped_products.supplier` para compatibilidade e reconciliação. Só retirar esses campos em outra etapa, depois de comprovar leitura, escrita e importação por ID.
4. Fazer correspondência apenas por nome de origem exato e revisado. Diferenças de caixa, acento, abreviação ou grafia não devem ser fundidas automaticamente. Nome sem correspondência confirmada permanece pendente, sem atribuição inventada.
5. Preservar custo, preço de venda, URLs de origem, variantes e histórico sem os copiar para uma nova fonte concorrente. Mudança para centavos inteiros deve ser uma migração comercial/dados separada, com arredondamentos explicitamente revisados.

### Etapas antes de qualquer migração

1. Exportar uma fotografia somente leitura de nomes distintos, contagens, campos vazios, custos, fontes, variantes e histórico.
2. Revisar uma tabela de correspondência de nomes com Rafael; registrar separadamente duplicidades prováveis e nomes ainda sem confirmação.
3. Aprovar o esquema final, RLS e estratégia de rollback; confirmar o projeto Supabase alvo e que não houve alteração concorrente.
4. Gerar a migration pela CLI oficial, revisar o SQL e os tipos gerados; aplicá-la primeiro em ambiente de teste.
5. Fazer backfill sem apagar campos textuais, conferir contagens/IDs/preços e testar leitura e escrita do painel e importação.
6. Ativar a leitura por ID, observar discrepâncias e só depois propor a remoção dos campos antigos em uma migration separada.

## Segurança e regras de preço

- Custos, links de fornecedor e IDs internos não podem sair pelas APIs públicas nem ficar expostos no bundle do navegador.
- Escritas administrativas permanecem no servidor autenticado e protegidas por políticas do banco; uma nova tabela não pode herdar leitura pública irrestrita.
- Antes/depois de preço e parcela devem preservar a regra comercial Mobi vigente, inclusive comparação exata do valor em 10x quando preço ou pagamento forem alterados.
- Não importar taxas, estoque, prazos ou condições da MadeiraMadeira. A engenharia reversa identifica `MM-CMS-03` como uma proposta de controle de preços adaptada para a Mobi, não como evidência de um painel interno da concorrente.
- Rascunho e prévia continuam distintos do catálogo publicado. A publicação só acontece após aprovação explícita da versão apresentada.

## O que ainda falta

- Entidade relacional de fornecedor e chaves estrangeiras.
- Inventário completo de aliases e aprovação de equivalências.
- Tipos locais sincronizados com o schema atual, inclusive histórico de preços.
- Decisão e plano separados para armazenamento interno em centavos, preservando valores e parcelas existentes.
- RLS testada, ambiente de teste, migration gerada/revisada e plano de reversão.
- Integração da UI com IDs depois do backfill; hoje a UI usa texto para permanecer compatível com o banco atual.

## Matriz de conferência

| Requisito | Fonte | Arquivo/estado nesta etapa | Evidência ou pendência |
|---|---|---|---|
| Preservar produto e importação existentes | Painel PM-04 | `src/routes/admin.tsx`, `src/lib/admin.functions.ts` | Campos existentes continuam em uso; nenhuma gravação nesta etapa. |
| Fornecedor interno não vira vendedor público | Painel PM-04; engenharia reversa `MM-PROD-03` | `src/lib/products.functions.ts` | Mapeadores públicos mantêm fornecedor/custo ocultos. |
| Organizar custo, preço e pendências por fornecedor | Painel PM-04/PM-05; adaptação `MM-CMS-03` | `/admin` | Grupos e filtros calculados sobre registros carregados, sem cadastrar uma tabela nova. |
| Preço não deve sugerir lucro líquido | Especificação de preços Mobi | `/admin` e este documento | Diferença chamada de bruta, com aviso de custos ainda não descontados. |
| Migração por IDs sem apagar origem antecipadamente | Esquema atual inferido dos tipos e importador | Este plano | Proposta, ainda não aplicada; mapear nomes exatos e manter campos legados durante transição. |
| RLS, ambiente e reversão | Regras de integração do painel e Supabase | Pendente | Precisam ser revisados antes da primeira migration. |
