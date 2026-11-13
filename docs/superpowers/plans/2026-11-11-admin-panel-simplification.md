# Mobi Admin Panel Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Reorganize the Mobi admin panel around the store's daily work, with compact, intuitive layouts inside each area and all existing actions still accessible.

**Architecture:** Keep the current React admin data and draft flows. Add one shared navigation model that groups existing views, then simplify the overview and present supplier pricing as a focused catalog view. Reuse the existing local editors, campaign simulation, support content, and history; make their local or pending state explicit instead of adding integrations.

**Tech Stack:** React 19, TypeScript, TanStack Start/Router, Tailwind CSS, existing admin panels and local draft store.

**Spec:** [2026-11-11-admin-panel-simplification-design.md](../specs/2026-11-11-admin-panel-simplification-design.md)

## Global Constraints

- The main menu has no more than five routine tasks plus a secondary “Mais” group; every current destination remains accessible.
- Simplification removes repeated presentation and defers rare controls; it does not delete data, planned capacity, validations, stable IDs, drafts, or history.
- Supplier and supplier cost stay internal. Price difference is labeled gross and is not presented as profit or margin.
- The Mobi has no physical store. Do not add showroom, visit, pickup, freight promise, or unsupported availability claims.
- Distinguish authenticated catalog changes, local drafts, simulations, pending imports, and confirmed published state.
- Interactive controls retain a minimum 44 px target; mobile layouts must not force page-level horizontal scrolling.
- Do not change product data, prices, installments, inventory, migrations, or public content as part of this panel reorganization.
- Work only on the existing feature branch and preserve its current uncommitted and untracked work. Stage or commit only files explicitly changed for this panel task.
- Use a local or non-production branch preview. Do not publish or promote production until Rafael approves the reviewed version.
- Before the first code edit and again before delivery, reopen the original Mobi panel specification and MadeiraMadeira reverse-engineering document at the source path in AGENTS.md; record requirement, source, file, evidence, and pending status, and report if an original is unavailable.
- Do not add or run automated tests for this request. Validate with the relevant existing lint/build commands and a manual desktop/mobile preview.

## Review Focus

- Missing supplier, missing cost, missing site price, and price below cost: show the right supplier and state without implying real profit; manually inspect in the catalog task.
- Empty, loading, failed, or capped supplier/import query: keep the source status clear and never show an unconfirmed count; manually inspect in the overview/catalog tasks.
- Local content or campaign draft: saving a draft must not look like public application; manually inspect in the content and offers tasks.
- Unsaved edits, stale base, or restoration conflict: keep the edit recoverable and warn before replacing it; manually inspect in the history task.
- Narrow viewport and direct navigation from search: keep all groups and inner tabs reachable, controls tappable, and search routed to Products; manually inspect in the shell and preview tasks.

---

## File Map

- src/lib/admin-navigation.ts — one source of truth for stable admin view IDs, menu groups, group defaults, inner views, and visible titles.
- src/components/AdminWorkspace.tsx — desktop/mobile shell, grouped navigation, contextual inner tabs, breadcrumb, product search, and panel help.
- src/routes/admin.tsx — authenticated catalog queries and mutations, current view state, supplier grouping/filter state, import review, product editing, and the route to the supplier view.
- src/components/AdminOverview.tsx — operational queue, compact verified counts, source/refresh state, and direct product actions.
- src/components/admin/SupplierPricingPanel.tsx — compact supplier selector and pricing list built only from authenticated catalog records.
- src/components/admin-studio/AdminStudio.tsx — view-to-editor mapping, local draft state, save/review/history behavior, and removal of duplicate dashboard activity blocks.
- src/components/admin-studio/OperationsPanels.tsx — local category/filter, help/content, and online service editors.
- Existing focused editors — PagesAndShelvesPanel.tsx, BannersPanel.tsx, CampaignsPanel.tsx, EvolutionPanel.tsx, and HomeConnectionPanel.tsx; adjust only the layout needed by the approved spec.
- Existing admin styles — src/admin-overview.css, src/admin-density.css, and src/admin-studio.css; preserve Mobi tokens and keep styling localized.

## Navigation Contract

Use the existing view IDs and add only the supplier view:

- AdminViewId is the union of: overview, produtos, fornecedores, revisao, navigation, vitrine, banners, content, campaigns, service, history, and evolution.
- AdminNavView has id: AdminViewId and label: string.
- AdminNavGroup has id: start, catalog, storeContent, offers, service, or more; label: string; defaultView: AdminViewId; and views: readonly AdminNavView[].
- Export ADMIN_NAV_GROUPS as a readonly array of AdminNavGroup.
- Export getAdminNavGroup(view: AdminViewId): AdminNavGroup.
- Export getAdminViewLabel(view: AdminViewId): string.

The groups map to these views: Início → overview; Catálogo → produtos, fornecedores, revisao, navigation; Conteúdo da loja → vitrine, banners, content; Ofertas → campaigns; Atendimento → service; Mais → history, evolution. Clicking a group opens its default view; clicking an inner tab selects its existing view ID. Keep the current URL/auth behavior unchanged.

## Tasks

### Task 1: Group the navigation without breaking existing destinations

**Files:**
- Create: src/lib/admin-navigation.ts
- Modify: src/components/AdminWorkspace.tsx
- Modify: src/routes/admin.tsx
- Modify: src/components/admin-studio/AdminStudio.tsx
- Modify: src/admin-overview.css, src/admin-density.css

**Interfaces:**
- Produces: AdminViewId, AdminNavView, AdminNavGroup, ADMIN_NAV_GROUPS, getAdminNavGroup(view), and getAdminViewLabel(view) exactly as defined above.
- Consumes: existing workspaceTab and onNavigate flow, with workspaceTab typed as AdminViewId and fornecedores added as the only new view ID.

- [x] **Step 1: Define the shared navigation model** in src/lib/admin-navigation.ts; use the exact group and view mapping in the Navigation Contract.
- [x] **Step 2: Reopen and cross-check the two original Mobi documents** named in AGENTS.md before implementation; confirm the PM mapping, migration limits, price rules, and online-only operation against the approved spec.
- [x] **Step 3: Render grouped navigation and contextual inner tabs** in AdminWorkspace.tsx; keep the Mobi logo, store link, logout, mobile drawer, and product search. “Mais” expands to Histórico and Evolução instead of taking users to a blank parent screen.
- [x] **Step 4: Route group defaults and inner views** in routes/admin.tsx; keep all prior view IDs stable, send global product search to produtos, and display the active group and view in the breadcrumb.
- [x] **Step 5: Update help text and local-draft labels** so help describes the new groups and clearly says which edits stay local.
- [ ] **Step 6: Manually check every menu destination** on desktop and mobile, including the search path and return from product editing; confirm there is no unreachable old area and no blank “Mais” page.

### Task 2: Simplify Início and make supplier pricing a clear catalog workflow

**Files:**
- Modify: src/components/AdminOverview.tsx
- Modify: src/components/admin-studio/AdminStudio.tsx
- Modify: src/routes/admin.tsx
- Create: src/components/admin/SupplierPricingPanel.tsx
- Modify: src/admin-overview.css, src/admin-density.css

**Interfaces:**
- SupplierPricingSummary contains key: string, label: string, total: number, missingCost: number, missingSitePrice: number, and belowCost: number.
- SupplierPricingPanelProps contains summaries: readonly SupplierPricingSummary[], products: readonly ProdutoAdmin[] (already filtered to the selected supplier view), selectedSupplier: string, onSelectSupplier: (key: string) => void, and onEdit: (product: ProdutoAdmin) => void.
- The overview continues to consume the existing OverviewSource values and routes product actions through the existing callbacks. It does not add new data sources.

- [x] **Step 1: Consolidate the overview** into one actionable pending-products queue, a compact set of non-repeated confirmed counts, and one source/refresh line. Remove the duplicate catalog strip and the local activity cards from the overview surface; keep their underlying history and campaign data reachable in their own areas.
- [x] **Step 2: Keep the queue actionable** by showing the product, supplier when available, current pending reason, and existing edit action. Preserve error, loading, empty-catalog, empty-queue, and capped-query messages without inventing totals.
- [x] **Step 3: Extract the supplier pricing view** into SupplierPricingPanel.tsx. Render supplier summary selectors and a compact selected-supplier list with product, available reference/SKU, supplier cost, Mobi sale price, gross difference, current product status, and edit action. Use existing ProdutoAdmin, productStatus, grossPriceDifference, and money format rules; do not create a margin/profit calculation.
- [x] **Step 4: Wire the supplier view** to current catalog data and existing supplierFilter state in routes/admin.tsx. Do not create supplier IDs, mutate catalog records, or change the import/editor write flow. Keep the selected supplier when opening and closing an edit.
- [x] **Step 5: Place “Coletas para revisar” and “Categorias e filtros” under Catálogo** using the existing revisao import workflow and navigation local draft editor. Preserve explicit manual review and local-only status.
- [ ] **Step 6: Manually inspect representative catalog states**: product missing cost, missing sale price, price below cost, product with a supplier, product without a supplier, empty/failed catalog query, and review-import error. Confirm that no cost or supplier is displayed outside the admin panel.

### Task 3: Make the content area task-first and compact

**Files:**
- Modify: src/components/admin-studio/AdminStudio.tsx
- Modify: src/components/admin-studio/OperationsPanels.tsx
- Modify: src/components/admin-studio/BannersPanel.tsx
- Modify: src/components/PagesAndShelvesPanel.tsx
- Modify: src/components/admin-studio/HomeConnectionPanel.tsx
- Modify: src/admin-studio.css

**Interfaces:**
- The area continues to use view IDs vitrine, banners, and content, with existing StudioScope values pages, banners, and content.
- The common draft toolbar, validation, save/review callbacks, and shared preview contracts remain the only persistence/preview interfaces; no new remote API is introduced.

- [x] **Step 1: Organize Páginas e vitrines** around selecting the page/section, editing its supported fields, ordering/visibility, and seeing the preview. Label fixed regions as fixed rather than showing false editing controls.
- [x] **Step 2: Tighten Banners e mídias** around asset selection, desktop/mobile format, alt text, target, ordering, and preview. Put optional date/time and rarely used technical limits in the existing disclosure pattern.
- [x] **Step 3: Simplify Ajuda e conteúdo** around selecting an existing page/article, editing, and preview. Keep advanced structure controls adjacent to the selected content instead of adding independent quick-action blocks.
- [x] **Step 4: Keep connection, draft, and source status visible but compact**; ensure an open applied local version can still be reviewed and saved as a new draft, with the previous history preserved.
- [ ] **Step 5: Manually inspect desktop and narrow-screen editing** for a page, banner, and help article. Confirm previews match current local draft state, fixed sections are not editable, and no label implies public application.

### Task 4: Simplify Ofertas, Atendimento, Histórico, and Evolução

**Files:**
- Modify: src/components/admin-studio/CampaignsPanel.tsx
- Modify: src/components/admin-studio/OperationsPanels.tsx
- Modify: src/components/admin-studio/AdminStudio.tsx
- Modify: src/components/admin-studio/EvolutionPanel.tsx
- Modify: src/admin-studio.css

**Interfaces:**
- Campaigns remain the existing local CampaignData workflow and campaignState simulation; product selection and current price calculation contracts do not change.
- Atendimento remains the existing ServiceData editor and WhatsApp link preview.
- History and evolution retain their existing StudioWorkspace, restoreRevision, diffValues, export, and requirement-status contracts.

- [x] **Step 1: Order the campaign editor** as campaign name/period, participating products, proposed prices, value review, and local simulation. Keep optional media/section association and technical details collapsed. Make the final available action say review/save simulation, not publish/schedule.
- [x] **Step 2: Keep Mobi payment and price semantics**: display existing real reference only when present, use existing Pix/current price and exact 10x calculation, and do not change commercial data or rules.
- [x] **Step 3: Refocus Atendimento** on online-service messages and WhatsApp consultation; retain explicit confirmation of freight, period, and availability where no connected source exists. Remove any physical-store implication.
- [x] **Step 4: Keep Histórico and Evolução under Mais**. Preserve local revision comparison, export, conflict detection, recovery, and restore; keep the 141 requirement statuses distinct across reference, Mobi observation, implementation, and activation.
- [ ] **Step 5: Manually inspect** a saved campaign draft, a WhatsApp support preview, a history restore with an open edit, and an evolution requirement status. Confirm no draft is described as public or migration as complete.

### Task 5: Review the integrated panel and prepare the preview

**Files:**
- Modify only the affected navigation, panel, and admin style files from Tasks 1–4.
- No database, migration, product, storefront, or production deployment files.

**Interfaces:**
- All task outputs are joined through AdminViewId and the existing AdminStudio scope/history state; no new backend or persistence contract.

- [x] **Step 1: Review the changed diff** and confirm only the panel files approved by this plan are in scope; leave all pre-existing branch changes untouched.
- [ ] **Step 2: Run the project lint command** with npm run lint; expected result: no new lint errors from the panel changes. Record pre-existing unrelated errors separately.
- [x] **Step 3: Build the local preview** with npm run build; expected result: the production bundle compiles without changing production state. Do not run automated tests for this request.
- [ ] **Step 4: Open the authenticated local or non-production preview** using only non-production configuration; if the admin cannot load without credentials or Supabase configuration, stop and report the exact preview blocker without connecting to production or inventing data.
- [ ] **Step 5: Capture and inspect desktop and mobile screenshots** of Início, Produtos, Fornecedores e preços, Conteúdo da loja, Ofertas, Atendimento, and Mais. Fix visible spacing, alignment, active-tab, overflow, and touch-target issues before presenting the preview.
- [ ] **Step 6: Present the preview link/screenshots, implementation summary, validation results, and known integration limits. Wait for Rafael’s approval of that exact version before any production publication or promotion.**
- [x] **Step 7: Reopen and cross-check the two original Mobi documents again**; report any requirement that remains unimplemented or dependent on migration separately from completed UI work.

## Handoff Decision

This work touches one shared navigation contract and several existing editor flows, so a single-session implementation is the recommended method; it reduces navigation-state mismatches and avoids conflicting edits in the already modified admin files. The plan is ready for review. Do not begin implementation until the user confirms the plan and selects an execution method.
