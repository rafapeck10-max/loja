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

export function HomeConnectionPanel({
  transport,
  draft,
  products,
}: {
  transport: HomeTransport;
  draft: HomeDraftInput;
  products: EditorProduct[];
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
  async function run(command?: HomeTransportCommand) {
    setBusy(true);
    setMessage("");
    try {
      const r = command
        ? await transport.change(command, command.action === "save" ? draft : undefined)
        : await transport.read();
      setEnabled(r.enabled);
      setDocument(r.document ?? null);
      if (command?.action === "apply") void invalidateHomeRevision(queryClient);
      if (command)
        setMessage(
          command.action === "apply"
            ? "Revisão aplicada somente à home local. A loja publicada permanece preservada."
            : "Revisão salva no servidor local.",
        );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível salvar. A edição foi preservada.",
      );
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
  return (
    <section className="pm-home-connection" aria-label="Painel ligado à home local">
      <div className="pm-home-connection-heading">
        <div>
          <strong>Home em revisão</strong>
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
            Reabrir servidor
          </button>
          <button
            className="pm-button primary"
            disabled={busy || !document}
            onClick={() => void run({ action: "save", expected: document!.sequence })}
          >
            Salvar versão da home
          </button>
        </div>
      </div>
      <p className="pm-muted">
        Reúne Páginas, Banners, Navegação e Atendimento. Cadastros e campanhas simuladas não são
        aplicados.
      </p>
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
      {message && (
        <p role="status" className="pm-note">
          {message}
        </p>
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
                <Dialog.Title>Home · revisão {preview?.id}</Dialog.Title>
                <Dialog.Description>
                  Prévia local completa. Mesmo renderer da loja; produtos consultados na fonte desta
                  sessão.
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
                          await run({
                            action: "review",
                            expected: document!.sequence,
                            id: preview.id,
                          });
                          setPreview(null);
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
                        Aplicar somente na home local
                      </button>
                    )}
                  </div>
                </div>
                <p className="pm-muted px-4 py-2">
                  Prévia visual com links desativados. Confira a navegação na home local aplicada.
                </p>
                <HomeConfigurationProvider configuration={preview.config}>
                  <div inert className="store-shell pm-home-preview-store">
                    <Header />
                    <HomepageContent
                      configuration={preview.config}
                      sectionIds={previewIds}
                      products={previewProducts}
                    />
                    <Footer />
                  </div>
                </HomeConfigurationProvider>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
