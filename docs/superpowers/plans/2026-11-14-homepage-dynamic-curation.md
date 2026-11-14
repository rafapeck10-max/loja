# Página inicial dinâmica por meio do PM-02 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Permitir escolher, trocar, remover e ordenar os produtos das vitrines no PM-02 e fazer a home publicada consumir a versão aplicada, mantendo os dados dos cards ligados ao catálogo.

**Architecture:** O PM-02 mantém o rascunho de cada vitrine e seus modos manual/automático. Uma ação autenticada aplica uma revisão conferida em um snapshot público seguro dentro do workspace Supabase privado já existente, usando a comparação atômica de versão. A home pública recebe apenas a configuração permitida e hidrata os IDs com os dados atuais do catálogo.

**Tech Stack:** TypeScript, React, TanStack Start Server Functions, Supabase/PostgreSQL, Zod, Node test runner.

**Spec:** docs/superpowers/specs/2026-11-14-dynamic-home-product-curation-design.md

## Global Constraints

- Fazer todo o trabalho na branch codex/homepage-dynamic-curation; preservar os arquivos preexistentes alterados e stage apenas arquivos desta tarefa.
- O limite de cada vitrine continua em quatro produtos.
- Escolhas da semana permanece manual; Novidades e Para sua sala começam no modo automático e podem usar seleção manual.
- Nome, imagem, categoria e preço do card vêm do produto atual em produtos; a configuração pública guarda somente IDs e regras da vitrine.
- Não incluir custo, fornecedor, rascunhos ou PageDraft.baseVersion na resposta pública.
- Black Friday continua vinculada ao PM-05; o PM-02 não cria uma lista de campanha duplicada nem inventa preço/oferta.
- “Descubra algo novo” continua fora da home e do editor; Quarto, Sala e Cozinha e a operação online da Mobi permanecem como definidos.
- Não alterar produtos, preços, parcelas ou outros registros do Supabase; o botão de aplicar a configuração exige revisão e confirmação explícita.
- Usar o workspace privado já existente; não criar ou aplicar migration. Se a validação demonstrar que o contrato atual não comporta o snapshot, parar e apresentar a necessidade antes de DDL.
- Manter uma trava MOBI_REMOTE_HOME separada de MOBI_REMOTE_STUDIO: rascunhos remotos existentes não habilitam aplicação pública. A trava de aplicação fica desligada em desenvolvimento e prévias e só pode ser habilitada após aprovação da versão final; nenhum teste de painel pode escrever no workspace de produção.
- O PM-02 é a única fonte para escolher produtos e ordem da home. Na aba Vitrine, o HomeConnectionPanel não pode manter uma segunda ação de aplicar a seleção; mostrar ali apenas estado e prévia compartilhados. Não alterar seus fluxos das outras abas.
- Reabrir os dois documentos originais antes da implementação e novamente antes da entrega; seguir DEPLOYMENT.md para a prévia e não publicar sem aprovação da versão final.

## Review Focus

- Produto removido ou inelegível após ser escolhido: aplicação bloqueada com explicação; a versão pública anterior permanece.
- Escrita concorrente com expectedServerVersion antigo: conflito sem sobrescrever rascunho ou seleção pública.
- Workspace com custo, fornecedor e baseVersion: a função pública retorna somente o snapshot permitido.
- Rascunho legado sem modo manual/automático: reabertura compatível, sem apagar IDs nem reativar Descubra algo novo.
- Mudança de preço/foto após selecionar um ID: a home mantém a seleção e usa os dados atuais do catálogo.

## Arquivos e limites

| Arquivo | Papel nesta mudança |
|---|---|
| src/lib/pages-shelves.ts | Seleção manual/automática, normalização de rascunhos antigos e projeção pública da configuração PM-02. |
| src/lib/home-configuration.ts e src/lib/home-configuration-schema.ts | Validação e projeção segura dos seletores da página inicial. |
| src/lib/home-curation.ts e src/lib/featured-products.ts | Regras automáticas e remoção do fallback com IDs de produtos fixos. |
| src/components/PagesAndShelvesPanel.tsx, src/components/admin-studio/HomeConnectionPanel.tsx e src/pages-shelves.css | Busca no catálogo, troca, remoção, ordem, modo, prévia e estado aplicado no editor PM-02. |
| src/lib/admin-studio.ts, src/lib/admin-studio-transport.ts e src/lib/admin-studio-repository.ts | Snapshot público aplicado, comando de aplicação e preservação em revisões concorrentes. |
| src/lib/admin.functions.ts e src/components/admin-studio/AdminStudio.tsx | Aplicação autenticada de uma revisão PM-02 já revisada. |
| src/lib/home-publication.server.ts (novo) | Leitura server-side do snapshot público pelo cliente privilegiado, com projeção allowlist. |
| src/lib/products.functions.ts | Hidratação dos IDs escolhidos com produtos públicos atuais. |
| src/routes/index.tsx, src/components/HomepageContent.tsx e src/components/admin-studio/AdminStudio.tsx | Consumo da versão aplicada, atualização da prévia e ação de aplicar no PM-02. |
| tests/pages-shelves.test.mjs, tests/home-runtime.test.mjs, tests/admin-studio-persistence.test.mjs e novos testes focados | Regras de seleção, persistência, autorização, conflito e projeção pública. |

HomeCurationPanel.tsx não é importado pela rota administrativa atual; não criar uma segunda tela de curadoria nem torná-lo outra fonte de verdade.

---

### Task 1: Definir seleção por vitrine e manter rascunhos antigos

**Files:** Modify src/lib/pages-shelves.ts, src/lib/home-curation.ts, src/lib/home-configuration.ts, src/lib/home-configuration-schema.ts; create or extend tests/pages-shelves.test.mjs, tests/home-runtime.test.mjs and tests/home-configuration.test.mjs.

**Interfaces:**

~~~ts
export type ProductShelfId = "weekly" | "new" | "room";
export type ProductShelfMode = "automatico" | "manual";
export interface ProductShelfSelection {
  mode: ProductShelfMode;
  productIds: string[];
}
export interface PageDraft {
  version: 1;
  page: "home";
  baseVersion: string;
  sections: PageSection[];
  curation: CurationDraft;
  shelves: {
    new: ProductShelfSelection;
    room: ProductShelfSelection;
  };
}
export interface PublishedHomePage {
  version: 1;
  revisionId: number;
  appliedAt: string;
  sections: PageSection[];
  shelves: {
    weekly: { mode: "manual"; productIds: string[] };
    new: ProductShelfSelection;
    room: ProductShelfSelection;
  };
}
~~~

- [ ] Testar normalizePageDraft com um rascunho legado: manter weeklyIds em Escolhas da semana; preencher Novidades e Para sua sala como automáticas; manter Descubra desativada e oculta.
- [ ] Testar a função pura sectionProducts(id, products, date, selection): manual preserva ordem dos IDs e remove duplicatas; automático mantém os critérios atuais; IDs ausentes ou inelegíveis não geram cards.
- [ ] Testar que, sem IDs semanais, Escolhas da semana fica vazia e é omitida; Novidades e Para sua sala continuam usando suas regras automáticas atuais, sem lista de slugs/IDs em código.
- [ ] Implementar normalizePageDraft para ler rascunhos antigos sem perder weeklyIds ou configurações existentes; adicionar shelves.new e shelves.room ao PageDraft sem duplicar curation.weeklyIds nem gravar alterações no cadastro de produtos.
- [ ] Implementar publishedHomePageFromDraft(draft, products, revisionId, appliedAt): validar IDs e limite de quatro, remover a seção discovery da projeção e retornar somente seções e IDs permitidos, sem baseVersion ou dados de produto.
- [ ] Atualizar validatePageDraft e homeConfigurationSchema para validar modos, IDs únicos, limite de quatro e elegibilidade pelo catálogo vigente; representar Escolhas da semana como manual e suas IDs como a ordem editorial.
- [ ] Rodar node --experimental-strip-types --test tests/pages-shelves.test.mjs tests/home-runtime.test.mjs tests/home-configuration.test.mjs; manter casos de rascunho antigo e lista sem IDs fixos aprovados.

**Commit:** feat: model dynamic homepage product shelves.

### Task 2: Permitir trocar e ordenar produtos no PM-02

**Files:** Modify src/components/PagesAndShelvesPanel.tsx and src/pages-shelves.css; extend tests/pages-shelves.test.mjs for the editor model.

**Interfaces:** Consome ProductShelfSelection e sectionProducts da Task 1; a prop managed.onChange(draft) continua sendo o único caminho para atualizar o rascunho.

- [ ] Reaproveitar a busca existente por nome, referência/SKU e categoria para todas as vitrines de produtos; resultados mostram foto, nome, categoria, SKU e preço atual.
- [ ] Manter Escolhas da semana como lista manual; permitir adicionar, trocar, remover e ordenar até quatro itens.
- [ ] Para Novidades e Para sua sala, adicionar controles “Automático” e “Escolher produtos”; no modo manual, oferecer as mesmas ações de seleção/ordem e preservar a seleção ao alternar de modo.
- [ ] Manter Black Friday como referência somente ao PM-05; não exibir seletor de produto de campanha dentro do PM-02.
- [ ] Mostrar inelegibilidade junto do item e bloquear a revisão; não substituir o produto silenciosamente.
- [ ] Atualizar a prévia desktop/celular usando os mesmos HomeProductSection e ProductCard da loja; garantir que alterações usem managed.onChange e não gravem o catálogo.
- [ ] Conferir manualmente troca, remoção, ordem e modo automático/manual no painel; build e lint dos arquivos modificados devem passar.

**Commit:** feat: add product selection to homepage shelves.

### Task 3: Aplicar uma revisão PM-02 com controle de versão

**Files:** Modify src/lib/admin-studio.ts, src/lib/admin-studio-transport.ts, src/lib/admin-studio-repository.ts, src/lib/admin.functions.ts and src/components/admin-studio/AdminStudio.tsx; add tests/home-publication.test.mjs and extend tests/admin-studio-persistence.test.mjs / tests/admin-studio-repository.test.mjs.

**Interfaces:**

~~~ts
export interface StudioWorkspace {
  schema: 1;
  revision: number;
  entries: Partial<Record<StudioScope, unknown>>;
  history: StudioRevision[];
  publishedHomePage?: PublishedHomePage;
}
export type StudioWorkspaceCommand =
  | { action: "save"; expectedServerVersion: number; scope: StudioScope; value: unknown }
  | { action: "review"; expectedServerVersion: number; scope: StudioScope }
  | { action: "restore"; expectedServerVersion: number; revisionId: number }
  | { action: "recover"; expectedServerVersion: number; scopes: StudioScope[] }
  | { action: "publishHomePage"; expectedServerVersion: number; reviewedRevisionId: number };
export async function applyReviewedHomePage(input: {
  password: string;
  expectedServerVersion: number;
  reviewedRevisionId: number;
}): Promise<StudioWorkspaceSnapshot>;
~~~

- [ ] Testar que revisões normais preservam publishedHomePage e que a aplicação registra um evento pages com status applied sem apagar o histórico anterior; ampliar StudioRevision e parseWorkspace para aceitar esse estado.
- [ ] Testar que aplicação exige a revisão exata de pages em estado reviewed, a versão remota esperada e catálogo/base ainda compatíveis.
- [ ] Testar falha de senha, conflito CAS, revisão inexistente/rascunho e produto inelegível; em cada falha, manter o snapshot publicado anterior intacto.
- [ ] Testar que publishedHomePage contém somente version, revisão/data, seções, modos e IDs; fixture com preco_atacado, fornecedor e baseVersion nunca pode chegar à resposta pública.
- [ ] Ler o changelog e a documentação oficial Supabase atual sobre RPCs, server-side service_role e proteção da tabela antes de tocar no transporte.
- [ ] Confirmar pelo inventário já registrado e por consulta remota somente leitura que mobi_studio_workspace está aplicado; inspecionar a migration para confirmar que workspace JSONB aceita a propriedade opcional e o tamanho do snapshot cabe no limite. Não executar SQL remoto.
- [ ] Implementar o comando applyHomePage com a senha administrativa existente e catálogo lido no servidor. A função pura de aplicação valida a revisão pages mais recente em estado reviewed, a base do catálogo e a elegibilidade, cria o PublishedHomePage por allowlist e grava tudo em uma única comparação atômica mobi_studio_compare_and_swap.
- [ ] Bloquear applyHomePage enquanto MOBI_REMOTE_HOME estiver desligado. A trava é distinta de MOBI_REMOTE_STUDIO, que já controla o salvamento remoto de rascunhos.
- [ ] Adicionar ação “Aplicar à loja” ao PM-02 somente quando a revisão estiver conferida e a trava permitir; exibir confirmação com a lista/ordem alterada e identificar a versão aplicada. Remover da aba Vitrine qualquer ação duplicada de aplicação oferecida pelo HomeConnectionPanel.
- [ ] Rodar node --experimental-strip-types --test tests/home-publication.test.mjs tests/admin-studio-persistence.test.mjs tests/admin-studio-repository.test.mjs; conferir que todas as operações em mobi_studio_workspace continuam server-side.

**Commit:** feat: apply reviewed homepage selection.

### Task 4: Fazer a home pública ler a seleção aplicada

**Files:** Create src/lib/home-publication.server.ts; modify src/lib/products.functions.ts, src/routes/index.tsx, src/components/HomepageContent.tsx and src/lib/home-revision-cache.ts; extend tests/home-runtime.test.mjs, tests/home-revision-cache.test.mjs and tests/home-publication.test.mjs.

- [ ] Implementar readPublishedHomePage() com cliente privilegiado somente no servidor e expor o DTO PublishedHomePage allowlist junto dos dados da consulta de produtos da home, ou null quando não houver versão aplicada.
- [ ] Testar a função pública com workspace contendo rascunhos e dados internos; verificar que nenhum desses campos é serializado.
- [ ] Atualizar readPublicHomepageProducts() para usar modos/IDs aplicados, buscar os produtos atuais pelo ID e preservar a ordem escolhida.
- [ ] No modo automático, recalcular Novidades e Para sua sala com os produtos atuais. No modo manual, omitir IDs que perderam elegibilidade e não preenchê-los com produtos arbitrários.
- [ ] Remover featuredProducts(available) como fonte de IDs fixos; sem configuração aplicada, continuar com seleção automática baseada no catálogo elegível atual.
- [ ] Fazer HomepageContent usar as seções aplicadas e os IDs/modes públicos, sem deixar a configuração local HomeDocument substituir a seleção de produtos. Não alterar banners, navegação, catálogo ou WhatsApp; manter Descubra algo novo oculto e Black Friday vinculada ao PM-05.
- [ ] Invalidar ["produtos", "homepage"] após aplicação, de modo que a prévia e a rota pública recarreguem a seleção e os dados atuais.
- [ ] Rodar os testes focados de home-runtime, home-publication e cache; verificar que preços/parcelas são calculados pelos componentes atuais e não pela seleção PM-02.
- [ ] Rodar node --experimental-strip-types --test tests/home-runtime.test.mjs tests/home-revision-cache.test.mjs tests/home-publication.test.mjs antes de seguir.

**Commit:** feat: render applied homepage product shelves.

### Task 5: Conferir a prévia e fechar a entrega

**Files:** Update docs/PM02_CONFERENCIA_DOCUMENTAL.md and add evidências em .output/home-dynamic-curation/.

- [ ] Reabrir os dois documentos originais e confirmar a correspondência requisito → fonte → arquivo → evidência → pendência.
- [ ] Rodar os testes focados das Tasks 1–4, npm run build e npx eslint nos arquivos TypeScript alterados: src/lib/pages-shelves.ts, src/lib/home-curation.ts, src/lib/home-configuration.ts, src/lib/home-configuration-schema.ts, src/components/PagesAndShelvesPanel.tsx, src/components/admin-studio/HomeConnectionPanel.tsx, src/lib/admin-studio.ts, src/lib/admin-studio-transport.ts, src/lib/admin-studio-repository.ts, src/lib/admin.functions.ts, src/components/admin-studio/AdminStudio.tsx, src/lib/home-publication.server.ts, src/lib/products.functions.ts, src/routes/index.tsx, src/components/HomepageContent.tsx e src/lib/home-revision-cache.ts.
- [ ] Conferir em prévia local isolada, sem MOBI_REMOTE_HOME e sem escrita em mobi_studio_workspace: trocar dois produtos, alterar ordem, testar seleção manual/automática e recarregar o rascunho.
- [ ] Conferir a home em 1440 px e 390 px; verificar fotos, nomes, preço atual, 10x já existente, ausência de espaços de vitrine vazia, Quarto/Sala/Cozinha e Black Friday sem oferta inventada.
- [ ] Verificar que a prévia de código não aplica configuração ao banco de produção; registrar URL/branch, capturas, checks e reversão.
- [ ] Criar a prévia da branch conforme DEPLOYMENT.md, sem merge/push em main e sem habilitar MOBI_REMOTE_HOME. A seleção continua prévia até aprovação explícita da versão.
- [ ] Apresentar a versão exata para Rafael. Esperar aprovação antes de qualquer integração em main, ativação remota ou publicação.

**Commit:** docs: record dynamic homepage preview.
