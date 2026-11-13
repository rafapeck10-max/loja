import { reopenHomeDraft } from "../../lib/home-configuration";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { validateStudioResource, shouldLoadWorkspace } from "../../lib/studio-validation";
import * as Dialog from "@radix-ui/react-dialog";
import { Save, FileCheck2, History, Download, X } from "lucide-react";
import {
  emptyWorkspace,
  parseWorkspace,
  reviseWorkspace,
  reviewRevision,
  restoreRevision,
  diffValues,
  describeDifferencePath,
  STUDIO_SCOPES,
  type StudioScope,
  type StudioWorkspace,
} from "../../lib/admin-studio";
import {
  initialPageDraft,
  normalizePageDraft,
  restorePageDraft,
  type PageDraft,
} from "../../lib/pages-shelves";
import { initialBannerData, validateBannerData, type BannerData } from "../../lib/banner-drafts";
import { initialCampaignData, validateCampaignData, type CampaignData } from "../../lib/campaigns";
import {
  initialEvolutionData,
  validateEvolutionData,
  type EvolutionData,
} from "../../lib/evolution";
import {
  initialNavigation,
  validateNavigation,
  initialContent,
  validateContent,
  initialService,
  validateService,
  initialProductDrafts,
  validateProductDrafts,
  type NavigationData,
  type ContentData,
  type ServiceData,
  type ProductDraftData,
} from "../../lib/operational-config";
import type { EditorProduct } from "../../lib/homepage-curation";
import { PagesAndShelvesPanel } from "../PagesAndShelvesPanel";
import type { HomepageBanner } from "../../lib/homepage-banners";
import { BannersPanel } from "./BannersPanel";
import { CampaignsPanel } from "./CampaignsPanel";
import { EvolutionPanel } from "./EvolutionPanel";
import { NavigationPanel, ContentPanel, ServicePanel, ProductDraftPanel } from "./OperationsPanels";
import "../../admin-studio.css";
import { HomeConnectionPanel } from "./HomeConnectionPanel";
import {
  applyReviewedHomeWeeklyCuration,
  getAdminWeeklyCurationPublication,
} from "../../lib/admin.functions";
import type { HomeTransport } from "../../lib/home-transport";
import type { AdminViewId } from "../../lib/admin-navigation";
import {
  validatedSnapshot,
  inspectLocalWorkspaceImport,
  type StudioWorkspaceTransport,
  type StudioWorkspaceCommand,
} from "../../lib/admin-studio-transport";

type StudioData = {
  pages: PageDraft;
  banners: BannerData;
  products: ProductDraftData;
  campaigns: CampaignData;
  navigation: NavigationData;
  content: ContentData;
  service: ServiceData;
  evolution: EvolutionData;
};
const titles: Record<StudioScope, string> = {
  pages: "Páginas e vitrines",
  banners: "Banners e mídias",
  products: "Produtos",
  campaigns: "Preços e campanhas",
  navigation: "Navegação e filtros",
  content: "Conteúdo e ajuda",
  service: "Entrega e atendimento",
  evolution: "Evolução do site",
};
const areaScopes: Partial<Record<AdminViewId, StudioScope>> = {
  vitrine: "pages",
  banners: "banners",
  produtos: "products",
  campaigns: "campaigns",
  navigation: "navigation",
  content: "content",
  service: "service",
  evolution: "evolution",
};
const scopeViews: Record<StudioScope, AdminViewId> = {
  pages: "vitrine",
  banners: "banners",
  products: "produtos",
  campaigns: "campaigns",
  navigation: "navigation",
  content: "content",
  service: "service",
  evolution: "evolution",
};
function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
const time = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
export function AdminStudio({
  area,
  password,
  products,
  ready = true,
  demonstration = false,
  onNavigate,
  productQuery = "",
  productFilter = "all",
  bannerSource,
  homeTransport,
  workspaceTransport,
}: {
  area: AdminViewId;
  password: string;
  products: EditorProduct[];
  ready?: boolean;
  demonstration?: boolean;
  homeTransport?: HomeTransport;
  workspaceTransport?: StudioWorkspaceTransport;
  onNavigate: (area: AdminViewId) => void;
  productQuery?: string;
  productFilter?: "all" | "published" | "awaiting" | "incomplete";
  bannerSource?: {
    status: "pending" | "error" | "success";
    data?: HomepageBanner[];
    available?: boolean;
  };
}) {
  const queryClient = useQueryClient();
  const storageKey = `mobi:admin-studio:v1:${demonstration ? "demo" : "admin"}`;
  const loadedKey = useRef<string | null>(null);
  const serverVersion = useRef(0);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [publishingWeekly, setPublishingWeekly] = useState(false);
  const remote = Boolean(workspaceTransport);
  const sourceKey = `${storageKey}:${remote ? "remote" : "local"}`;
  const weeklyPublication = useQuery({
    queryKey: ["admin-home-weekly-publication", password],
    queryFn: () => getAdminWeeklyCurationPublication({ data: { password } }),
    enabled: remote && !demonstration && area === "vitrine",
    retry: false,
  });
  const defaults = useMemo<StudioData>(
    () => ({
      pages: initialPageDraft(products),
      banners: initialBannerData(bannerSource?.data),
      products: initialProductDrafts(),
      campaigns: initialCampaignData(),
      navigation: initialNavigation(),
      content: initialContent(),
      service: initialService(),
      evolution: initialEvolutionData(),
    }),
    [products, bannerSource?.data],
  );
  const [workspace, setWorkspace] = useState<StudioWorkspace>(emptyWorkspace),
    [blockedWorkspace, setBlockedWorkspace] = useState<StudioWorkspace | null>(null),
    [blockedScopes, setBlockedScopes] = useState<StudioScope[]>([]),
    [edits, setEdits] = useState<Partial<StudioData>>({}),
    [message, setMessage] = useState(""),
    [loaded, setLoaded] = useState(false),
    [conflict, setConflict] = useState(false),
    [reviewOpen, setReviewOpen] = useState(false),
    [historyScope, setHistoryScope] = useState("all");
  const rawData = { ...defaults, ...workspace.entries, ...edits } as StudioData;
  const workingProducts = products.map((p) => rawData.products.changes[p.id]?.product ?? p);
  let editorPages = rawData.pages;
  try {
    editorPages = normalizePageDraft(rawData.pages, workingProducts);
  } catch {
    // Keep invalid saved data visible to the existing recovery flow without rewriting it.
  }
  const data = { ...rawData, pages: editorPages } as StudioData;
  const catalogWeeklyIds = useMemo(
    () =>
      [...products]
        .filter((product) => product.vitrine_semana_ordem != null)
        .sort(
          (a, b) =>
            (a.vitrine_semana_ordem ?? Number.MAX_SAFE_INTEGER) -
            (b.vitrine_semana_ordem ?? Number.MAX_SAFE_INTEGER),
        )
        .slice(0, 4)
        .map((product) => product.id),
    [products],
  );
  const productNames = Object.fromEntries(products.map((p) => [p.id, p.nome]));
  const humanDiff = (path: string) => describeDifferencePath(path, productNames);
  const scope = areaScopes[area];
  const managedArea = scope && (demonstration || scope !== "products");
  const dirtyScopes = STUDIO_SCOPES.filter(
    (k) => JSON.stringify(data[k]) !== JSON.stringify(workspace.entries[k] ?? defaults[k]),
  );
  const dirty = dirtyScopes.length > 0;
  const latestPagesRevision = [...workspace.history]
    .reverse()
    .find((revision) => revision.scope === "pages");
  const pageSelectionIsPublished =
    weeklyPublication.data?.available === true &&
    JSON.stringify(weeklyPublication.data.weeklyIds) ===
      JSON.stringify(data.pages.curation.weeklyIds);
  const canApplyWeekly =
    remote &&
    !demonstration &&
    area === "vitrine" &&
    loaded &&
    !conflict &&
    !dirtyScopes.includes("pages") &&
    latestPagesRevision?.status === "reviewed" &&
    weeklyPublication.data?.available === true &&
    weeklyPublication.data.canApplyInEnvironment &&
    !pageSelectionIsPublished &&
    !publishingWeekly;
  const weeklyPublicationMessage = demonstration
    ? "Amostra de apresentação: esta seleção não altera a loja."
    : !remote
      ? "Salve o rascunho remoto para revisar e aplicar a seleção na loja."
      : weeklyPublication.isPending
        ? "Consultando a seleção que está na loja…"
        : weeklyPublication.isError
          ? "Não foi possível consultar a seleção publicada. Tente atualizar o painel."
          : !weeklyPublication.data?.available
            ? "A instalação da publicação das escolhas está pendente. Você pode preparar e revisar a seleção; a loja continua igual."
            : !weeklyPublication.data.canApplyInEnvironment
              ? "Prévia protegida: confira aqui; a aplicação fica disponível somente na loja publicada."
              : pageSelectionIsPublished
                ? "Esta seleção já está aplicada na loja."
                : dirtyScopes.includes("pages")
                  ? "Salve e revise as escolhas para habilitar a aplicação na loja."
                  : latestPagesRevision?.status !== "reviewed"
                    ? "Salve e revise as escolhas para habilitar a aplicação na loja."
                    : "Esta revisão ainda não está na loja. Confira os produtos e aplique quando estiver pronta.";
  const validate = (key: StudioScope, value: unknown): string[] => {
    return validateStudioResource(key, value, products, data);
  };
  const load = useCallback(async () => {
    setLoaded(false);
    try {
      const snapshot = workspaceTransport
        ? validatedSnapshot(await workspaceTransport.read())
        : null;
      const raw = snapshot ? null : localStorage.getItem(storageKey);
      const next = snapshot?.workspace ?? (raw ? parseWorkspace(raw) : emptyWorkspace());
      serverVersion.current = snapshot?.serverVersion ?? 0;
      const invalid: StudioScope[] = [];
      const reasons: string[] = [];
      for (const [key, value] of Object.entries(next.entries)) {
        const errors = validateStudioResource(key as StudioScope, value, products, next.entries);
        if (errors.length) {
          invalid.push(key as StudioScope);
          reasons.push(`${titles[key as StudioScope]}: ${errors.join(" ")}`);
        }
      }
      if (invalid.length) {
        setBlockedWorkspace(next);
        setBlockedScopes(invalid);
        throw new Error(reasons.join(" "));
      }
      setBlockedWorkspace(null);
      setBlockedScopes([]);
      setWorkspace(next);
      setEdits({});
      setConflict(false);
      setMessage("");
      setLoaded(true);
    } catch (error) {
      setLoaded(true);
      setConflict(true);
      setMessage(
        `Não foi possível reabrir os rascunhos. ${error instanceof Error ? error.message : ""} A cópia salva foi preservada.`,
      );
    }
  }, [storageKey, products, workspaceTransport]);
  useEffect(() => {
    if (shouldLoadWorkspace(loadedKey.current, sourceKey, ready)) {
      loadedKey.current = sourceKey;
      void load();
    }
  }, [sourceKey, ready, load]);
  useEffect(() => {
    setReviewOpen(false);
    if (!conflict) setMessage("");
  }, [area, conflict]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);
  useEffect(() => {
    const changed = (e: StorageEvent) => {
      if (!remote && e.key === storageKey) {
        setConflict(true);
        setMessage(
          "Outra aba alterou os rascunhos. Sua edição foi preservada; exporte-a e reabra a versão salva para comparar.",
        );
      }
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [storageKey, remote]);
  const commitRemote = async (command: StudioWorkspaceCommand) => {
    if (!workspaceTransport) throw new Error("Transporte remoto indisponível.");
    if (busyRef.current) throw new Error("Aguarde o salvamento em andamento.");
    busyRef.current = true;
    setBusy(true);
    try {
      const next = validatedSnapshot(await workspaceTransport.change(command));
      serverVersion.current = next.serverVersion;
      setWorkspace(next.workspace);
      setConflict(false);
      return next.workspace;
    } catch (error) {
      setConflict(true);
      throw error;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const currentPersisted = () => {
    const raw = localStorage.getItem(storageKey);
    return raw ? parseWorkspace(raw) : emptyWorkspace();
  };
  const persist = (next: StudioWorkspace) => {
    localStorage.setItem(storageKey, JSON.stringify(next));
    setWorkspace(next);
    setConflict(false);
  };
  const save = async (key: StudioScope, value: unknown = data[key]) => {
    if (conflict || busyRef.current)
      throw new Error("Reabra a versão salva ou aguarde a operação em andamento antes de salvar.");
    const errors = validate(key, value);
    if (errors.length) throw new Error(errors.join(" "));
    if (!loaded) throw new Error("Aguarde a leitura do histórico.");
    const actual = remote ? workspace : currentPersisted();
    if (actual.revision !== workspace.revision) {
      setConflict(true);
      throw new Error(
        "Conflito entre abas. A versão mais recente foi preservada. Exporte sua edição antes de reabrir.",
      );
    }
    const next = remote
      ? await commitRemote({
          action: "save",
          expectedServerVersion: serverVersion.current,
          scope: key,
          value,
        })
      : reviseWorkspace(
          actual,
          workspace.revision,
          key,
          value,
          new Date().toISOString(),
          defaults[key],
        );
    if (!remote) persist(next);
    setEdits((e) => {
      const updated = { ...e };
      delete updated[key];
      return updated;
    });
    setMessage(
      `Rascunho de ${titles[key]} salvo ${remote ? "no servidor" : "neste navegador"} · versão ${next.revision}. Nada foi publicado.`,
    );
  };
  const attempt = async (fn: () => void | Promise<void>) => {
    try {
      await fn();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "A operação falhou. A edição foi preservada.",
      );
    }
  };
  const applyWeeklySelection = () =>
    attempt(async () => {
      if (!canApplyWeekly) throw new Error(weeklyPublicationMessage);
      setPublishingWeekly(true);
      try {
        const result = await applyReviewedHomeWeeklyCuration({
          data: { password, expectedWorkspaceVersion: serverVersion.current },
        });
        setMessage(
          `Escolhas da semana aplicadas na loja · revisão ${result.revisionId}. Preços e cadastros dos móveis foram preservados.`,
        );
        await weeklyPublication.refetch();
        await queryClient.invalidateQueries({ queryKey: ["produtos", "homepage"] });
      } finally {
        setPublishingWeekly(false);
      }
    });
  const change = <K extends StudioScope>(key: K, value: StudioData[K]) => {
    if (!loaded || busyRef.current) return;
    setEdits((current) => ({ ...current, [key]: value }));
  };
  const review = () =>
    attempt(async () => {
      if (!scope || dirtyScopes.includes(scope))
        throw new Error("Salve esta edição antes de concluir a revisão.");
      const errors = validate(scope, data[scope]);
      if (errors.length) throw new Error(errors.join(" "));
      const actual = remote ? workspace : currentPersisted();
      const next = remote
        ? await commitRemote({
            action: "review",
            expectedServerVersion: serverVersion.current,
            scope,
          })
        : reviewRevision(actual, workspace.revision, scope, new Date().toISOString());
      if (!remote) persist(next);
      setReviewOpen(false);
      setMessage(
        `Revisão ${next.revision} registrada ${remote ? "no servidor" : "neste navegador"}. Nada foi publicado.`,
      );
    });
  const restore = (id: number) =>
    attempt(async () => {
      if (dirty)
        throw new Error("Há alterações abertas. Salve ou exporte sua edição antes de restaurar.");
      const actual = remote ? workspace : currentPersisted();
      const original = actual.history.find((x) => x.id === id);
      if (!original) throw new Error("Versão ausente.");
      const errors = validate(original.scope, original.after);
      if (errors.length) throw new Error(`Restauração bloqueada: ${errors.join(" ")}`);
      const next = remote
        ? await commitRemote({
            action: "restore",
            expectedServerVersion: serverVersion.current,
            revisionId: id,
          })
        : restoreRevision(actual, workspace.revision, id, new Date().toISOString());
      if (!remote) persist(next);
      setEdits((e) => {
        const updated = { ...e };
        delete updated[original.scope];
        return updated;
      });
      setMessage(
        `Versão ${id} restaurada como novo rascunho ${next.revision}. O histórico foi preservado.`,
      );
    });
  const exportData = () => {
    let rawSavedWorkspace: string | null = null;
    try {
      rawSavedWorkspace = localStorage.getItem(storageKey);
    } catch {
      /* in-memory edits must remain exportable when storage is denied */
    }
    download(
      JSON.stringify(
        {
          format: "mobi-local-review",
          exportedAt: new Date().toISOString(),
          applicationPolicy: "ADAPTAR_MOBI",
          publishAuthorized: false,
          workspace,
          openEdits: edits,
          rawSavedWorkspace,
        },
        null,
        2,
      ),
      "mobi-rascunhos-locais.json",
    );
  };
  const recover = () =>
    attempt(async () => {
      if (!blockedWorkspace || dirty)
        throw new Error("Exporte e preserve a edição aberta antes de recuperar a fonte.");
      if (remote) {
        await commitRemote({
          action: "recover",
          expectedServerVersion: serverVersion.current,
          scopes: blockedScopes,
        });
        setBlockedWorkspace(null);
        setBlockedScopes([]);
        setMessage(
          "Fonte atual recuperada no servidor em novas revisões. O histórico anterior foi preservado.",
        );
        return;
      }
      let next = currentPersisted();
      if (next.revision !== blockedWorkspace.revision)
        throw new Error(
          "O histórico mudou em outra aba. Reabra para conferir a versão mais recente.",
        );
      for (const key of blockedScopes)
        next = reviseWorkspace(next, next.revision, key, defaults[key], new Date().toISOString());
      for (const [key, value] of Object.entries(next.entries)) {
        const errors = validateStudioResource(key as StudioScope, value, products, next.entries);
        if (errors.length) throw new Error(errors.join(" "));
      }
      persist(next);
      setEdits({});
      setBlockedWorkspace(null);
      setBlockedScopes([]);
      setMessage(
        "Fonte atual aberta em novas revisões locais. As versões anteriores continuam no histórico.",
      );
    });
  const selectedLast = scope
    ? [...workspace.history].reverse().find((x) => x.scope === scope)
    : undefined;
  const differences = scope ? diffValues(selectedLast?.before ?? defaults[scope], data[scope]) : [];
  if (!managedArea && area !== "history") return null;
  if (!ready)
    return (
      <div className="pm-note">
        Aguardando confirmação da fonte administrativa. Nenhum rascunho será aplicado sem base
        válida.
      </div>
    );
  return (
    <section className="pm-panel" aria-label="Estúdio da Mobi" aria-busy={busy}>
      {homeTransport &&
        ["vitrine", "banners", "navigation", "content", "service", "history"].includes(area) && (
          <HomeConnectionPanel
            transport={homeTransport}
            draft={data}
            products={products}
            editorDirty={dirty}
            compact
            onOpenApplied={(configuration) =>
              attempt(() => {
                const opened = reopenHomeDraft(configuration, products, data);
                setEdits((previous) => ({ ...previous, ...opened }));
                setMessage(
                  "Versão aplicada aberta nos editores. Salve os rascunhos para registrar as alterações; o histórico anterior foi preservado.",
                );
              })
            }
          />
        )}
      <div className="pm-studio-toolbar">
        <div>
          <span className="pm-badge">
            {busy ? "Salvando…" : remote ? "Rascunho no servidor" : "Rascunho local"}
          </span>{" "}
          <small>
            Versão {workspace.revision} · {dirty ? "há alterações abertas" : "edição em dia"} · loja
            preservada
          </small>
        </div>
        <div className="pm-actions">
          {scope && (
            <button
              className="pm-button pm-primary"
              disabled={busy || !loaded || !dirtyScopes.includes(scope) || conflict}
              onClick={() => attempt(() => save(scope))}
            >
              <Save size={15} /> Salvar rascunho
            </button>
          )}
          {scope && (
            <button
              className="pm-button"
              disabled={
                busy ||
                !loaded ||
                !workspace.entries[scope] ||
                dirtyScopes.includes(scope) ||
                conflict ||
                validate(scope, data[scope]).length > 0
              }
              onClick={() => setReviewOpen(true)}
            >
              <FileCheck2 size={15} /> Revisar alterações
            </button>
          )}
          <button className="pm-button" onClick={() => onNavigate("history")}>
            <History size={15} /> Histórico
          </button>
        </div>
      </div>
      {remote && scope && (
        <button
          className="pm-button"
          disabled={busy || !loaded}
          onClick={() =>
            attempt(() => {
              const local = inspectLocalWorkspaceImport(localStorage, storageKey);
              if (local.status !== "ready" || !Object.hasOwn(local.workspace.entries, scope))
                throw new Error("Não há rascunho local válido desta área para comparar.");
              if (
                dirty &&
                !window.confirm(
                  "Substituir somente a edição aberta pela cópia local para comparação?",
                )
              )
                return;
              change(scope, local.workspace.entries[scope] as never);
              setMessage(
                "Cópia local aberta para comparação. Confira as diferenças e salve para importar. O original permanece neste navegador.",
              );
            })
          }
        >
          Comparar rascunho deste navegador
        </button>
      )}
      {message && (
        <div className="pm-note" role="status">
          {message}
        </div>
      )}
      {conflict && (
        <div className="pm-actions">
          <button className="pm-button" onClick={exportData}>
            Exportar edição aberta
          </button>
          <button
            className="pm-button"
            disabled={busy}
            onClick={() => {
              if (
                !dirty ||
                window.confirm(
                  "Reabrir a versão salva descartará somente a edição ainda não salva. Já exportou sua cópia?",
                )
              )
                load();
            }}
          >
            Reabrir versão salva
          </button>
        </div>
      )}
      {blockedWorkspace && (
        <div className="pm-note">
          <p>
            Áreas que exigem recuperação: {blockedScopes.map((k) => titles[k]).join(", ")}. A
            recuperação abre os dados consultados como novas revisões; as versões anteriores
            permanecem no histórico.
          </p>
          <button className="pm-button" disabled={dirty} onClick={recover}>
            Abrir fonte atual como novo rascunho
          </button>
        </div>
      )}
      {area === "vitrine" && (
        <details className="pm-legacy-draft">
          <summary>Recuperar rascunho antigo de vitrines</summary>
          <p className="pm-muted">
            Importa uma cópia da edição anterior deste navegador para o rascunho atual. A cópia
            antiga é mantida.
          </p>
          <button
            className="pm-button"
            onClick={() =>
              attempt(() => {
                const raw = localStorage.getItem(
                  `mobi:pages-and-shelves:home:v1:${demonstration ? "demo" : "admin"}`,
                );
                if (!raw)
                  throw new Error(
                    "Nenhum rascunho antigo de vitrines foi encontrado neste navegador.",
                  );
                change("pages", restorePageDraft(raw, workingProducts));
                setMessage(
                  "Rascunho antigo aberto para comparação. Salve para criar uma revisão; a cópia anterior foi preservada.",
                );
              })
            }
          >
            Abrir rascunho antigo
          </button>
        </details>
      )}
      {area === "vitrine" && (
        <PagesAndShelvesPanel
          products={workingProducts}
          campaigns={data.campaigns}
          demonstration={demonstration}
          weeklyPublication={{
            available: weeklyPublication.data?.available ?? false,
            canApply: canApplyWeekly,
            weeklyIds: weeklyPublication.data?.available
              ? weeklyPublication.data.weeklyIds
              : catalogWeeklyIds,
            sourceRevision: weeklyPublication.data?.sourceRevision ?? null,
            applying: publishingWeekly,
            message: weeklyPublicationMessage,
            onApply: applyWeeklySelection,
          }}
          managed={{
            value: data.pages,
            saved: workspace.entries.pages as PageDraft | undefined,
            onChange: (value) => change("pages", value),
            onSave: (value) => save("pages", value),
          }}
        />
      )}
      {area === "banners" && bannerSource && (
        <div className="pm-note">
          {bannerSource.status === "pending"
            ? "Consultando os banners administrativos."
            : bannerSource.status === "error"
              ? "A consulta de banners falhou. O editor não está disponível até confirmar a fonte."
              : bannerSource.available
                ? "Base: banners administrativos consultados. Edição somente em rascunho."
                : "A estrutura remota de banners não está disponível. A base desta proposta local usa os padrões do código; não representa configuração publicada."}
        </div>
      )}
      {area === "banners" && (!bannerSource || bannerSource.status === "success") && (
        <BannersPanel data={data.banners} onChange={(value) => change("banners", value)} />
      )}
      {area === "produtos" && demonstration && (
        <ProductDraftPanel
          data={data.products}
          onChange={(value) => change("products", value)}
          products={products}
          query={productQuery}
          initialFilter={productFilter}
        />
      )}
      {area === "campaigns" && (
        <CampaignsPanel
          data={data.campaigns}
          onChange={(value) => change("campaigns", value)}
          products={workingProducts}
        />
      )}
      {area === "navigation" && (
        <NavigationPanel
          data={data.navigation}
          onChange={(value) => change("navigation", value)}
          products={workingProducts}
        />
      )}
      {area === "content" && (
        <ContentPanel
          data={data.content}
          products={workingProducts}
          onChange={(value) => change("content", value)}
        />
      )}
      {area === "service" && (
        <ServicePanel
          data={data.service}
          onChange={(value) => change("service", value)}
          products={workingProducts}
        />
      )}
      {area === "evolution" && (
        <EvolutionPanel
          data={data.evolution}
          onChange={(value) => change("evolution", value)}
          onNavigate={onNavigate}
        />
      )}
      {area === "history" && (
        <>
          <header className="pm-heading">
            <div>
              <h1>Histórico e versões</h1>
              <p>Compare alterações e recupere uma versão sem apagar as anteriores.</p>
            </div>
            <button className="pm-button" onClick={exportData}>
              <Download size={15} /> Exportar cópia
            </button>
          </header>
          <div className="pm-grid">
            <section className="pm-card">
              <h2>Onde os dados ficam</h2>
              <p>Contexto: {demonstration ? "demonstração local" : "sessão administrativa"}.</p>
              <p>
                Rascunhos e histórico: {remote ? "servidor" : "este navegador"} ·{" "}
                {workspace.history.length} versões.
              </p>
              <p className="pm-note">
                Nenhuma versão foi aplicada ao site por este estúdio. Uma URL de prévia não
                representa publicação.
              </p>
              <details>
                <summary>Acesso da equipe e persistência remota</summary>
                <p>
                  O admin existente utiliza senha de sessão verificada no servidor. Contas
                  individuais, papéis, auditoria remota e aplicação atômica de configurações ainda
                  exigem integração. Não há editor fictício de usuários ou permissões.
                </p>
              </details>
            </section>
            <section className="pm-card">
              <h2>Revisões por área</h2>
              <label className="pm-field">
                Filtrar histórico
                <select value={historyScope} onChange={(e) => setHistoryScope(e.target.value)}>
                  <option value="all">Todas as áreas</option>
                  {STUDIO_SCOPES.map((k) => (
                    <option key={k} value={k}>
                      {titles[k]}
                    </option>
                  ))}
                </select>
              </label>
              <p className="pm-muted">
                Restaurar cria uma nova revisão em rascunho. Preços e produtos atuais são conferidos
                antes de aceitar uma versão antiga.
              </p>
              <p>
                {dirtyScopes.length} áreas com edição aberta:{" "}
                {dirtyScopes.map((k) => titles[k]).join(", ") || "nenhuma"}.
              </p>
            </section>
          </div>
          <div className="pm-card pm-versions">
            {!workspace.history.length && (
              <p>Nenhuma revisão salva. Edite uma área e salve o primeiro rascunho.</p>
            )}
            {[...workspace.history]
              .reverse()
              .filter((r) => historyScope === "all" || r.scope === historyScope)
              .map((r) => (
                <details key={r.id}>
                  <summary>
                    Versão {r.id} · {titles[r.scope]} ·{" "}
                    {r.status === "reviewed" ? "Revisada" : "Rascunho"} · {time(r.date)}
                  </summary>
                  <p>
                    Armazenamento: {remote ? "servidor" : "navegador"} · horário de Brasília
                    {r.restoredFrom ? ` · restaurada da versão ${r.restoredFrom}` : ""}.
                  </p>
                  <ul className="pm-review-list">
                    {diffValues(r.before ?? defaults[r.scope], r.after).map((d, i) => (
                      <li key={i}>
                        <h3>{humanDiff(d.path)}</h3>
                        <div className="pm-grid">
                          <div>
                            <small>Antes</small>
                            <pre className="pm-diff-value">{JSON.stringify(d.before, null, 2)}</pre>
                          </div>
                          <div>
                            <small>Depois</small>
                            <pre className="pm-diff-value">{JSON.stringify(d.after, null, 2)}</pre>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="pm-actions">
                    <button
                      className="pm-button"
                      onClick={() => onNavigate(scopeViews[r.scope] ?? "overview")}
                    >
                      Abrir área
                    </button>
                    <button className="pm-button" onClick={() => restore(r.id)}>
                      Restaurar como novo rascunho
                    </button>
                  </div>
                </details>
              ))}
          </div>
        </>
      )}
      <Dialog.Root open={reviewOpen} onOpenChange={setReviewOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="aw-overlay" />
          <Dialog.Content className="pm-review-dialog pm-panel">
            <div className="pm-heading">
              <div>
                <Dialog.Title>Revisar {scope ? titles[scope] : ""}</Dialog.Title>
                <Dialog.Description>
                  Compare a revisão anterior com o rascunho salvo. Revisar registra o aceite local;
                  a loja permanece preservada.
                </Dialog.Description>
              </div>
              <Dialog.Close className="pm-button" aria-label="Fechar revisão">
                <X size={18} />
              </Dialog.Close>
            </div>
            <ul className="pm-review-list">
              {differences.map((d, i) => (
                <li key={i}>
                  <h3>{humanDiff(d.path)}</h3>
                  <div className="pm-grid">
                    <div>
                      <small>Antes · versão local anterior</small>
                      <pre className="pm-diff-value">{JSON.stringify(d.before, null, 2)}</pre>
                    </div>
                    <div>
                      <small>Depois · rascunho salvo</small>
                      <pre className="pm-diff-value">{JSON.stringify(d.after, null, 2)}</pre>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {!differences.length && (
              <p>Sem diferenças de configuração. A revisão confirma a versão local atual.</p>
            )}
            <div className="pm-actions">
              <button className="pm-button pm-primary" onClick={review}>
                Concluir revisão
              </button>
              <Dialog.Close className="pm-button">Voltar ao editor</Dialog.Close>
            </div>
            {message && (
              <p className="pm-note" role="status">
                {message}
              </p>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
