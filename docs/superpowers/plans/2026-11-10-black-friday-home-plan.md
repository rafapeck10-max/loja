# Black Friday da Home Mobi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar uma seção compacta de produtos Black Friday à home local da Mobi, editável no PM-02 e associada a campanhas do PM-05.

**Architecture:** Acrescentar uma seção tipada ao modelo existente da home, migrando rascunhos antigos sem reescrever o histórico. Gerar uma projeção local mínima das campanhas associadas e renderizar a seção com os cartões atuais. A configuração de campanhas hoje é local; produção continua sem a seção até existir fonte pública persistente autorizada.

**Tech Stack:** React, TypeScript, Zod, TanStack Router, Vite; componentes e configuração local já existentes. Nenhuma dependência nova.

**Spec:** [`docs/superpowers/specs/2026-11-10-black-friday-home-design.md`](../specs/2026-11-10-black-friday-home-design.md)

## Global Constraints

- Manter a identidade, a paleta, a tipografia e o tom da Mobi; não transplantar conteúdo, cores ou ofertas da MadeiraMadeira.
- Posição inicial depois de “Encontre por ambiente” e antes de “Escolhas da semana”; o PM-02 continua podendo reordenar a seção.
- Exibir quatro cartões por linha no desktop e duas colunas no celular.
- Vigência de campanha usa `America/Sao_Paulo`; campanha simulada local não se torna oferta pública.
- Usar preço corrente do catálogo e os cartões existentes. Não criar preço riscado, desconto, economia ou contagem regressiva sem condição e fonte validadas.
- Não alterar preço-base, catálogo, parcelas, carrinho, estoque, dados do banco, Supabase, `main` ou produção.
- Rascunhos e revisões anteriores devem continuar legíveis; não reescrever o histórico para inserir o novo padrão.
- A prévia deve distinguir demonstração local de loja publicada; não chamar o estado `applied` local de publicação.
- Não adicionar nem executar testes automatizados nesta etapa; validar com build, lint direcionado e conferência manual da prévia.

## Review Focus

- Rascunho PM-02 antigo sem o novo ID: abrir, preservar os demais IDs/ordem e oferecer a nova seção desativada.
- Histórico da home em schema anterior: ler e reabrir sem alteração destrutiva; nova revisão inclui a seção sem alterar snapshots antigos.
- Campanha PM-05 em rascunho, desativada, futura, fora do período ou com data inválida: ocultar produtos da prévia e exibir a dependência no painel.
- Produto participante ausente, inválido ou com base comercial alterada: omitir produto conflitante e bloquear a revisão que o trate como oferta ativa.
- Mais de uma campanha associada ou produtos repetidos: evitar cartão duplicado; não resolver conflito escolhendo silenciosamente uma campanha.

## File Map

- `src/lib/pages-shelves.ts`: catálogo ordenável de seções, padrão e migração compatível de `PageDraft` antigo.
- `src/lib/studio-validation.ts` e `src/components/admin-studio/AdminStudio.tsx`: validar e abrir rascunhos locais compatíveis sem modificar snapshots antigos.
- `src/lib/home-configuration.ts` e `src/lib/home-configuration-schema.ts`: projeção local versionada e validação dos dados mínimos da campanha.
- `src/lib/products.functions.ts`: carregar no mesmo snapshot local os produtos elegíveis de campanhas futuras, para a home atualizar na hora de início sem recarregar a página.
- `src/components/PagesAndShelvesPanel.tsx`: edição do título, apoio, ordem e estado; ligação explicada ao PM-05 sem lista duplicada de produtos.
- `src/components/admin-studio/HomeConnectionPanel.tsx`: prévia da revisão usando a configuração de campanhas fornecida pelo mesmo estado do estúdio.
- `src/components/HomepageContent.tsx` e novo `src/components/BlackFridayHomeSection.tsx`: consumidor e seção de produtos pelo renderer da home.
- `src/home-redesign.css` e `src/pages-shelves.css`: tratamento visual da seção e da explicação do vínculo no painel.

## Tasks

### Task 1: Add the section model with lossless compatibility

**Files:**

- Modify: `src/lib/pages-shelves.ts`
- Modify: `src/lib/studio-validation.ts`
- Modify: `src/components/admin-studio/AdminStudio.tsx`
- Modify: `src/lib/home-configuration.ts`
- Modify: `src/lib/home-configuration-schema.ts`

**Interfaces:**

- Add `blackFriday` to `PAGE_SECTIONS` as an unlocked `vitrine`, directly after `intro`; its initial `enabled` value is `false`, title `Black Friday da Mobi`, and support text `Veja os produtos selecionados para a campanha.`
- Add `normalizePageDraft(value: unknown, products: EditorProduct[]): PageDraft`. It inserts only the missing `blackFriday` definition after `intro`, preserves the order and values of existing known sections, and rejects unknown IDs, duplicates, malformed content, or product-base conflicts.
- Keep old home DTOs readable: `sections` accepts seven legacy items or eight current items; optional campaign projection is absent on legacy records. Do not bump `schemaVersion` for an additive optional field.
- On workspace load, present the normalized `pages` value to the editor but leave `history[].before/after` and the saved workspace untouched. Saving creates a new revision; it does not rewrite past snapshots.
- `reopenHomeDraft()` supplies the disabled default when an older applied home lacks the section.

- [x] **Step 1: Inspect the committed schema and migration paths.** Confirm `parseWorkspace` validates history against the saved current entry before page normalization; identify where `data.pages` can use a normalized view without mutating `workspace.history`.
- [x] **Step 2: Add the `blackFriday` page definition and `normalizePageDraft()`** in `src/lib/pages-shelves.ts`; preserve all existing IDs and their relative order.
- [x] **Step 3: Use normalization at editor load and legacy reopen** in `AdminStudio.tsx`, `studio-validation.ts`, and `home-configuration.ts`; leave original persisted snapshots unchanged until a user saves a new revision.
- [x] **Step 4: Extend the Zod home DTO compatibly** in `home-configuration-schema.ts`; keep schema version 1 and accept both legacy and current section counts.
- [ ] **Step 5: Check the migration manually** by opening a saved seven-section PM-02 draft and an older home revision; verify that all existing settings remain and Black Friday starts disabled.
- [x] **Step 6: Include the model and compatibility change** in the cohesive local feature commit recorded in Task 4; no separate intermediate commit was needed.

### Task 2: Connect PM-02 sections to PM-05 campaigns

**Files:**

- Modify: `src/lib/home-configuration.ts`
- Modify: `src/lib/home-configuration-schema.ts`
- Modify: `src/components/PagesAndShelvesPanel.tsx`
- Modify: `src/components/admin-studio/HomeConnectionPanel.tsx`
- Modify: `src/components/admin-studio/AdminStudio.tsx` only if TypeScript requires an explicit `HomeDraftInput` projection

**Interfaces:**

- Extend `HomeDraftInput` with optional `campaigns?: CampaignData` for legacy callers. The current `AdminStudio` state already owns PM-05 data and passes the complete `data` object to `HomeConnectionPanel`.
- Add an optional safe projection `blackFridayCampaigns` to `HomeConfiguration`:

```ts
type HomeCampaignPreview = {
  id: string;
  startsAt: string;
  endsAt: string;
  productIds: string[];
  source: "local-preview";
};
```

- Project only reviewed, locally enabled campaigns associated to the `blackFriday` section in PM-05, after `validateCampaignData()` and `campaignConflicts()` pass. Include ID, interval, eligible product IDs, and local-preview source only; exclude campaign names, simulation flags, proposed/reference prices, evidence, costs, supplier data, and base fingerprints.
- `CAMPAIGN_SECTIONS` already derives its options from `PAGE_SECTIONS`; adding the section exposes it to the existing PM-05 association UI. Do not add a second product picker.
- PM-02 shows title, support text, enabled state, and order. Its Black Friday properties explain that selection, period, and conditions are set in **Preços e campanhas**.

- [ ] **Step 1: Define `HomeCampaignPreview` and optional `HomeConfiguration.blackFridayCampaigns`** in `home-configuration.ts`; add a strict Zod shape for it in `home-configuration-schema.ts`, leaving old configurations valid.
- [x] **Step 2: Extend `HomeDraftInput` and `homeConfigurationFromDraft()`** to read PM-05 `CampaignData`, include only valid reviewed simulations associated with `blackFriday`, and emit the safe `HomeCampaignPreview` fields.
- [x] **Step 3: Reject ambiguous projection** when multiple eligible Black Friday campaigns include the same product; return a visible validation message instead of choosing an order implicitly.
- [x] **Step 4: Add the Black Friday PM-02 property state** in `PagesAndShelvesPanel.tsx`; do not expose the generic sala/new product exception controls for this section.
- [ ] **Step 5: Keep `HomeConnectionPanel` wired to current PM-02/PM-05 drafts** and check in the browser that selecting a Black Friday destination in PM-05 appears in the local storefront only after saving, reviewing, and applying that home revision locally.
- [x] **Step 6: Include the panel and safe-projection change** in the cohesive local feature commit recorded in Task 4; no separate intermediate commit was needed.

### Task 3: Render the responsive home section

**Files:**

- Create: `src/components/BlackFridayHomeSection.tsx`
- Modify: `src/components/HomepageContent.tsx`
- Modify: `src/home-redesign.css`
- Modify: `src/components/PagesAndShelvesPanel.tsx` for the composition preview
- Modify: `src/pages-shelves.css` for section-specific editor guidance

**Interfaces:**

- `BlackFridayHomeSection({ title, subtitle, products, demonstration }: { title: string; subtitle: string; products: Produto[]; demonstration: boolean })` returns `null` when the campaign has no eligible products.
- `HomepageContent` handles `section.id === "blackFriday"`, selects products by the active local campaign projection, and passes catalog products to the new component. Product data remains the current catalog projection; no campaign price is applied.
- The section reuses existing product-card behavior and price/installment display. Its demo notice must read `Prévia local · campanha demonstrativa; nenhuma oferta foi aplicada à loja.`

- [x] **Step 1: Create the component with existing Mobi card primitives** in `BlackFridayHomeSection.tsx`; use title/subtitle from PM-02 and no hero, timer, discount badge, or empty card.
- [x] **Step 2: Add a local eligibility selector** in `HomepageContent.tsx`: require enabled section, source `local-preview`, valid Brasília interval containing the current instant, and at least one catalog product. Omit scheduled, inactive, invalid, missing, or conflicting campaigns.
- [x] **Step 3: Render after the intro section and before weekly by default** through `HomepageSectionOrder`; preserve user reordering and section visibility from PM-02.
- [x] **Step 4: Style the section with Mobi green/deep green and gold accents** in `home-redesign.css`; match current home density and use the existing four-column desktop/two-column mobile product grid.
- [x] **Step 5: Update the PM-02 composition preview** to show the section with the same renderer, a local-demonstration label, and an explanatory empty state in the editor when no valid campaign is associated.
- [x] **Step 6: Include the renderer and responsive section** in the cohesive local feature commit recorded in Task 4; no separate intermediate commit was needed.

### Task 4: Inspect, verify, and hand off the preview

**Files:**

- Modify documentation only if observed behavior or a remaining dependency differs from the approved spec: `docs/PM01_PM10_CONFERENCIA_DOCUMENTAL.md` or the feature spec.

- [x] **Step 1: Before implementation, reopen the original engineering-reversal and panel documents** and open the current MadeiraMadeira Black Friday page to compare only the relevant behavior; record observation and any access barrier. Adapt it to Mobi; do not copy sale data.
- [x] **Step 2: Run `npm run build` and lint only the changed TypeScript scope.** Expected: build succeeds; changed files have no new lint errors. CSS was reviewed in the diff; this project has no CSS lint command in this plan.
- [ ] **Step 3: Manually inspect the local branch preview** at 1440 px and 390 px with no campaign, scheduled campaign, active simulation, invalid date, expired campaign, and canceled campaign after a new reviewed-and-applied local home revision. Confirm there are no duplicate products, price changes, fake countdowns, or horizontal overflow.
- [ ] **Step 4: Confirm `MOBI_LOCAL_HOME` remains disabled in production/Vercel** and that missing public campaign persistence omits the section publicly; do not edit Supabase, prices, or live campaign data.
- [ ] **Step 5: Provide the local preview and exact commit range, then stop for Rafael's version approval. Do not push or publish.**

## Execution Gate

This work is limited to a branch/local preview. Current project records say PM-05 campaigns and HomeConfiguration persistence are local, not a public campaign service. If read-only implementation discovery finds that even a truthful local preview cannot reuse the existing contracts, stop before database, remote policy, or production changes and report the concrete dependency for separate approval. A published Black Friday sale price remains out of scope until one authoritative price is confirmed across home, listing, detail, cart, and the existing Mobi 10x calculation.

## Manual Acceptance Checklist

- Legacy PM-02 drafts and applied home revisions reopen without losing section order, product selection, banners, or history.
- Black Friday is disabled by default and appears after the room shortcuts when enabled and associated with a valid PM-05 simulation.
- PM-02 edits title, support text, visibility, and order; PM-05 remains the single source for campaign product selection and dates.
- Inactive, invalid, expired, canceled, missing, or conflicting campaigns produce no public promotion. Empty campaigns do not leave a large blank area.
- The preview uses catalog prices and existing installment calculation; no simulated promotional price is presented as live.
- Desktop and mobile follow the approved layout and the local demo warning is visible.
- Production/Vercel has no newly enabled local adapter and no published campaign source.

## Execução registrada em 10/11/2026

- A engenharia reversa v1.1 e a especificação do painel v0.2 foram reabertas; a página pública Black Friday da MadeiraMadeira (`https://www.madeiramadeira.com.br/black-friday`) foi consultada. Ela apresenta ofertas, cupons, ofertas do dia e compra por ambiente, além de benefícios/conteúdo/FAQ. Isso orientou apenas a hierarquia e a descoberta por ambiente; a Mobi recebe uma seção curta na home, sem copiar promoção, texto comercial ou presença física.
- Implementado na branch local: seção PM-02 desativada por padrão, normalização aditiva dos rascunhos antigos, projeção local e mínima das campanhas PM-05 válidas, tratamento de conflitos, uso dos cartões/preços correntes da Mobi, carga dos produtos de campanhas futuras, prévia administrativa e atualização da elegibilidade no início/fim da vigência.
- A revisão de código não encontrou problemas concretos no agendamento encadeado de fronteiras da campanha.
- `npm run build` e lint direcionado passaram; `git diff --check` não encontrou erros de whitespace. Não foram executados testes automatizados, conforme a restrição desta etapa.
- A inspeção visual completa da campanha permanece pendente: `http://127.0.0.1:8080/` abriu, mas a home local exibiu falha ao carregar o catálogo; o painel administrativo exige autenticação. Portanto, a lista de cenários de desktop/mobile ainda não foi aceita visualmente.
- Nenhum dado, preço, banco remoto, Supabase, `main` ou produção foi alterado. O adaptador local continua condicionado a `MOBI_LOCAL_HOME=1` e desativado em produção/Vercel. A branch não deve ser publicada; apresentar a prévia ao Rafael e aguardar aprovação da versão.
- Os passos de migração manual de histórico antigo e revisão visual foram deixados pendentes porque dependem de abrir o painel autenticado com catálogo disponível. Uma demonstração do código e um build bem-sucedido não substituem essa validação.
