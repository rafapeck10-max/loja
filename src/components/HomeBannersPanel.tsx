import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, LoaderCircle, PanelsTopLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import {
  DEFAULT_HOMEPAGE_BANNERS,
  HOMEPAGE_BANNERS_QUERY_KEY,
  type HomepageBanner,
  type HomepageBannerInput,
} from "@/lib/homepage-banners";
import { listAdminHomepageBanners, saveHomepageBanners } from "@/lib/admin.functions";

const field =
  "mt-1 min-h-11 w-full rounded-lg border border-cacau/15 bg-white px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-gold";
const label = "mt-3 block text-[10px] font-semibold uppercase tracking-wide text-cacau";

export function HomeBannersPanel({ password }: { password: string }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<HomepageBanner[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPosition, setUploadingPosition] = useState<number | null>(null);
  const bannersQuery = useQuery({
    queryKey: ["admin-homepage-banners", password],
    queryFn: () => listAdminHomepageBanners({ data: { password } }),
  });
  const banners = draft ?? bannersQuery.data?.banners ?? DEFAULT_HOMEPAGE_BANNERS;
  const available = bannersQuery.data?.available === true;
  const activeCount = banners.filter((banner) => banner.active).length;

  const updateBanner = (position: number, changes: Partial<HomepageBannerInput>) => {
    setDraft((current) => {
      const next = current ?? bannersQuery.data?.banners ?? DEFAULT_HOMEPAGE_BANNERS;
      return next.map((banner) =>
        banner.position === position ? { ...banner, ...changes } : banner,
      );
    });
  };

  const uploadImage = async (position: number, file: File) => {
    setUploadingPosition(position);
    const toastId = toast.loading("Enviando imagem do banner...");
    try {
      const { supabase } = await import("@/lib/supabaseClient");
      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "jpg";
      const filePath = `banners/${Date.now()}_${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage
        .from("produtos-bucket")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("produtos-bucket").getPublicUrl(filePath);
      updateBanner(position, { image_url: data.publicUrl });
      toast.success("Imagem do banner enviada.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a imagem.", {
        id: toastId,
      });
    } finally {
      setUploadingPosition(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: HomepageBannerInput[] = banners.map((banner, index) => ({
        position: index + 1,
        image_url: banner.image_url,
        eyebrow: banner.eyebrow,
        title: banner.title,
        subtitle: banner.subtitle,
        cta_label: banner.cta_label,
        cta_href: banner.cta_href,
        active: banner.active,
      }));
      await saveHomepageBanners({ data: { password, banners: payload } });
      setDraft(null);
      toast.success("Banners da página inicial atualizados.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-homepage-banners", password] }),
        queryClient.invalidateQueries({ queryKey: HOMEPAGE_BANNERS_QUERY_KEY }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar os banners.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-deep-green/15 bg-white shadow-sm">
      <header className="flex items-start gap-3 bg-deep-green px-4 py-4 text-white sm:px-6">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <PanelsTopLeft className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-gold">
            Imagens e chamadas
          </p>
          <h2 className="mt-1 text-xl sm:text-2xl">Banners da página inicial</h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-white/75 sm:text-sm">
            Troque a imagem, os textos e o destino de cada banner. Desative os que não quiser
            exibir.
          </p>
        </div>
      </header>
      <div className="space-y-4 p-3 sm:p-5">
        {bannersQuery.data?.available === false && (
          <div className="rounded-xl border border-gold/35 bg-gold/10 p-3 text-xs leading-relaxed text-cacau">
            O editor está pronto, mas a migração ainda não está aplicada no banco. A vitrine mantém
            os banners atuais e o salvamento fica desativado.
          </div>
        )}
        {bannersQuery.isError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs leading-relaxed text-cacau">
            Não foi possível carregar os banners salvos. Atualize o painel e tente novamente.
          </div>
        )}
        <div className="grid gap-4 lg:grid-cols-3">
          {banners.map((banner) => (
            <article
              key={banner.position}
              className="min-w-0 rounded-xl border border-cacau/10 bg-sand/45 p-3 sm:p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-deep-green">Banner {banner.position}</h3>
                <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-medium text-cacau">
                  <input
                    type="checkbox"
                    checked={banner.active}
                    onChange={(event) =>
                      updateBanner(banner.position, { active: event.target.checked })
                    }
                    className="h-4 w-4 accent-deep-green"
                    aria-label={`Exibir banner ${banner.position}`}
                  />
                  Exibir
                </label>
              </div>
              <ImageWithFallback
                src={banner.image_url}
                alt={`Prévia do banner ${banner.position}`}
                className="aspect-[16/7] w-full rounded-lg border border-cacau/10 object-cover"
              />
              <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-cacau/15 bg-white px-3 text-xs font-bold uppercase tracking-wide text-cacau hover:border-gold">
                {uploadingPosition === banner.position ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                )}
                {uploadingPosition === banner.position ? "Enviando…" : "Trocar imagem"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={!available || uploadingPosition !== null}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void uploadImage(banner.position, file);
                  }}
                />
              </label>
              <label className={label}>
                URL da imagem
                <input
                  type="url"
                  value={banner.image_url}
                  onChange={(event) =>
                    updateBanner(banner.position, { image_url: event.target.value })
                  }
                  className={field}
                />
              </label>
              <label className={label}>
                Chamada pequena
                <input
                  value={banner.eyebrow}
                  maxLength={60}
                  onChange={(event) =>
                    updateBanner(banner.position, { eyebrow: event.target.value })
                  }
                  className={field}
                />
              </label>
              <label className={label}>
                Título
                <input
                  value={banner.title}
                  maxLength={120}
                  onChange={(event) => updateBanner(banner.position, { title: event.target.value })}
                  className={field}
                />
              </label>
              <label className={label}>
                Texto de apoio
                <textarea
                  value={banner.subtitle}
                  maxLength={220}
                  rows={2}
                  onChange={(event) =>
                    updateBanner(banner.position, { subtitle: event.target.value })
                  }
                  className={`${field} py-2.5`}
                />
              </label>
              <label className={label}>
                Texto do botão
                <input
                  value={banner.cta_label}
                  maxLength={50}
                  onChange={(event) =>
                    updateBanner(banner.position, { cta_label: event.target.value })
                  }
                  className={field}
                />
              </label>
              <label className={label}>
                Link do botão
                <input
                  value={banner.cta_href}
                  maxLength={300}
                  onChange={(event) =>
                    updateBanner(banner.position, { cta_href: event.target.value })
                  }
                  placeholder="/?all=true#catalogo"
                  className={field}
                />
              </label>
            </article>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t border-cacau/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-text-light">
            {activeCount} de {banners.length} banners ativos. A ordem dos cartões é a ordem do
            carrossel.
          </p>
          <button
            type="button"
            onClick={save}
            disabled={!available || saving || bannersQuery.isLoading || activeCount === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-deep-green px-5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-gold hover:text-deep-green disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Salvando…" : "Salvar banners"}
          </button>
        </div>
      </div>
    </section>
  );
}
