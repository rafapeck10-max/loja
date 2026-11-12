# Inventário Supabase para migração Mobi

**Estado em 12/11/2026:** inventário remoto somente de leitura concluído para o projeto Mobi identificado abaixo. Nenhuma migration, gravação no banco ou publicação foi executada.

## Identificação do destino

- Projeto aberto e confirmado no painel: `mobi-loja`, ref `xzgafeqifikqrxrjaueb`, região São Paulo (`sa-east-1`), plano Nano.
- A referência coincide com `docs/supabase-catalog-access.md` e com o projeto Mobi aberto na sessão do usuário.
- Divergência encontrada e corrigida apenas localmente: `supabase/config.toml` apontava para `ehdxfbutcsqnunxlvval`, que não apareceu na organização listada. O registro de entrega Mobi, `docs/supabase-catalog-access.md` e o painel autenticado confirmaram `xzgafeqifikqrxrjaueb`; a configuração local agora usa essa ref. Nenhum comando de migration foi executado.
- A ferramenta Supabase MCP e a CLI não estavam disponíveis; o inventário foi feito no dashboard autenticado e por consultas `SELECT` de metadados/agregados. Nenhum valor de custo, nome de fornecedor, chave ou segredo foi exportado.
- O projeto não mostrava branches nem backups. Não há destino de teste descartável confirmado.

## Histórico de migrations no painel

As dez entradas visíveis no painel, da mais recente para a mais antiga:

| Versão | Nome |
|---|---|
| `20260927130438` | `homepage_curation` |
| `20260916034805` | `protect_product_prices_with_minimum_margin_v2` |
| `20260915185623` | `add_original_product_name` |
| `20260912221413` | `add_catalog_supplier_link_and_sales_fields` |
| `20260911154025` | `add_product_price_variations_alerts` |
| `20260909135202` | `add_recargapay_installment_settings` |
| `20260909134236` | `add_parcelas_sem_juros` |
| `20260816123001` | `add_tropical_product_metadata` |
| `20260816105626` | `add_catalog_details_and_pricing` |
| `20260816095850` | `create_mobi_catalog_products` |

A pasta local contém `20260709224412_fd707e1f-7666-40da-bae4-577490add670.sql` e `20261110190000_add_product_bundle_ids.sql`; nenhum desses IDs consta na lista exibida. Isso indica divergência de histórico e requer reconciliação, sem inferir que a estrutura remota não exista por outros meios.

## Tabelas e contagens observadas

| Tabela | Colunas | Linhas no painel / consulta |
|---|---:|---:|
| `configuracoes` | 3 | 1 |
| `homepage_banners` | 9 | 3 |
| `produto_preco_historico` | 7 | 1.510 |
| `produtos` | 34 | 2.233 |
| `scraped_products` | 23 | 402 |

O SQL agregado de leitura encontrou em `produtos`: 3 nomes de fornecedor distintos, 1 registro sem fornecedor, 1 sem `preco_atacado` e nenhum sem `preco_atual`. Em `scraped_products`: 2 fornecedores distintos e nenhum registro sem `supplier` ou `supplier_price`. Foram contados 13 produtos com `variacoes_preco`, 291 importações com `price_variations` e 1.510 linhas no histórico. Os nomes e valores comerciais foram omitidos.

## Schema remoto confirmado

- `configuracoes`: `id`, `parcelamento_taxas`, `updated_at`.
- `homepage_banners`: `position`, `image_url`, `eyebrow`, `title`, `subtitle`, `cta_label`, `cta_href`, `active`, `updated_at`.
- `produto_preco_historico`: `id`, `produto_id`, `preco_fornecedor`, `preco_venda`, `margem`, `registrado_em`, `origem`.
- `produtos`: inclui catálogo, preços, fornecedor textual, custo, fontes, variantes, histórico de verificação, margem mínima, campos de vitrine e estoque. Continua sem `fornecedor_id` e sem `compre_junto_ids`.
- `scraped_products`: inclui `supplier` textual, `supplier_price`, `price_variations`, `source_url`, `product_id` e metadados de importação. Continua sem `fornecedor_id`.

Constraints e índices observados:

- `configuracoes`: chave primária; índice da chave primária.
- `homepage_banners`: chave primária e checks para posição, título e URL da imagem; índice da chave primária.
- `produto_preco_historico`: chave primária, chave estrangeira `produto_id` e índice por produto.
- `produtos`: chave primária, slug único, checks de custo/status/parcelamento/vitrine, índice de estoque e índice único da ordem semanal.
- `scraped_products`: chave primária, unicidade `scraped_products_supplier_name_key`, checks de status de importação/estoque e índices para execução de catálogo e status/data.

Logo, a migration local `20261110190000_add_product_bundle_ids.sql` não está refletida no schema remoto observado. A proposta de relacionar fornecedores por UUID também não foi aplicada.

## RLS, policies e privilégios

O painel mostrou RLS habilitado nas cinco tabelas:

- `configuracoes`: policy `Configurações públicas podem ser lidas`, `SELECT` para `anon` e `authenticated`.
- `produtos`: policy `Permitir leitura publica`, `SELECT` para `anon` e `authenticated`.
- `homepage_banners`, `produto_preco_historico` e `scraped_products`: nenhuma policy cadastrada.
- A interface informa `API Disabled` para `homepage_banners`, `produtos` e `scraped_products`, com indicação de permissões customizadas da Data API.

A leitura de `information_schema.role_table_grants` apontou privilégios amplos de tabela para `anon`/`authenticated` em `configuracoes` e `produto_preco_historico`; em `produtos`, esses papéis têm `SELECT`. `homepage_banners` e `scraped_products` mostraram privilégios de tabela apenas para `service_role`. Embora RLS esteja ativo e as policies observadas não liberem escritas públicas, os privilégios amplos em `configuracoes` e no histórico devem ser revisados e reduzidos em uma etapa segura, sem alterar as regras comerciais de parcelamento.

## Funções, triggers e arquivos

- Funções observadas: `save_homepage_curation(p_weekly_ids text[], p_home_settings jsonb)` (invoker), `registrar_historico_preco_produto` (trigger, definer) e `validar_preco_produto` (trigger, definer).
- Triggers em `produtos`: `trg_historico_preco_produto` após insert/update e `trg_validar_preco_produto` antes insert/update.
- A página de Storage exibiu o estado vazio para buckets; nenhum bucket de arquivo foi listado.

## Vercel conferida em leitura

- O projeto `loja` está ligado ao repositório `rafapeck10-max/loja` e possui o domínio Vercel `lojamobilione.vercel.app`.
- O painel mostra deploys de produção associados à branch `main` e previews de outras branches. O branch local `feature/mm-p07-product-page` não foi encontrado nos previews visíveis.
- Há variáveis de ambiente com nomes `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL` e chaves publicáveis nos ambientes Production e Preview. Os valores não foram abertos. Portanto, não foi possível confirmar que Vercel aponta para a mesma ref do dashboard.
- Nenhum deploy foi disparado; produção não foi promovida.

## Preparação local e pendências

O contrato de transporte administrativo e o resolvedor de fornecedores por nome exato foram preparados localmente e testados na branch `feature/mm-p07-product-page`, sem adaptador remoto ativo. As migrations de estado versionado do painel e de IDs de fornecedor não foram geradas/aplicadas.

Antes de DDL ou backfill, ainda é necessário:

1. Confirmar que o valor de Supabase usado pela Vercel corresponde à ref `xzgafeqifikqrxrjaueb`; os nomes das variáveis foram vistos, mas seus valores não foram abertos.
2. Obter ambiente descartável de teste e backup verificável; o projeto aberto não mostrava branches nem backups.
3. Reconciliar o histórico remoto com as duas migrations locais e avaliar a migration de `compre_junto_ids` antes de qualquer execução.
4. Revisar grants e policies, autenticação administrativa, projeção pública e funções/transações com base no schema confirmado.
5. Gerar migration com a CLI oficial, testar reversão e conflitos no ambiente de teste; preservar os campos textuais de fornecedor e os valores de preço durante o backfill.
6. Apresentar a versão e a prévia exatas para aprovação antes de qualquer mudança em produção ou promoção da Vercel.

**Resultado:** a leitura do projeto documentado foi concluída e o vínculo local foi alinhado, mas o banco ainda não está pronto para migração. A falta de ambiente de teste/backup e a divergência de migrations são bloqueios explícitos. A preparação local permanece separada da integração remota implementada; nenhum dado publicado foi alterado.
