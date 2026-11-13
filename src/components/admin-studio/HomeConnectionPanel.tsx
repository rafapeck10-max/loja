import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateHomeRevision } from "../../lib/home-revision-cache";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { HomeTransport, HomeTransportCommand } from "../../lib/home-transport";
import {
  homeProductSelections,
  publicHomeConfiguration,
  type HomeDocument,
  type HomeDraftInput,
  type HomeRevision,
} from "../../lib/home-configuration";
import { diffValues } from "../../lib/admin-studio";
import { toStorefrontProducts } from "../../lib/pages-shelves";
import type { EditorProduct } from "../../lib/homepage-curation";
import { HomeConfigurationProvider } from "../HomeConfigurationContext";
import { HomepageContent } from "../HomepageContent";
import { Header } from "../Header";
import { Footer } from "../Footer";
import { StoreCatalog } from "../StoreCatalog";
import { HelpContentPage } from "../HelpContentPage";

export function HomeConnectionPanel({
  transport,
  draft,
  products,
  onOpenApplied,
  editorDirty = false,
  compact = false,
}: {
  transport: HomeTransport;
  draft: HomeDraftInput;
  products: EditorProduct[];
  onOpenApplied?: (config: import("../../lib/home-configuration").HomeConfiguration) => void;
  editorDirty?: boolean;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const [document, setDocument] = useState<HomeDocument | null>(null),
    [enabled, setEnabled] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [preview, setPreview] = useState<HomeRevision | null>(null);
  useEffect(() => {
    let alive = true;
    setDocument(null);
    setEnabled(false);
    transport
      .read()
      .then((r) => {
        if (alive) {
          setEnabled(r.enabled);
          setDocument(r.document ?? null);
        }
      })
      .catch((e) => {
        if (alive) setMessage(String(e.message));
      });
    return () => {
      alive = false;
    };
  }, [transport]);
  async function run(command?: HomeTransportCommand): Promise<HomeDocument | null> {
    setBusy(true);
    setMessage("");
    try {
      const r = command
        ? await transport.change(command, command.action === "save" ? draft : undefined)
        : await transport.read();
      const nextDocument = r.document ?? null;
      setEnabled(r.enabled);
      setDocument(nextDocument);
      if (command?.action === "apply") void invalidateHomeRevision(queryClient);
      if (command?.action === "save" && nextDocument) {
        const created = nextDocument.revisions.find(
          (revision) => revision.id === nextDocument.sequence,
        );
        if (created) setPreview(created);
      }
      if (command)
        setMessage(
          command.action === "apply"
            ? "Revisão aplicada somente à prévia local. A loja publicada permanece preservada."
            : command.action === "review"
              ? "Revisão conferida. A versão continua local e ainda não altera a loja."
              : command.action === "restore"
                ? "Versão restaurada como rascunho local."
                : "Revisão da home criada. Confira a prévia antes de aplicar somente no ambiente local.",
        );
      return nextDocument;
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível salvar. A edição foi preservada.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  if (!enabled && !message) return null;
  const applied = document && publicHomeConfiguration(document);
  const previewProducts = toStorefrontProducts(products, draft.pages.curation);
  const previewSelections = homeProductSelections(previewProducts, preview?.config);
  const previewIds = Object.fromEntries(
    Object.entries(previewSelections).map(([key, ps]) => [key, ps.map((p) => p.id)]),
  ) as import("../../lib/home-configuration").HomeConfiguration["sectionIds"];
  const homeControls = (
    <>
      <div className="pm-home-connection-heading">
        <div>
          <strong>Prévia local da loja</strong>
          <p>
            Servidor local ·{" "}
            {document?.publishedId
              ? `revisão ${document.publishedId} aplicada na prévia`
              : "nenhuma revisão aplicada"}{" "}
            · sem publicação na loja
          </p>
        </div>
        <div className="pm-actions">
          <button className="pm-button" disabled={busy} onClick={() => void run()}>
            Atualizar estado local
          </button>
          <button
            className="pm-button primary"
            disabled={busy || !document}
            data-create-home-preview="true"
            onClick={() => void run({ action: "save", expected: document!.sequence })}
          >
            Criar revisão para prévia
          </button>
        </div>
      </div>
      <p className="pm-muted">
        Reúne Páginas, Banners, Navegação, Filtros, Conteúdo e Atendimento. Campanhas seguem locais;
        Black Friday usa somente a seleção válida do PM-05 e o preço atual do catálogo nesta prévia.
      </p>
      {applied && onOpenApplied && (
        <button
          className="pm-button"
          disabled={busy || editorDirty}
          onClick={() => onOpenApplied(applied.config)}
        >
          Editar versão aplicada
        </button>
      )}
      {document?.publishedId && (
        <a
          className="pm-button"
          href={transport.publicPreviewHref ?? "/"}
          target="_blank"
          rel="noreferrer"
        >
          Abrir home local aplicada
        </a>
      )}
      {!!document?.revisions.length && (
        <details>
          <summary>Versões da home ({document.revisions.length})</summary>
          <ol className="pm-home-revisions">
            {[...document.revisions].reverse().map((r) => (
              <li key={r.id}>
                <div>
                  <strong>Revisão {r.id}</strong>
                  <small>
                    {r.status === "draft"
                      ? "Rascunho"
                      : r.status === "reviewed"
                        ? "Revisada"
                        : "Aplicada na prévia"}
                    {r.restoredFrom ? ` · restaura ${r.restoredFrom}` : ""}
                  </small>
                </div>
                <div className="pm-actions">
                  <button className="pm-button" onClick={() => setPreview(r)}>
                    Ver home e diferenças
                  </button>
                  {r.status === "applied" && (
                    <button
                      className="pm-button"
                      disabled={busy}
                      onClick={() =>
                        void run({ action: "restore", expected: document.sequence, id: r.id })
                      }
                    >
                      Restaurar como rascunho
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </details>
      )}
    </>
  );
  return (
    <section className="pm-home-connection" aria-label="Painel ligado à home local">
      {compact ? (
        <details
          id={compact ? "pm-local-home-preview" : undefined}
          className="pm-home-connection-compact"
        >
          <summary>
            <strong>Prévia local da loja</strong>
            <small>
              {document?.publishedId
                ? `Revisão ${document.publishedId} aplicada · loja publicada preservada`
                : "Nenhuma versão aplicada · loja publicada preservada"}
            </small>
          </summary>
          {homeControls}
        </details>
      ) : (
        homeControls
      )}
      {message && (
        <p role="status" className="pm-note">
          {message}
        </p>
      )}
      <Dialog.Root
        open={!!preview}
        onOpenChange={(o) => {
          if (!o) setPreview(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="aw-overlay" />
          <Dialog.Content className="pm-home-review">
            <div className="pm-home-review-toolbar">
              <div>
                <Dialog.Title>Loja local · revisão {preview?.id}</Dialog.Title>
                <Dialog.Description>
                  Prévia local da home, do menu, dos filtros e das páginas revisadas. Produtos
                  consultados na fonte desta sessão.
                </Dialog.Description>
              </div>
              <Dialog.Close className="pm-button" aria-label="Fechar prévia completa">
                <X size={20} />
              </Dialog.Close>
            </div>
            {preview && (
              <>
                <div className="pm-home-differences">
                  <details>
                    <summary>
                      Diferenças para a revisão aplicada (
                      {diffValues(applied?.config ?? {}, preview.config).length})
                    </summary>
                    <pre>
                      {JSON.stringify(diffValues(applied?.config ?? {}, preview.config), null, 2)}
                    </pre>
                  </details>
                  <div className="pm-actions">
                    {preview.status === "draft" && (
                      <button
                        className="pm-button"
                        disabled={busy || !document}
                        onClick={async () => {
                          const nextDocument = await run({
                            action: "review",
                            expected: document!.sequence,
                            id: preview.id,
                          });
                          const reviewed = nextDocument?.revisions.find(
                            (revision) => revision.id === preview.id,
                          );
                          if (reviewed) setPreview(reviewed);
                        }}
                      >
                        Marcar como revisada
                      </button>
                    )}
                    {preview.status === "reviewed" && (
                      <button
                        className="pm-button primary"
                        disabled={busy || !document}
                        onClick={async () => {
                          await run({
                            action: "apply",
                            expected: document!.sequence,
                            id: preview.id,
                          });
                          setPreview(null);
                        }}
                      >
                        Aplicar somente na prévia local
                      </button>
                    )}
                  </div>
                </div>
                <p className="pm-muted px-4 py-2">
                  Prévia visual com links desativados. Confira a navegação na home local aplicada.
                </p>
                <HomeConfigurationProvider configuration={preview.config}>
                  <>
                    <div inert className="store-shell pm-home-preview-store">
                      <Header />
                      <HomepageContent
                        configuration={preview.config}
                        sectionIds={previewIds}
                        products={previewProducts}
                      />
                      <Footer />
                    </div>
                    <section className="mobi-wrap py-8" aria-labelledby="pm-navigation-preview">
                      <h2 id="pm-navigation-preview" className="mb-3 text-xl text-deep-green">
                        Prévia de categoria e filtros
                      </h2>
                      <div inert>
                        <StoreCatalog products={previewProducts} initialCategory="sofas" />
                      </div>
                    </section>
                    {!!preview.config.content?.pages.length && (
                      <section
                        className="border-t border-deep-green/15"
                        aria-labelledby="pm-content-preview"
                      >
                        <div className="mobi-wrap pt-6">
                          <h2 id="pm-content-preview" className="text-xl text-deep-green">
                            Conteúdo PM-07 nesta revisão
                          </h2>
                        </div>
                        {preview.config.content.pages.map((page) => (
                          <div inert key={page.id}>
                            <HelpContentPage page={page} />
                          </div>
                        ))}
                      </section>
                    )}
                  </>
                </HomeConfigurationProvider>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
