# Fornecedores Mobi — IDs estáveis e backfill Implementation Plan

> **For agentic workers:** use `superpowers:executing-plans` for native execution. This plan may run after or alongside the panel plan only after the same read-only schema inventory is approved; no production write is included.

**Goal:** Introduzir IDs estáveis de fornecedores no catálogo e na importação, mantendo nomes/custos/fontes legados até que cada correspondência seja revisada.

**Architecture:** Criar a entidade `fornecedores` e relações opcionais em `produtos` e `scraped_products`; resolver nomes somente por correspondência exata aprovada; atualizar painel/importação para usar IDs mantendo os campos textuais durante a transição. O catálogo, custos, variantes e histórico permanecem nas tabelas atuais.

**Tech Stack:** TypeScript, Supabase/PostgreSQL, Supabase CLI, React, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-12-mobi-migration-readiness-design.md`; baseline adicional: `docs/PM04_FORNECEDORES_PRECIFICACAO_PREPARO_MIGRACAO.md`.

## Global Constraints

- Usar o inventário `docs/supabase-migration-inventory.md` do plano de persistência; o destino confirmado é `mobi-loja` (`xzgafeqifikqrxrjaueb`). Não fazer escrita até existir ambiente de teste descartável e backup verificável.
- Não fazer backfill em produção nesta execução; aplicar schema/backfill apenas em banco local descartável ou ambiente de teste confirmado.
- Não remover `produtos.fornecedor` nem `scraped_products.supplier` nesta migração.
- Não fundir diferenças de caixa, acento, abreviação, domínio ou nome parecido; casos sem aprovação ficam com `fornecedor_id = null` e em revisão.
- Manter custos, fontes, `variacoes_preco`, `price_variations` e `produto_preco_historico` sem conversão nem cópia concorrente.
- Fornecedor e custos ficam somente no painel/servidor; APIs e cartões públicos não recebem esses campos.
- Preservar preço à vista e o valor exato em 10x; nenhuma regra comercial ou preço é alterado.
- Gerar migration e tipos pela ferramenta oficial Supabase; não editar arquivo gerado manualmente.

## Review Focus

- Nome vazio ou desconhecido importado → não atribuir fornecedor por heurística; armazenar texto e ID nulo; cobrir `supplier-identity.test.mjs`.
- Dois nomes diferindo apenas por caixa/acento → não fundir sem confirmação; cobrir a mesma suíte.
- ID de fornecedor inexistente/desativado enviado pelo browser → rejeitar antes da escrita; cobrir `supplier-admin-functions.test.mjs`.
- Atualização de produto por ID → manter valor textual, custo, fonte e preço existentes, exceto os campos explicitamente editados; cobrir `supplier-admin-functions.test.mjs`.
- Projeção pública recebe produto com fornecedor/custo → manter esses campos fora da resposta pública; cobrir o teste de serialização pública.

---

## Arquivos e limites

- `docs/supabase-migration-inventory.md`: resultado compartilhado do inventário remoto somente leitura.
- `docs/supplier-name-map.csv` **(rascunho de revisão, sem backfill)**: nome original exato, contagem e estado de revisão; não contém UUID gerado, preço ou custo.
- `supabase/migrations/<timestamp>_supplier_ids.sql` **(gerado pela CLI)**: tabela e chaves anuláveis/índices, RLS/grants.
- `supabase/migrations/<timestamp>_backfill_supplier_ids.sql` **(gerado pela CLI após revisão do mapa)**: backfill idempotente usando nomes aprovados; UUIDs gerados no banco, sem IDs fixados no SQL.
- `src/lib/supplier-identities.ts` **(novo)**: validação de ID/nome e resolução exata de nomes aprovados.
- `src/lib/admin.functions.ts`: funções de listar/criar fornecedores, upsert de produto e importação de coletas.
- `src/integrations/supabase/types.ts`: tipos gerados oficialmente após migration de teste.
- `src/routes/admin.tsx`, `src/components/admin/SupplierPricingPanel.tsx`: edição, seleção, agrupamento e pendências por ID.
- `src/lib/products.functions.ts`: manter mapeadores e DTOs públicos sem dados internos.
- Testes novos: `tests/supplier-identity.test.mjs`, `tests/supplier-admin-functions.test.mjs`, `tests/supplier-pricing-panel.test.mjs`.

## Task 1: Preparar mapa de nomes por consulta agregada

**Files:** Read `docs/supabase-migration-inventory.md`; create `docs/supplier-name-map.csv` sem IDs aplicados.

- [ ] Consultar apenas `DISTINCT fornecedor`, `DISTINCT supplier` e contagens por texto exato no ambiente de teste/cópia; não exportar produtos, preços, custos ou dados pessoais.
- [ ] Incluir nomes vazios e contagem de registros sem fornecedor; não inferir nomes a partir de URL ou domínio.
- [ ] Marcar textos com diferenças de caixa/acento/espaço como grupos separados, para revisão humana.
- [ ] Confirmar se `produto_preco_historico`, variantes de produto e coletas possuem relação por fornecedor ou somente texto.
- [ ] Parar antes de atribuir UUID quando o mapa não estiver explicitamente revisado por Rafael; não usar amostra histórica de 2.233 como total atual.

**Verification:** somas por nome + nulos correspondem ao total consultado; relatório contém somente texto de fornecedor e contagem; nenhum dado foi alterado.

## Task 2: Implementar resolução exata em código e regressões

**Files:** Create `src/lib/supplier-identities.ts`, `tests/supplier-identity.test.mjs`.

**Interfaces:**

```ts
export interface SupplierIdentity {
  id: string;
  name: string;
  active: boolean;
}
export type SupplierResolution =
  | { status: "matched"; supplierId: string; canonicalName: string }
  | { status: "missing"; sourceName: string }
  | { status: "ambiguous"; sourceName: string };

export function resolveSupplierName(
  sourceName: string | null | undefined,
  suppliers: readonly SupplierIdentity[],
): SupplierResolution;
```

- [x] Escrever testes para correspondência exata única, vazio, desconhecido, duplicidade exata, caixa diferente, acento diferente e fornecedor inativo.
- [x] Rodar `node --experimental-strip-types --test tests/supplier-identity.test.mjs`; a primeira execução falhou porque o módulo do resolver ainda não existia.
- [x] Implementar resolução por igualdade exata do texto preservado; não normalizar caixa, acento, URL ou abreviações.
- [x] Rerodar a suíte e confirmar que ambíguos/desconhecidos retornam `missing`/`ambiguous`, nunca um UUID presumido.

**Commit:** stage apenas o módulo e teste; commit `feat: resolve approved supplier identities`.

## Task 3: Criar schema compatível no ambiente de teste

**Files:** Create CLI-generated `supabase/migrations/<timestamp>_supplier_ids.sql`; regenerate `src/integrations/supabase/types.ts`.

- [ ] Confirmar por `supabase --help` o comando disponível para criar migration; criar o arquivo pela CLI oficial.
- [ ] Criar `public.fornecedores` com UUID, nome original, ativo e timestamps. Acrescentar `fornecedor_id uuid null` em `produtos` e `scraped_products`, FK com `ON DELETE RESTRICT` e índices.
- [ ] Só adicionar unicidade para o nome exato se o inventário comprovar que não há duplicatas exatas sem resolução; não criar unicidade normalizada.
- [ ] Habilitar RLS, revogar acesso público/usuário comum e permitir operações apenas pela rota server-side administrativa; registrar que service role ignora RLS.
- [ ] Não popular IDs nesta migration e não alterar preços/custos/strings antigas.
- [ ] Aplicar somente no banco local/teste e conferir colunas, constraints, índices, policies e contagens inalteradas.
- [ ] Gerar tipos pelo fluxo oficial e conferir os campos nullable em `produtos` e `scraped_products`.

**Verification:** migration passa no alvo isolado; legado permanece idêntico; IDs começam nulos; acesso público direto é negado.

**Commit:** stage somente migration, tipos gerados e checks; commit `feat: add supplier identity relations`.

## Task 4: Backfill revisado sem apagar o legado

**Files:** Modify `docs/supplier-name-map.csv`; create a server-side backfill operation or approved SQL under `supabase/migrations/` only after the map is reviewed.

- [ ] Registrar no CSV estado `approved` somente para igualdade exata confirmada; não inserir UUIDs gerados no CSV.
- [ ] Criar `supabase/migrations/<timestamp>_backfill_supplier_ids.sql` pela CLI e inserir cada nome aprovado com UUID gerado por `DEFAULT gen_random_uuid()`; relacionar registros por igualdade exata do texto legado.
- [ ] Testar preview da atualização em transação sem `COMMIT`; comparar por fornecedor contagens antes/depois e amostras de IDs sem preço/custo.
- [ ] Escrever backfill idempotente para apenas linhas com `fornecedor_id IS NULL` e texto exato aprovado; nenhuma atribuição automática a nomes sem mapeamento.
- [ ] Aplicar no banco de teste e validar: total de produtos, total de coletas, nulos intencionais, strings, custos, preços, fontes, variantes e histórico permanecem iguais.
- [ ] Reexecutar o backfill e confirmar que a segunda execução não altera linhas.

**Verification:** registros atribuídos = soma somente dos nomes aprovados; cada fornecedor ID existe; todos os valores comerciais e campos legados têm comparação sem diferenças.

**Commit:** stage somente CSV revisado e backfill testado; commit `data: map approved supplier names`.

## Task 5: Atualizar operações de painel e importação

**Files:** Modify `src/lib/admin.functions.ts`, `src/lib/supplier-identities.ts`, `tests/supplier-admin-functions.test.mjs`.

- [ ] Testar que `listAdminFornecedores` só retorna dados internos após senha correta e que cadastro rejeita nome vazio/duplicado exato.
- [ ] Testar upsert com ID válido, ID inexistente/inativo, texto legado incompatível e ID nulo para fornecedor sem correspondência.
- [ ] Atualizar `ProdutoInput` para aceitar `fornecedor_id` opcional; validar ID no servidor e manter o nome canônico em `fornecedor` no mesmo write.
- [ ] Atualizar `importScrapedProducts` para guardar sempre `supplier` original e resolver ID somente via correspondência exata única; desconhecido permanece nulo e pendente.
- [ ] Atualizar aprovação/associação da coleta para preservar `supplier`, `supplier_price`, `price_variations`, `source_url` e `product_id` anteriores, alterando apenas os campos selecionados.
- [ ] Manter verificação de senha, limites de payload e respostas sem custo na API pública.
- [ ] Adicionar regressão de serialização pública que recebe produto com `fornecedor_id`, `fornecedor`, `preco_atacado`, `url_fornecedor` e custos de variação e confirma que nenhum desses campos é retornado.
- [ ] Rodar testes focalizados e confirmar a comparação do preço base/10x não mudou.

**Commit:** stage somente `admin.functions.ts`, `supplier-identities.ts` e testes; commit `feat: use supplier IDs in admin operations`.

## Task 6: Atualizar agrupamento e seleção do painel

**Files:** Modify `src/routes/admin.tsx`, `src/components/admin/SupplierPricingPanel.tsx`, create `tests/supplier-pricing-panel.test.mjs`.

- [ ] Alterar a chave de grupo de texto para `fornecedor_id`; manter um grupo separado por nome legado não vinculado e um para sem fornecedor cadastrado.
- [ ] Alterar o editor para selecionar fornecedor existente ou criar fornecedor pelo endpoint administrativo; texto digitado não cria nem vincula automaticamente.
- [ ] Mostrar nome de origem e estado de vínculo quando o ID estiver nulo, com ação de vincular somente a opção exata revisada.
- [ ] Manter contagens de pendência, diferença bruta e alerta abaixo do custo já existentes; não rotular como margem/lucro.
- [ ] Conferir acessibilidade e layout desktop/celular sem expor custos em tráfego público.

**Verification:** mesmo catálogo por produto e por fornecedor; registros não mapeados continuam visíveis; um cadastro com nome parecido não se funde.

**Commit:** stage somente os componentes/rota/testes; commit `feat: group pricing by supplier ID`.

## Task 7: Homologar e apresentar sem promover produção

**Files:** Update `docs/PM04_FORNECEDORES_PRECIFICACAO_PREPARO_MIGRACAO.md`; create `docs/supplier-migration-preview.md`; evidence under `artifacts/supplier-migration-preview/`.

- [ ] Rodar `node --experimental-strip-types --test tests/supplier-identity.test.mjs tests/supplier-admin-functions.test.mjs tests/supplier-pricing-panel.test.mjs`.
- [ ] Rodar `npx tsc --noEmit --pretty false` e `npm run build`.
- [ ] Comparar leitura agrupada por nome e por UUID em banco de teste, com nulos e ambiguidades explicitados.
- [ ] Verificar que produto público não contém `fornecedor`, `fornecedor_id`, `preco_atacado`, `url_fornecedor` ou custos de variação.
- [ ] Conferir painel em 390px e desktop; registrar migration, mapa aprovado, backup/rollback, diferenças e commit exato.
- [ ] Não aplicar em produção, não remover colunas textuais e não publicar até aprovação da versão apresentada.

**Commit:** stage apenas relatório/evidências; commit `docs: record supplier migration preview`.
