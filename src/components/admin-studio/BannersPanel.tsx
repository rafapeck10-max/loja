import { useEffect, useRef, useState } from "react";
import { BannerSlide } from "@/components/BannerSlide";
import {
  initialBannerData,
  isBannerVisible,
  MAX_BANNERS,
  moveBanner,
  removeBanner,
  toBannerSlide,
  validateBannerData,
  validateBannerFile,
  validateBannerImage,
  type BannerData,
  type BannerDraft,
} from "@/lib/banner-drafts";

interface BannersPanelProps {
  data: BannerData;
  onChange: (next: BannerData) => void;
}

function MediaField({
  label,
  value,
  optional,
  onApply,
}: {
  label: string;
  value: string;
  optional?: boolean;
  onApply: (source: string) => void;
}) {
  const [url, setUrl] = useState(value.startsWith("data:") ? "" : value);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setUrl(value.startsWith("data:") ? "" : value);
  }, [value]);
  const applyUrl = () => {
    const invalid = validateBannerImage(url);
    if (invalid || url.startsWith("data:")) {
      setError(invalid || "Para arquivo local, use o seletor de arquivo.");
      return;
    }
    setError("");
    onApply(url);
  };
  const upload = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      const invalid = validateBannerFile(file, header);
      if (invalid) throw new Error(invalid);
      const source = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("Não foi possível ler a imagem."));
        reader.onerror = () =>
          reject(new Error("Falha ao ler o arquivo. A arte anterior foi preservada."));
        reader.onabort = () =>
          reject(new Error("Leitura cancelada. A arte anterior foi preservada."));
        reader.readAsDataURL(file);
      });
      const sourceError = validateBannerImage(source);
      if (sourceError) throw new Error(sourceError);
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error("A imagem não pôde ser aberta. A arte anterior foi preservada."));
        image.src = source;
      });
      onApply(source);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao ler imagem.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <fieldset className="pm-card" style={{ minWidth: 0 }}>
      <legend>{label}</legend>
      <label className="pm-field">
        Arquivo local (PNG, JPEG ou WebP; até 1 MB)
        <input
          aria-label={`Arquivo ${label}`}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
      </label>
      <label className="pm-field">
        URL HTTPS da arte
        <input
          type="url"
          value={url}
          maxLength={2000}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
        />
      </label>
      <div className="pm-actions">
        <button type="button" className="pm-button" disabled={busy || !url} onClick={applyUrl}>
          Usar URL
        </button>
        {optional && value && (
          <button
            type="button"
            className="pm-button"
            disabled={busy}
            onClick={() => {
              setError("");
              onApply("");
            }}
          >
            Usar arte desktop
          </button>
        )}
      </div>
      <p className="pm-muted">
        {busy
          ? "Lendo arquivo no navegador…"
          : value.startsWith("data:")
            ? "Arquivo carregado neste rascunho local."
            : value
              ? "Referência por URL; confirme a disponibilidade na prévia."
              : "Sem arte própria para celular."}
      </p>
      {error && (
        <p role="alert" className="pm-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function BannersPanel({ data, onChange }: BannersPanelProps) {
  const [selectedId, setSelectedId] = useState(data.banners[0]?.id ?? "");
  const [error, setError] = useState("");
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const currentData = useRef(data);
  useEffect(() => {
    currentData.current = data;
  }, [data]);
  const banner = data.banners.find((item) => item.id === selectedId) ?? data.banners[0];
  const selectedIndex = banner ? data.banners.findIndex((item) => item.id === banner.id) : -1;
  const errors = validateBannerData(data);
  const change = (patch: Partial<BannerDraft>, id = banner?.id) => {
    if (!id) return;
    const next = {
      banners: currentData.current.banners.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    };
    currentData.current = next;
    onChange(next);
  };
  const applyMedia = (id: string, field: "image_url" | "mobile_image_url", source: string) => {
    const latest = currentData.current;
    if (!latest.banners.some((item) => item.id === id)) return;
    const next = {
      banners: latest.banners.map((item) => (item.id === id ? { ...item, [field]: source } : item)),
    };
    const storageError = validateBannerData(next).find((message) => message.includes("2 MB"));
    if (storageError) {
      setError(`${storageError} A arte anterior foi preservada.`);
      return;
    }
    setError("");
    currentData.current = next;
    onChange(next);
  };
  const add = () => {
    if (data.banners.length >= MAX_BANNERS) return;
    const id = `banner-${crypto.randomUUID()}`;
    const base = initialBannerData().banners[0];
    onChange({
      banners: [
        ...data.banners,
        { ...base, id, name: "Novo banner", position: data.banners.length + 1, active: false },
      ],
    });
    setSelectedId(id);
  };
  return (
    <section className="pm-panel">
      <header className="pm-heading">
        <div>
          <p className="pm-badge">PM-03 · Banners e mídias</p>
          <h1>Artes que apresentam a Mobi</h1>
          <p className="pm-muted">
            Biblioteca de rascunho local, iniciada com os padrões do site. A produção não é
            alterada.
          </p>
        </div>
        <button
          type="button"
          className="pm-button pm-primary"
          disabled={data.banners.length >= MAX_BANNERS}
          onClick={add}
        >
          Adicionar banner
        </button>
      </header>
      <p className="pm-note">
        Envio lê o arquivo somente neste navegador. Limite total de 2 MB para a biblioteca;
        publicação e armazenamento remoto dependem da operação autorizada.
      </p>
      <div className="pm-actions" role="group" aria-label="Selecionar banner">
        {data.banners.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`pm-button ${item.id === banner?.id ? "pm-primary" : ""}`}
            aria-pressed={item.id === banner?.id}
            onClick={() => {
              setSelectedId(item.id);
              setError("");
            }}
          >
            {item.position}. {item.name}
          </button>
        ))}
      </div>
      {!banner ? (
        <p className="pm-note">Biblioteca vazia. Adicione um banner para montar uma arte.</p>
      ) : (
        <>
          <div className="pm-heading">
            <h3>{banner.name}</h3>
            <div className="pm-actions">
              <button
                type="button"
                className="pm-button"
                disabled={selectedIndex <= 0}
                onClick={() => onChange(moveBanner(data, banner.id, -1))}
              >
                ↑ Anterior
              </button>
              <button
                type="button"
                className="pm-button"
                disabled={selectedIndex >= data.banners.length - 1}
                onClick={() => onChange(moveBanner(data, banner.id, 1))}
              >
                ↓ Próximo
              </button>
              <button
                type="button"
                className="pm-button"
                disabled={banner.active}
                title={
                  banner.active ? "Desative o banner antes de excluir a mídia em uso." : undefined
                }
                onClick={() => {
                  onChange(removeBanner(data, banner.id));
                  setError("");
                }}
              >
                Excluir desativado
              </button>
            </div>
          </div>
          <div className="pm-grid">
            <label className="pm-field">
              Nome interno
              <input
                value={banner.name}
                maxLength={80}
                onChange={(e) => change({ name: e.target.value })}
              />
            </label>
            <label className="pm-field">
              Texto alternativo
              <input
                value={banner.alt}
                maxLength={220}
                onChange={(e) => change({ alt: e.target.value })}
              />
            </label>
          </div>
          <div className="pm-actions">
            <label>
              <input
                type="checkbox"
                checked={banner.active}
                onChange={(e) => change({ active: e.target.checked })}
              />{" "}
              Ativo no rascunho
            </label>
            <label>
              <input
                type="checkbox"
                checked={banner.show_text}
                onChange={(e) => change({ show_text: e.target.checked })}
              />{" "}
              Exibir título e apoio sobre a arte
            </label>
          </div>
          <p className="pm-muted">
            Se a arte já contém textos, desmarque a sobreposição para evitar duplicação. Desative
            antes de excluir.
          </p>
          <div className="pm-grid" key={banner.id}>
            <MediaField
              label="Computador · 16:7"
              value={banner.image_url}
              onApply={(source) => applyMedia(banner.id, "image_url", source)}
            />
            <MediaField
              label="Celular · 1:1"
              value={banner.mobile_image_url}
              optional
              onApply={(source) => applyMedia(banner.id, "mobile_image_url", source)}
            />
          </div>
          {banner.show_text && (
            <div className="pm-grid">
              <label className="pm-field">
                Chamada pequena
                <input
                  value={banner.eyebrow}
                  maxLength={60}
                  onChange={(e) => change({ eyebrow: e.target.value })}
                />
              </label>
              <label className="pm-field">
                Título
                <input
                  value={banner.title}
                  maxLength={120}
                  onChange={(e) => change({ title: e.target.value })}
                />
              </label>
              <label className="pm-field">
                Apoio
                <textarea
                  value={banner.subtitle}
                  rows={2}
                  maxLength={220}
                  onChange={(e) => change({ subtitle: e.target.value })}
                />
              </label>
              <label className="pm-field">
                Texto do botão
                <input
                  value={banner.cta_label}
                  maxLength={50}
                  onChange={(e) => change({ cta_label: e.target.value })}
                />
              </label>
            </div>
          )}
          <label className="pm-field">
            Destino do banner ou botão
            <input
              value={banner.cta_href}
              maxLength={300}
              onChange={(e) => change({ cta_href: e.target.value })}
              placeholder="/?all=true#catalogo"
            />
          </label>
          <p className="pm-muted">
            Aceita rotas públicas existentes da Mobi, HTTPS em mobimb.com.br e o WhatsApp público da
            loja.
          </p>
          <details>
            <summary>Vigência opcional · horário de Brasília</summary>
            <div className="pm-grid">
              <label className="pm-field">
                Início
                <input
                  type="datetime-local"
                  value={banner.starts_at}
                  onInput={(e) => change({ starts_at: e.currentTarget.value })}
                />
              </label>
              <label className="pm-field">
                Fim
                <input
                  type="datetime-local"
                  value={banner.ends_at}
                  onInput={(e) => change({ ends_at: e.currentTarget.value })}
                />
              </label>
            </div>
            <p className="pm-muted">
              Sem datas, o estado ativo decide a exibição. A vigência é avaliada na prévia; não
              agenda uma publicação.
            </p>
          </details>
          <div className="pm-heading">
            <h3>Prévia da composição</h3>
            <div className="pm-tabs" role="group" aria-label="Formato da prévia">
              <button
                type="button"
                className="pm-button"
                aria-pressed={previewViewport === "desktop"}
                onClick={() => setPreviewViewport("desktop")}
              >
                Computador · 16:7
              </button>
              <button
                type="button"
                className="pm-button"
                aria-pressed={previewViewport === "mobile"}
                onClick={() => setPreviewViewport("mobile")}
              >
                Celular · 1:1
              </button>
            </div>
          </div>
          <p className="pm-note">
            {isBannerVisible(banner)
              ? "Visível agora no rascunho."
              : "Fora da exibição agora (estado ou vigência). A composição abaixo permite revisar a arte."}{" "}
            {previewViewport === "mobile" && !banner.mobile_image_url
              ? "Sem arte celular: a imagem larga é preservada inteira com faixas."
              : "A imagem preenche a proporção: as bordas podem ser cortadas. Confira produto e textos."}
          </p>
          <div
            style={{
              width: "100%",
              maxWidth: previewViewport === "mobile" ? 390 : 960,
              marginInline: "auto",
            }}
          >
            <BannerSlide {...toBannerSlide(banner)} previewViewport={previewViewport} />
          </div>
        </>
      )}
      {error && (
        <p className="pm-error" role="alert">
          {error}
        </p>
      )}
      {errors.length > 0 && (
        <div className="pm-error" role="alert">
          <strong>Revise o rascunho:</strong>
          <ul>
            {errors.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
