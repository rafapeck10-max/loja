import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, CalendarDays, Search, Sofa, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import {
  homepageCurationStatus,
  saveHomepageCuration,
  type HomeCurationMode,
  type HomeProductCurationInput,
  type ProdutoAdmin,
} from "@/lib/admin.functions";
import { formatBRL } from "@/lib/constants";

interface Props {
  password: string;
  products: ProdutoAdmin[];
}

interface ProductSettings {
  novidade: HomeCurationMode;
  sala: HomeCurationMode;
  descoberta: boolean;
}

const DEFAULTS: ProductSettings = {
  novidade: "automatico",
  sala: "automatico",
  descoberta: true,
};
const MODES: HomeCurationMode[] = ["automatico", "incluir", "ocultar"];
const MODE_LABEL: Record<HomeCurationMode, string> = {
  automatico: "Automático",
  incluir: "Sempre incluir",
  ocultar: "Ocultar",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function isPublished(product: ProdutoAdmin) {
  const unavailable = /indispon[ií]vel|esgotad[oa]|sem estoque|n[aã]o temos dispon[ií]vel/i;
  return (
    Number(product.preco_atual) > 0 &&
    Number(product.preco_atacado ?? 0) > 0 &&
    /^https?:\/\//i.test(product.url_imagem ?? "") &&
    !unavailable.test(String(product.descricao ?? "") + " " + (product.cores ?? []).join(" "))
  );
}

function settingsFor(product: ProdutoAdmin): ProductSettings {
  return {
    novidade: MODES.includes(product.vitrine_novidade as HomeCurationMode)
      ? (product.vitrine_novidade as HomeCurationMode)
      : DEFAULTS.novidade,
    sala: MODES.includes(product.vitrine_sala as HomeCurationMode)
      ? (product.vitrine_sala as HomeCurationMode)
      : DEFAULTS.sala,
    descoberta:
      typeof product.vitrine_descoberta === "boolean"
        ? product.vitrine_descoberta
        : DEFAULTS.descoberta,
  };
}

export function HomeCurationPanel({ password, products }: Props) {
  const queryClient = useQueryClient();
  const [weeklyIds, setWeeklyIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<Record<string, ProductSettings>>({});
  const [weeklySearch, setWeeklySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const status = useQuery({
    queryKey: ["admin-homepage-curation-status"],
    queryFn: () => homepageCurationStatus({ data: { password } }),
    select: (result) => result.available,
  });

  useEffect(() => {
    setWeeklyIds(
      products
        .filter((product) => product.vitrine_semana_ordem != null)
        .sort((a, b) => (a.vitrine_semana_ordem ?? 99) - (b.vitrine_semana_ordem ?? 99))
        .map((product) => product.id),
    );
    setSettings(Object.fromEntries(products.map((product) => [product.id, settingsFor(product)])));
  }, [products]);

  const eligible = useMemo(() => products.filter(isPublished), [products]);
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const weeklyCandidates = useMemo(() => {
    const term = normalize(weeklySearch);
    return eligible
      .filter(
        (product) =>
          !weeklyIds.includes(product.id) &&
          (!term ||
            normalize(
              [product.nome, product.sku, product.categoria].filter(Boolean).join(" "),
            ).includes(term)),
      )
      .slice(0, 8);
  }, [eligible, weeklyIds, weeklySearch]);
  const optionProducts = useMemo(() => {
    const term = normalize(productSearch);
    return products
      .filter(
        (product) =>
          !term ||
          normalize(
            [product.nome, product.sku, product.categoria].filter(Boolean).join(" "),
          ).includes(term),
      )
      .slice(0, term ? 20 : 6);
  }, [products, productSearch]);

  const setSetting = (id: string, field: keyof ProductSettings, value: string | boolean) => {
    setSettings((current) => ({
      ...current,
      [id]: { ...(current[id] ?? DEFAULTS), [field]: value },
    }));
  };
  const move = (index: number, direction: -1 | 1) => {
    setWeeklyIds((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  const save = async () => {
    setSaving(true);
    try {
      const productSettings: HomeProductCurationInput[] = products.map((product) => ({
        id: product.id,
        ...(settings[product.id] ?? DEFAULTS),
      }));
      await saveHomepageCuration({ data: { password, weeklyIds, settings: productSettings } });
      toast.success("Vitrine da página inicial atualizada.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-produtos"] }),
        queryClient.invalidateQueries({ queryKey: ["produtos"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a vitrine.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-deep-green/15 bg-white shadow-sm">
      <div className="flex items-start gap-3 bg-deep-green px-4 py-4 text-white sm:px-6">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-gold">
            Curadoria da loja
          </p>
          <h2 className="mt-1 text-xl sm:text-2xl">Vitrine da página inicial</h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-white/75 sm:text-sm">
            Organize as escolhas da semana e ajuste como os produtos aparecem nas outras seleções.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-3 sm:p-5">
        {status.data === false && (
          <div className="rounded-xl border border-gold/35 bg-gold/10 p-3 text-xs leading-relaxed text-cacau">
            As opções já estão preparadas no painel. Para salvar as escolhas, a migração da vitrine
            precisa ser aplicada ao banco; nenhuma alteração foi feita nele.
          </div>
        )}
        {status.isError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs leading-relaxed text-cacau">
            Não foi possível verificar a conexão com o banco. Atualize o painel antes de salvar.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-cacau/10 bg-sand/55 p-3 sm:p-4">
            <div className="mb-3 flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-gold-hover" />
              <div>
                <h3 className="font-semibold text-deep-green">Escolhas da semana</h3>
                <p className="mt-0.5 text-xs text-text-light">
                  Até quatro produtos publicados, na ordem escolhida.
                </p>
              </div>
            </div>

            <ol className="mb-3 space-y-2">
              {weeklyIds.map((id, index) => {
                const product = byId.get(id);
                if (!product) return null;
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-lg border border-cacau/10 bg-white p-2"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-deep-green text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <ImageWithFallback
                      src={product.url_imagem}
                      alt={`Imagem de ${product.nome}`}
                      className="h-10 w-10 shrink-0 rounded bg-sand object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-semibold text-cacau">
                        {product.nome}
                      </p>
                      <p className="text-[11px] text-price-green">
                        {formatBRL(product.preco_atual)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={!index}
                      aria-label={"Mover " + product.nome + " para cima"}
                      className="rounded p-1 text-cacau hover:bg-sand disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === weeklyIds.length - 1}
                      aria-label={"Mover " + product.nome + " para baixo"}
                      className="rounded p-1 text-cacau hover:bg-sand disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setWeeklyIds((current) => current.filter((value) => value !== id))
                      }
                      aria-label={"Remover " + product.nome}
                      className="rounded p-2 text-text-light hover:bg-destructive/10 hover:text-destructive"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ol>

            {weeklyIds.length < 4 && (
              <>
                <label className="sr-only" htmlFor="weekly-product-search">
                  Buscar produto para a semana
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
                  <input
                    id="weekly-product-search"
                    value={weeklySearch}
                    onChange={(event) => setWeeklySearch(event.target.value)}
                    placeholder="Buscar produto publicado"
                    className="min-h-11 w-full rounded-lg border border-cacau/15 bg-white pl-9 pr-3 text-sm outline-none focus:border-gold"
                  />
                </div>
                <div className="max-h-56 space-y-1 overflow-y-auto">
                  {weeklyCandidates.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setWeeklyIds((current) => [...current, product.id])}
                      className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-white"
                    >
                      <ImageWithFallback
                        src={product.url_imagem}
                        alt={`Imagem de ${product.nome}`}
                        className="h-9 w-9 shrink-0 rounded bg-white object-contain"
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-cacau">
                        {product.nome}
                      </span>
                      <span className="text-[11px] text-price-green">
                        {formatBRL(product.preco_atual)}
                      </span>
                      <span aria-hidden="true" className="px-1 text-lg text-deep-green">
                        +
                      </span>
                    </button>
                  ))}
                  {!weeklyCandidates.length && (
                    <p className="px-2 py-3 text-xs text-text-light">
                      Nenhum outro produto publicado encontrado.
                    </p>
                  )}
                </div>
              </>
            )}
            {weeklyIds.length === 4 && (
              <p className="rounded-lg bg-white px-3 py-2 text-xs text-text-light">
                Você já escolheu os quatro produtos da semana.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-cacau/10 bg-sand/55 p-3 sm:p-4">
            <div className="mb-3 flex items-start gap-2">
              <Sofa className="mt-0.5 h-5 w-5 shrink-0 text-gold-hover" />
              <div>
                <h3 className="font-semibold text-deep-green">Novidades, descoberta e sala</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-text-light">
                  Novidades usam os produtos dos últimos 30 dias. “Descubra algo novo” varia
                  diariamente. “Para sua sala” acompanha a categoria, com exceções configuráveis por
                  produto.
                </p>
              </div>
            </div>
            <label className="sr-only" htmlFor="curation-product-search">
              Buscar produto para ajustar a vitrine
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light" />
              <input
                id="curation-product-search"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Buscar por nome, SKU ou categoria"
                className="min-h-11 w-full rounded-lg border border-cacau/15 bg-white pl-9 pr-3 text-sm outline-none focus:border-gold"
              />
            </div>
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {optionProducts.map((product) => {
                const value = settings[product.id] ?? DEFAULTS;
                return (
                  <article
                    key={product.id}
                    className="rounded-lg border border-cacau/10 bg-white p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <ImageWithFallback
                        src={product.url_imagem}
                        alt={`Imagem de ${product.nome}`}
                        className="h-11 w-11 shrink-0 rounded bg-sand object-contain"
                      />
                      <div className="min-w-0">
                        <h4 className="line-clamp-2 text-xs font-semibold text-cacau">
                          {product.nome}
                        </h4>
                        <p className="truncate text-[10px] text-text-light">
                          {product.categoria || "Sem categoria"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["novidade", "sala"] as const).map((field) => (
                        <label key={field} className="text-[10px] font-semibold text-cacau">
                          {field === "novidade" ? "Novidades" : "Para sua sala"}
                          <select
                            value={value[field]}
                            onChange={(event) => setSetting(product.id, field, event.target.value)}
                            className="mt-1 min-h-10 w-full rounded-lg border border-cacau/15 bg-sand/30 px-2 text-xs font-normal outline-none focus:border-gold"
                          >
                            {MODES.map((mode) => (
                              <option key={mode} value={mode}>
                                {MODE_LABEL[mode]}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                    <label className="mt-2 flex min-h-9 cursor-pointer items-center gap-2 text-xs text-cacau">
                      <input
                        type="checkbox"
                        checked={value.descoberta}
                        onChange={(event) =>
                          setSetting(product.id, "descoberta", event.target.checked)
                        }
                        className="h-4 w-4 accent-deep-green"
                      />
                      Mostrar em “Descubra algo novo”
                    </label>
                  </article>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-text-light">
              {productSearch
                ? "Exibindo até 20 resultados."
                : "Mostrando os primeiros produtos; use a busca para encontrar os demais."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-cacau/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-text-light">
            As escolhas da semana são salvas na ordem mostrada.
          </p>
          <button
            type="button"
            onClick={save}
            disabled={saving || status.isLoading || status.data !== true || !products.length}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-deep-green px-5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-gold hover:text-deep-green disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {saving ? "Salvando…" : "Salvar vitrine"}
          </button>
        </div>
      </div>
    </section>
  );
}
