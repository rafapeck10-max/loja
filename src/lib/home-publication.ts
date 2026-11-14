import { MAX_WORKSPACE_BYTES, type StudioWorkspace } from "./admin-studio.ts";
import {
  normalizePageDraft,
  parsePublishedHomePage,
  publishedHomePageFromDraft,
  sourceVersion,
} from "./pages-shelves.ts";
import type { EditorProduct } from "./homepage-curation.ts";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export function shouldReadPublishedHomePage(configured: boolean, production: boolean) {
  if (configured) return true;
  if (production)
    throw new Error("A leitura server-side da seleção aplicada não está configurada.");
  return false;
}

export function isProductionDeployment(vercelEnv?: string, nodeEnv?: string) {
  return vercelEnv ? vercelEnv === "production" : nodeEnv === "production";
}

/** Reduce the private RPC response to the allowlisted storefront configuration. */
export function publishedHomePageFromWorkspace(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const workspace = (value as Record<string, unknown>).workspace;
  if (!workspace || typeof workspace !== "object" || Array.isArray(workspace)) return null;
  const published = (workspace as Record<string, unknown>).publishedHomePage;
  return published === undefined || published === null ? null : parsePublishedHomePage(published);
}

/** Apply only the latest reviewed pages revision, preserving its draft and all history. */
export function applyReviewedHomePage(
  workspace: StudioWorkspace,
  reviewedRevisionId: number,
  products: EditorProduct[],
  date: string,
): StudioWorkspace {
  if (!Number.isSafeInteger(reviewedRevisionId) || reviewedRevisionId < 1)
    throw new Error("Informe uma revisão válida da página inicial.");
  if (!Number.isFinite(Date.parse(date))) throw new Error("Data de aplicação inválida.");
  const reviewed = workspace.history.find((revision) => revision.id === reviewedRevisionId);
  const latestPages = [...workspace.history]
    .reverse()
    .find((revision) => revision.scope === "pages");
  const pageDraft = workspace.entries.pages;
  if (
    !reviewed ||
    reviewed.scope !== "pages" ||
    reviewed.status !== "reviewed" ||
    latestPages?.id !== reviewedRevisionId ||
    latestPages.status !== "reviewed" ||
    JSON.stringify(reviewed.after) !== JSON.stringify(pageDraft)
  )
    throw new Error("Aplique somente a versão mais recente e revisada de Páginas e vitrines.");

  const draft = normalizePageDraft(pageDraft, products);
  if (draft.baseVersion !== sourceVersion(products))
    throw new Error("O catálogo mudou desde a revisão. Reabra a página e revise novamente.");
  const publishedHomePage = publishedHomePageFromDraft(draft, products, reviewed.id, date);
  const next: StudioWorkspace = {
    ...workspace,
    revision: workspace.revision + 1,
    history: [
      ...workspace.history,
      {
        id: workspace.revision + 1,
        scope: "pages",
        date,
        status: "applied",
        before: clone(pageDraft),
        after: clone(pageDraft),
        appliedRevisionId: reviewed.id,
      },
    ],
    publishedHomePage,
  };
  if (new TextEncoder().encode(JSON.stringify(next)).byteLength > MAX_WORKSPACE_BYTES)
    throw new Error(
      "O histórico atingiu o limite. A configuração pública anterior foi preservada.",
    );
  return next;
}
