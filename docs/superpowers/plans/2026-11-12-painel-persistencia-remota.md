# Painel Mobi — persistência remota e publicação Implementation Plan

> **For agentic workers:** use `superpowers:executing-plans` for native execution. Steps use checkbox syntax; execute in order and stop at any environment or approval gate.

**Goal:** Persistir rascunhos e revisões do painel com segurança, ligar configurações suportadas ao consumidor público e manter a publicação reversível.

**Architecture:** Preservar os modelos puros já existentes (`StudioWorkspace` e `HomeDocument`) e acrescentar um transporte server-side com comparação de versão. Reutilizar o catálogo e as tabelas de domínio atuais; guardar somente snapshots/deltas administrativos e uma trilha de revisão append-only, com a projeção pública explicitamente sanitizada.

**Tech Stack:** TypeScript, React, TanStack Start Server Functions, Supabase/PostgreSQL, Zod, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-12-mobi-migration-readiness-design.md`

## Global Constraints

- Trabalhar na branch não produtiva atual e preservar as alterações já existentes; stage somente arquivos da tarefa executada.
- Produção e dados publicados ficam fora do ambiente de teste; nenhuma publicação antes de aprovação da versão exata.
- Credenciais Supabase privilegiadas ficam somente no servidor; `supabaseAdmin` ignora RLS e cada escrita exige verificação administrativa server-side.
- Não duplicar o catálogo; rascunhos PM-04 podem conter somente deltas necessários, incluindo custos, em armazenamento administrativo privado.
- A projeção pública usa allowlist e não inclui rascunhos, `preco_atacado`, custos por variação ou identidade do fornecedor.
- Preservar as regras atuais de preço e o valor exato em 10x; esta etapa não altera preço nem parcela.
- Usar o schema remoto confirmado; não inferir que migrations locais foram aplicadas.
- Não criar branch/projeto Supabase com custo sem confirmar a cobrança e receber a confirmação necessária.

## Review Focus

- Cliente envia workspace malformado, maior que o limite ou com escopo desconhecido → rejeitar e manter a revisão remota atual; cobrir em `admin-studio-persistence.test.mjs`.
- Duas abas salvam a mesma versão-base → uma recebe conflito, nenhuma edição é perdida; cobrir no mesmo teste.
- Migração de dados locais inválidos ou concorrentes → preservar cópia local e permitir exportar/reabrir; cobrir em `admin-studio-migration.test.mjs`.
- Falha ao revisar/aplicar uma home → ponteiro publicado continua na revisão anterior; cobrir em `home-persistence.test.mjs`.
- Consulta pública tenta obter estado administrativo → retornar somente projeção publicada e sanitizada; cobrir em `home-persistence.test.mjs` e verificar bundle/build.

---

## Arquivos e limites

- `src/lib/admin-studio.ts`: transições puras e validação do `StudioWorkspace`.
- `src/lib/admin-studio.functions.ts` **(novo)**: Server Functions administrativas para leitura e comandos do workspace.
- `src/lib/admin-studio-store.server.ts` **(novo)**: adaptador Supabase server-only e controle de versão.
- `src/lib/admin-auth.server.ts` **(novo)**: verificação compartilhada da senha no servidor; `admin.functions.ts` reutiliza a mesma função.
- `src/components/admin-studio/AdminStudio.tsx`: carregar/salvar/revisar/restaurar no transporte remoto quando não for demonstração; manter demonstração isolada.
- `src/lib/home-local.functions.ts`, `src/lib/home-transport.ts`, `src/components/admin-studio/HomeConnectionPanel.tsx`, `src/routes/admin.tsx`: manter transporte local para preview e acrescentar o fluxo remoto configurado por ambiente.
- `src/lib/home-public.functions.ts` **(novo)**, `src/components/LocalHomeConfigurationProvider.tsx`, `src/lib/products.functions.ts`, `src/routes/ajuda.tsx`, `src/routes/ajuda.$slug.tsx`, `src/routes/inspiracao.tsx`, `src/routes/inspiracao.$slug.tsx`: consumir apenas release aplicado quando a integração remota estiver habilitada.
- `supabase/migrations/<timestamp>_mobi_admin_revisions.sql` **(gerado pela CLI)**: estado/versionamento mínimo, histórico e operação transacional, após inventário do schema.
- `src/integrations/supabase/types.ts`: regenerar pelo fluxo oficial após migration confirmada; não editar tipos gerados à mão.
- Testes novos: `tests/admin-studio-persistence.test.mjs`, `tests/admin-studio-migration.test.mjs`, `tests/home-persistence.test.mjs`.

## Task 1: Confirmar o projeto e inventariar o schema sem escrita

**Files:** Create `docs/supabase-migration-inventory.md`.

- [x] Confirmar que o destino documentado é `mobi-loja` (`xzgafeqifikqrxrjaueb`) pelo registro Mobi, `docs/supabase-catalog-access.md` e dashboard. A ref antiga `ehdxfbutcsqnunxlvval` não apareceu na organização; `supabase/config.toml` foi alinhado localmente.
- [x] Inventariar no dashboard migrations, tabelas/colunas, constraints/índices, RLS/grants, funções/triggers e buckets relevantes; MCP e CLI não estavam disponíveis.
- [x] Registrar schema, contagens agregadas e diferenças sem exportar dados pessoais, nomes de fornecedor ou valores comerciais em `docs/supabase-migration-inventory.md`.
- [x] Confirmar que `compre_junto_ids` não existe no schema remoto observado e que o ID da migration local não aparece na lista remota.
- [ ] Confirmar ambiente descartável/local já disponível. O projeto aberto não mostrou branches nem backups; não criar branch/projeto com custo sem autorização.
- [x] Parar antes de DDL por ausência de ambiente de teste, registrar a dependência e não fabricar migration manual.

**Verification:** inventário comparado com os arquivos locais e contratos; a discrepância `compre_junto_ids` entre código/types e banco foi registrada. Nenhuma escrita remota.

## Task 2: Fixar o contrato de comandos remotos com testes

**Files:** Modify `src/lib/admin-studio.ts`; create `src/lib/admin-studio-transport.ts`, `tests/admin-studio-persistence.test.mjs`, `tests/admin-studio-migration.test.mjs`.

**Interfaces:**

```ts
export interface StudioWorkspaceSnapshot {
  serverVersion: number;
  workspace: StudioWorkspace;
}

export type StudioWorkspaceCommand =
  | { action: "save"; expectedServerVersion: number; scope: StudioScope; value: unknown }
  | { action: "review"; expectedServerVersion: number; scope: StudioScope }
  | { action: "restore"; expectedServerVersion: number; revisionId: number }
  | { action: "recover"; expectedServerVersion: number; scopes: StudioScope[] };

export interface StudioWorkspaceTransport {
  read(): Promise<StudioWorkspaceSnapshot>;
  change(command: StudioWorkspaceCommand): Promise<StudioWorkspaceSnapshot>;
}
```

- [x] Write tests that unknown scope, invalid workspace, non-finite revision, over-limit payload and stale server version are rejected without mutating the saved snapshot.
- [x] Write tests that `save`, `review`, `restore` and `recover` preserve the current revision semantics in `admin-studio.ts`; restoration creates a new draft and retains the old history.
- [x] Write migration tests that malformed `localStorage` remains byte-for-byte available for export and a valid local workspace is imported only after explicit user action.
- [x] Run `node --experimental-strip-types --test tests/admin-studio-persistence.test.mjs tests/admin-studio-migration.test.mjs`; the first run failed because the transport module did not yet exist.
- [x] Implement the transport types and pure command normalization; keep local demonstration storage separate.
- [x] Rerun the two tests and confirm expected state transitions and conflicts pass.

**Commit:** stage only `src/lib/admin-studio.ts`, `src/lib/admin-studio-transport.ts` and the two listed tests; commit as `feat: define remote admin workspace contract`.

## Task 3: Add the minimal versioned database contract

**Files:** Create the CLI-generated migration `supabase/migrations/<timestamp>_mobi_admin_revisions.sql`; update generated types after applying it to a local/test database.

**Interfaces:** Unless Task 1 finds an equivalent safe structure, create `mobi_admin_state(stream text primary key check in ('studio','home'), version bigint, document jsonb, published_revision_id bigint null, updated_at timestamptz)` and `mobi_admin_revisions(id bigint identity primary key, stream text, revision_no bigint, scope text, action text, status text, base_version bigint null, before_payload jsonb, after_payload jsonb, restored_from bigint null, actor_label text, created_at timestamptz, unique(stream, revision_no))`. Seed one empty state per stream. `mobi_admin_state.document` stores current entries/config without duplicating the event history; the adapter rebuilds `StudioWorkspace.history` and `HomeDocument.revisions` from the append-only rows. The transaction `commit_mobi_admin_revision(p_stream, p_expected_version, p_document, p_events, p_publish_revision_id)` compares the version, appends one or more history rows, and advances the state/published pointer atomically. Most commands append one row; `recover` may append one row per selected scope in the same transaction and server-version increment. No product rows or supplier costs are copied into public tables.

- [ ] Discover `supabase --version` and `supabase migration new --help`; use the official CLI to create the timestamped migration. Do not hand-invent a migration filename.
- [ ] Add constraints for supported stream/action/status values, unique stream/version, foreign keys for the published head, and indexes for history lookup.
- [ ] Add a trigger or privileges that reject `UPDATE`/`DELETE` on history rows; only the transaction function appends revisions.
- [ ] Enable RLS and deny `anon`/ordinary authenticated users access to administrative state/history. Grant only the required operation to the server credential path; document that `service_role` bypasses RLS.
- [ ] Implement the atomic compare-and-append SQL operation so failed/stale writes leave the prior state and published pointer untouched.
- [ ] Add local schema checks for invalid stream, status, version collision and forbidden public access.
- [ ] Apply only to a disposable local/test database whose target was confirmed in Task 1; inspect the generated SQL and migration status before/after.
- [ ] Generate `types.ts` using the supported Supabase workflow and inspect that only intended relations/functions changed.

**Verification:** migration applies on the test target; stale `expected_version` fails; one applied home revision is returned; no `anon`/visitor write succeeds; original rows/counts remain unchanged.

**Commit:** stage only the generated migration, generated type diff, and migration checks; commit as `feat: add versioned admin state storage`.

## Task 4: Implement authenticated server persistence

**Files:** Create `src/lib/admin-auth.server.ts`, `src/lib/admin-studio-store.server.ts`, `src/lib/admin-studio.functions.ts`; modify `src/lib/admin.functions.ts`; extend `tests/admin-studio-persistence.test.mjs`.

**Interfaces:**

```ts
export async function readAdminStudioWorkspace(input: {
  password: string;
}): Promise<StudioWorkspaceSnapshot>;

export async function changeAdminStudioWorkspace(input: {
  password: string;
  command: StudioWorkspaceCommand;
}): Promise<StudioWorkspaceSnapshot>;
```

- [ ] Write tests that missing/wrong password never reaches the repository, correct password uses only the server repository, and database conflict is returned without replacing browser edits.
- [ ] Extract the existing timing-safe password comparison into `admin-auth.server.ts` and make all existing `admin.functions.ts` handlers call that function; preserve the same `ADMIN_PASSWORD` behavior.
- [ ] Validate command shape, known scope, payload size and resource-specific `validateStudioResource` result on the server using the current product source.
- [ ] Implement server read/change through `supabaseAdmin`; perform compare-and-swap using the transaction from Task 3, never trust a client-supplied next history as authoritative.
- [ ] Store product draft deltas only in the private `studio` stream; ensure no server response used by public routes returns that stream.
- [ ] Rerun focused tests; inspect network/server payloads for password, cost and supplier values.

**Commit:** stage only the listed server/auth files, `admin.functions.ts` and focused tests; commit as `feat: persist admin workspace on server`.

## Task 5: Connect the panel and preserve local drafts

**Files:** Modify `src/components/admin-studio/AdminStudio.tsx`, `src/routes/admin.tsx`, `src/lib/admin-studio-transport.ts`; add `tests/admin-studio-migration.test.mjs` cases.

- [ ] Add a remote transport prop and use it for the authenticated `admin` workspace; keep `demonstration` on a separate local/demo store.
- [ ] Load the server snapshot before enabling controls; keep unsaved in-memory edits if loading or saving fails.
- [ ] Send save/review/restore/recover commands with `expectedServerVersion`; update local state only from the server response.
- [ ] On conflict, keep the open edit, explain that the remote version advanced, and offer export/reopen/compare without automatic overwrite.
- [ ] Detect existing `mobi:admin-studio:v1:admin` and old pages/shelves keys; show an explicit action to import one selected scope at a time. Keep the local raw workspace/history exportable and never delete its keys.
- [ ] Add a test for demo/admin separation, explicit scoped import of a valid workspace, corrupt import preservation, and a cross-tab/server-version conflict.

**Verification:** reload in a fresh browser context and confirm a saved draft is restored from the server; demo changes do not appear in admin and vice versa.

**Commit:** stage only `AdminStudio.tsx`, `admin.tsx`, transport and tests; commit as `feat: connect admin panel to remote drafts`.

## Task 6: Persist home releases and connect public consumers behind a flag

**Files:** Create `src/lib/home-public.functions.ts`; modify `src/lib/home-local.functions.ts`, `src/lib/home-transport.ts`, `src/routes/admin.tsx`, `src/components/LocalHomeConfigurationProvider.tsx`, `src/lib/products.functions.ts`, `src/routes/ajuda.tsx`, `src/routes/ajuda.$slug.tsx`, `src/routes/inspiracao.tsx`, `src/routes/inspiracao.$slug.tsx`; create `tests/home-persistence.test.mjs`.

- [ ] Test the public projection with a fixture containing private product deltas and supplier cost; assert that only `publicHomeConfiguration` fields are returned and drafts never appear.
- [ ] Test failed apply, stale base, restore-as-new-draft and reviewed-only apply; the published revision remains unchanged until the atomic transaction succeeds.
- [ ] Add remote `HomeTransport` using the authenticated server functions; retain the local file adapter for local preview only.
- [ ] Add `MOBI_REMOTE_HOME=1` as an explicit feature flag, default off; when off or unavailable, retain the current default/public behavior and display integration status in admin.
- [ ] Add `getPublishedHomeConfiguration()` as a public-safe GET Server Function that reads only the applied home revision and returns the explicit allowlisted DTO.
- [ ] Update public page and product-selection consumers to use that DTO when enabled; keep public catalog data in `produtos` and private server reads out of the browser bundle.
- [ ] Rerun `tests/home-persistence.test.mjs` and existing `tests/home-configuration.test.mjs`.

**Verification:** local/test environment with flag off matches existing public content; test environment with flag on displays the applied revision; a draft/review does not affect public routes; restore/apply updates only the preview/test release.

**Commit:** stage only the listed files and tests; commit as `feat: serve approved home configuration`.

## Task 7: Validate migration preview and delivery boundary

**Files:** Update `docs/supabase-migration-inventory.md`; create or update `docs/migration-preview-2026-11-12.md`; store screenshots under `artifacts/migration-preview/`.

- [ ] Run `node --experimental-strip-types --test tests/admin-studio-persistence.test.mjs tests/admin-studio-migration.test.mjs tests/home-persistence.test.mjs tests/home-configuration.test.mjs`.
- [ ] Run `npx tsc --noEmit --pretty false` and `npm run build`.
- [ ] Use a test database and a clean browser context to verify migration state, admin authentication, persistence after reload, conflict handling, restore, public allowlist and both feature-flag modes.
- [ ] Inspect `/`, `/produto/:id`, `/ajuda`, `/ajuda/:slug`, `/inspiracao` and `/inspiracao/:slug` at 390px and desktop; confirm the Mobi online-only messaging and loaded product/banner images.
- [ ] Record the exact branch/commit, preview URL, test DB reference, checks, rollback and unresolved access/mobile-device limitations.
- [ ] Do not run deployment preflight or write to production until Rafael approves the exact reviewed version.

**Commit:** stage only the report/evidence manifest; commit as `docs: record panel migration preview`.
