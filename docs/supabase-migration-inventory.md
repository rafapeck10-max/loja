# Inventário Supabase para migração Mobi

**Estado em 12/11/2026:** leitura remota bloqueada; nenhum schema ou dado remoto foi consultado ou alterado.

## Acesso e identificação do projeto

- `supabase/config.toml` contém a referência local `ehdxfbutcsqnunxlvval`. Ela ainda não foi confirmada como o projeto autorizado: a ferramenta conectada `supabase_list_projects` respondeu “tool not available to the model”.
- O executável `supabase` não está disponível nesta sessão. Portanto não foi possível usar `supabase --help`, listar migrations remotas ou confirmar se existe um ambiente local/de teste descartável.
- Nenhuma consulta remota foi realizada. Não há contagens atuais, dados pessoais ou valores individuais de custo neste relatório.

## Evidência local do repositório

- Migrations locais encontradas: `20260709224412_fd707e1f-7666-40da-bae4-577490add670.sql` e `20261110190000_add_product_bundle_ids.sql`.
- A primeira migration cria uma estrutura inicial enxuta de `public.produtos`, habilita RLS e libera leitura para `anon`/`authenticated`; ela não descreve todos os campos presentes nos tipos atuais.
- A segunda acrescenta `produtos.compre_junto_ids` como `text[]` com valor padrão vazio.
- `src/integrations/supabase/types.ts` inclui `compre_junto_ids`, mantém `produtos.fornecedor` textual e `scraped_products.supplier` textual, e não declara `fornecedor_id` nessas relações.
- A presença local da migration de “compre junto” não comprova sua aplicação remota. A diferença entre as migrations locais e os tipos atuais também não determina, sozinha, o schema remoto.

## Itens ainda sem verificação remota

- Correspondência entre a referência local e o projeto Supabase autorizado.
- Histórico remoto de migrations e situação de `compre_junto_ids`.
- Colunas, constraints, índices, RLS, policies, grants, RPCs e buckets.
- Existência e relações de `produto_preco_historico`, custos e variações.
- Contagens agregadas de `produtos`, `scraped_products` e nomes textuais de fornecedor.
- Disponibilidade de um banco local/teste descartável sem efeito em produção.

## Próximo passo seguro

Disponibilizar o conector Supabase para esta sessão ou a Supabase CLI oficial com acesso ao projeto de teste confirmado. Retomar com uma leitura somente, confirmar o projeto antes de consultar tabelas e registrar apenas schema e contagens agregadas. Não criar/aplicar DDL, gerar tipos nem preparar backfill até esse inventário e o ambiente de teste estarem confirmados.
