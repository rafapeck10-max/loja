import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
interface Draft {
  weeklyIds: string[];
  settings: Record<string, ProductSettings>;
}
type Section = "semana" | "novidade" | "descoberta" | "sala";
const DEFAULTS: ProductSettings = { novidade: "automatico", sala: "automatico", descoberta: true };
const MODES: HomeCurationMode[] = ["automatico", "incluir", "ocultar"];
const SECTIONS: { id: Section; title: string; explanation: string }[] = [
  {
    id: "semana",
    title: "Escolhas da semana",
    explanation: "Você escolhe até 4 produtos e a ordem em que aparecem na loja.",
  },
  {
    id: "novidade",
    title: "Novidades",
    explanation:
      "A loja escolhe até 4 produtos cadastrados nos últimos 30 dias. Você pode permitir outros produtos ou ocultar algum.",
  },
  {
    id: "descoberta",
    title: "Descubra algo novo",
    explanation:
      "A loja alterna até 4 produtos disponíveis, sem repetir os das outras seções. Você decide quais podem participar.",
  },
  {
    id: "sala",
    title: "Para sua sala",
    explanation:
      "A loja escolhe até 4 produtos da categoria Sala. Você pode permitir outros produtos ou ocultar algum.",
  },
];
const field =
  "min-h-11 w-full rounded-lg border border-cacau/20 bg-white px-3 text-sm text-cacau outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";
const secondary =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-cacau/20 bg-white px-3 text-sm font-semibold text-deep-green hover:bg-sand focus-visible:outline-2 focus-visible:outline-deep-green disabled:opacity-40";
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}
function isPublished(product: ProdutoAdmin) {
  return (
    Number(product.preco_atual) > 0 &&
    Number(product.preco_atacado) > 0 &&
    /^https?:\/\//i.test(product.url_imagem ?? "") &&
    !/indispon[ií]vel|esgotad[oa]|sem estoque|n[aã]o temos dispon[ií]vel/i.test(
      String(product.descricao ?? "") + " " + (product.cores ?? []).join(" "),
    )
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
function matchesSearch(product: ProdutoAdmin, search: string) {
  return normalize(
    [product.nome, product.sku, product.categoria].filter(Boolean).join(" "),
  ).includes(normalize(search));
}

export function HomeCurationPanel({ password, products }: Props) {
  const queryClient = useQueryClient();
  const [section, setSection] = useState<Section>("semana");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (pickerIndex != null) searchRef.current?.focus();
  }, [pickerIndex]);
  const status = useQuery({
    queryKey: ["admin-homepage-curation-status"],
    queryFn: () => homepageCurationStatus({ data: { password } }),
    select: (result) => result.available,
  });
  const saved = useMemo<Draft>(
    () => ({
      weeklyIds: products
        .filter((product) => product.vitrine_semana_ordem != null)
        .sort((a, b) => (a.vitrine_semana_ordem ?? 99) - (b.vitrine_semana_ordem ?? 99))
        .map((product) => product.id),
      settings: Object.fromEntries(products.map((product) => [product.id, settingsFor(product)])),
    }),
    [products],
  );
  const current = draft ?? saved;
  const dirty = useMemo(
    () => draft != null && JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved],
  );
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const candidates = useMemo(
    () =>
      products.filter(
        (product) =>
          isPublished(product) &&
          !current.weeklyIds.includes(product.id) &&
          matchesSearch(product, search),
      ),
    [products, current.weeklyIds, search],
  );
  const optionProducts = useMemo(
    () => products.filter((product) => matchesSearch(product, search)),
    [products, search],
  );
  const resultProducts = section === "semana" ? candidates : optionProducts;
  const lastPage = Math.max(1, Math.ceil(resultProducts.length / 6));
  const actualPage = Math.min(page, lastPage);
  const visible = resultProducts.slice((actualPage - 1) * 6, actualPage * 6);
  const changeSettings = (id: string, changes: Partial<ProductSettings>) =>
    setDraft((previous) => {
      const base = previous ?? saved;
      return {
        ...base,
        settings: { ...base.settings, [id]: { ...(base.settings[id] ?? DEFAULTS), ...changes } },
      };
    });
  const openPicker = (index: number) => {
    setPickerIndex(Math.min(index, current.weeklyIds.length));
    setSearch("");
    setPage(1);
  };
  const choose = (id: string) => {
    if (pickerIndex == null) return;
    setDraft((previous) => {
      const base = previous ?? saved;
      if (base.weeklyIds.includes(id) || pickerIndex > 3) return base;
      const next = [...base.weeklyIds];
      next[pickerIndex] = id;
      return { ...base, weeklyIds: next };
    });
    setPickerIndex(null);
    setSearch("");
    setPage(1);
  };
  const remove = (id: string) => {
    setDraft((previous) => {
      const base = previous ?? saved;
      return { ...base, weeklyIds: base.weeklyIds.filter((value) => value !== id) };
    });
    setPickerIndex(null);
  };
  const move = (index: number, target: number) =>
    setDraft((previous) => {
      const base = previous ?? saved;
      const next = [...base.weeklyIds];
      const [id] = next.splice(index, 1);
      next.splice(target, 0, id);
      return { ...base, weeklyIds: next };
    });
  const discard = () => {
    setDraft(null);
    setPickerIndex(null);
    setSearch("");
    setPage(1);
  };
  const save = async () => {
    setSaving(true);
    try {
      const settings: HomeProductCurationInput[] = products.map((product) => ({
        id: product.id,
        ...(current.settings[product.id] ?? settingsFor(product)),
      }));
      await saveHomepageCuration({ data: { password, weeklyIds: current.weeklyIds, settings } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-produtos"] }),
        queryClient.invalidateQueries({ queryKey: ["produtos"] }),
      ]);
      setDraft(null);
      setPickerIndex(null);
      toast.success("Alterações salvas. A vitrine da loja foi atualizada.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar. Suas alterações continuam aqui.",
      );
    } finally {
      setSaving(false);
    }
  };
  const productIdentity = (product: ProdutoAdmin) => (
    <div className="flex min-w-0 items-center gap-3">
      <ImageWithFallback
        src={product.url_imagem}
        alt={product.nome}
        className="h-16 w-16 shrink-0 rounded-lg border border-cacau/10 bg-white object-contain"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug text-cacau">{product.nome}</p>
        <p className="mt-1 text-xs text-cacau/75">
          {product.categoria || "Sem categoria"}
          {product.sku ? ` · ${product.sku}` : ""}
        </p>
        <p className="mt-1 text-sm font-semibold text-price-green">
          {Number(product.preco_atual) > 0 ? formatBRL(product.preco_atual) : "Sem preço de venda"}
        </p>
      </div>
    </div>
  );
  const searchAndPagination = (
    <>
      <label
        htmlFor="curation-product-search"
        className="mb-2 block text-sm font-semibold text-deep-green"
      >
        Buscar produto
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-cacau/60" />
        <input
          ref={searchRef}
          id="curation-product-search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Digite nome, referência ou categoria"
          className={`${field} pl-9`}
        />
      </div>
      <p className="mt-2 text-xs text-cacau/75">
        {resultProducts.length} produtos encontrados.{" "}
        {section === "semana"
          ? "Só aparecem produtos publicados e disponíveis."
          : "Produtos sem preço ou indisponíveis não aparecem na loja."}
      </p>
    </>
  );
  const pagination = lastPage > 1 && (
    <div className="mt-4 flex items-center justify-between gap-2">
      <button
        type="button"
        className={secondary}
        disabled={actualPage === 1}
        onClick={() => setPage(actualPage - 1)}
      >
        Anterior
      </button>
      <span className="text-xs text-cacau">
        Página {actualPage} de {lastPage}
      </span>
      <button
        type="button"
        className={secondary}
        disabled={actualPage === lastPage}
        onClick={() => setPage(actualPage + 1)}
      >
        Próxima
      </button>
    </div>
  );

  return (
    <section
      className="mb-6 overflow-hidden rounded-2xl border border-deep-green/15 bg-white shadow-sm"
      aria-label="Organizar a página inicial"
    >
      <header className="bg-deep-green px-4 py-5 text-white sm:px-6">
        <h2 className="flex items-center gap-2 text-xl sm:text-2xl">
          <Sparkles className="h-5 w-5 shrink-0 text-gold" />
          Vitrine da página inicial
        </h2>
        <p className="mt-2 text-sm text-white/85">
          Escolha a seção abaixo. Faça os ajustes e clique em “Salvar alterações”.
        </p>
      </header>
      <fieldset disabled={saving} className="min-w-0 space-y-5 p-4 sm:p-6">
        {status.data === false && (
          <p role="alert" className="rounded-lg bg-gold/15 p-3 text-sm text-cacau">
            Não é possível salvar a vitrine agora. A configuração do banco precisa ser concluída.
          </p>
        )}
        {status.isError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-cacau">
            Não foi possível conectar ao banco.{" "}
            <button type="button" onClick={() => status.refetch()} className="underline">
              Tentar novamente
            </button>
          </p>
        )}
        <Tabs
          value={section}
          onValueChange={(value) => {
            setSection(value as Section);
            setPickerIndex(null);
            setSearch("");
            setPage(1);
          }}
        >
          <TabsList
            aria-label="Seções da página inicial"
            className="grid h-auto w-full grid-cols-2 gap-2 bg-sand p-2 lg:grid-cols-4"
          >
            {SECTIONS.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="min-h-12 whitespace-normal px-2 py-2 text-sm text-cacau data-[state=active]:bg-deep-green data-[state=active]:text-white"
              >
                {item.title}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="semana" className="mt-5 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-deep-green">
                Escolhas da semana{" "}
                <span className="text-sm font-normal text-cacau">
                  ({current.weeklyIds.length}/4)
                </span>
              </h3>
              <p className="mt-1 text-sm text-cacau/80">
                {SECTIONS[0].explanation} Para substituir um item, use “Trocar produto”.
              </p>
            </div>
            <ol className="grid gap-3 lg:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => {
                const product = byId.get(current.weeklyIds[index]);
                return (
                  <li
                    key={index}
                    className="min-w-0 rounded-xl border border-cacau/15 bg-sand/35 p-4"
                  >
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-deep-green">
                      Posição {index + 1} na loja
                    </p>
                    {product ? (
                      <>
                        {productIdentity(product)}
                        {!isPublished(product) && (
                          <p className="mt-2 text-xs text-destructive">
                            Este produto não está pronto para a vitrine. Troque por um produto
                            publicado.
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap items-end gap-2">
                          <button
                            type="button"
                            className={secondary}
                            onClick={() => openPicker(index)}
                            aria-label={`Trocar produto da posição ${index + 1}`}
                          >
                            Trocar produto
                          </button>
                          <button
                            type="button"
                            className={`${secondary} text-destructive`}
                            onClick={() => remove(product.id)}
                            aria-label={`Remover ${product.nome} da semana`}
                          >
                            Remover
                          </button>
                          <label className="text-xs text-cacau">
                            Mover para
                            <select
                              value={index}
                              onChange={(event) => move(index, Number(event.target.value))}
                              aria-label={`Posição de ${product.nome}`}
                              className={`${field} mt-1 w-20`}
                            >
                              {current.weeklyIds.map((_, target) => (
                                <option key={target} value={target}>
                                  {target + 1}º
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="mb-3 text-sm text-cacau/75">Nenhum produto escolhido.</p>
                        <button
                          type="button"
                          className={secondary}
                          onClick={() => openPicker(index)}
                          aria-label={`Adicionar produto na posição ${index + 1}`}
                        >
                          Escolher produto
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            {pickerIndex != null && (
              <div
                id="weekly-product-picker"
                className="rounded-xl border-2 border-deep-green/30 bg-sand/40 p-4"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-deep-green">
                    Escolha um produto para a posição {pickerIndex + 1}
                  </h4>
                  <button type="button" className={secondary} onClick={() => setPickerIndex(null)}>
                    Cancelar troca
                  </button>
                </div>
                {searchAndPagination}
                <div className="mt-4 space-y-2">
                  {visible.map((product) => (
                    <div
                      key={product.id}
                      className="flex flex-col gap-3 rounded-lg border border-cacau/15 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      {productIdentity(product)}
                      <button
                        type="button"
                        className={`${secondary} shrink-0`}
                        onClick={() => choose(product.id)}
                        aria-label={`Escolher ${product.nome}`}
                      >
                        Escolher este
                      </button>
                    </div>
                  ))}
                </div>
                {!visible.length && (
                  <p className="mt-4 text-sm text-cacau">
                    Nenhum produto encontrado. Tente outro nome ou referência.
                  </p>
                )}
                {pagination}
              </div>
            )}
          </TabsContent>
          {SECTIONS.filter((item) => item.id !== "semana").map((item) => (
            <TabsContent key={item.id} value={item.id} className="mt-5">
              <h3 className="text-lg font-semibold text-deep-green">{item.title}</h3>
              <p className="mb-5 mt-1 max-w-3xl text-sm leading-relaxed text-cacau/80">
                {item.explanation}
              </p>
              {searchAndPagination}
              <div className="mt-4 space-y-3">
                {visible.map((product) => {
                  const value = current.settings[product.id] ?? settingsFor(product);
                  const mode = item.id === "sala" ? value.sala : value.novidade;
                  return (
                    <article
                      key={product.id}
                      className="grid min-w-0 gap-4 rounded-xl border border-cacau/15 bg-sand/25 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]"
                    >
                      <div>
                        {productIdentity(product)}
                        {!isPublished(product) && (
                          <p className="mt-2 text-xs text-cacau/75">
                            Não aparece na loja enquanto estiver sem preço, sem foto ou
                            indisponível.
                          </p>
                        )}
                      </div>
                      {item.id === "descoberta" ? (
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 self-center text-sm text-cacau">
                          <input
                            type="checkbox"
                            aria-label={`Permitir ${product.nome} em Descubra algo novo`}
                            checked={value.descoberta}
                            onChange={(event) =>
                              changeSettings(product.id, { descoberta: event.target.checked })
                            }
                            className="h-5 w-5 shrink-0 accent-deep-green"
                          />
                          Permitir nesta seleção
                        </label>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-cacau">
                            Como este produto participa?
                            <select
                              aria-label={`${item.title} de ${product.nome}`}
                              value={mode}
                              onChange={(event) =>
                                changeSettings(product.id, {
                                  [item.id === "sala" ? "sala" : "novidade"]: event.target
                                    .value as HomeCurationMode,
                                })
                              }
                              className={`${field} mt-2`}
                            >
                              <option value="automatico">Deixar a loja escolher</option>
                              <option value="incluir">Permitir nesta seção</option>
                              <option value="ocultar">Não mostrar nesta seção</option>
                            </select>
                          </label>
                          <p className="mt-2 text-xs leading-relaxed text-cacau/75">
                            {mode === "ocultar"
                              ? "Este produto fica fora desta seção."
                              : mode === "incluir"
                                ? "Pode participar mesmo fora da regra automática. A seção exibe até 4 produtos."
                                : item.id === "novidade"
                                  ? "Participa se foi cadastrado nos últimos 30 dias."
                                  : "Participa se pertence à categoria Sala."}
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              {!visible.length && (
                <p className="mt-4 text-sm text-cacau">
                  Nenhum produto encontrado. Tente outro nome ou referência.
                </p>
              )}
              {pagination}
            </TabsContent>
          ))}
        </Tabs>
        <footer className="flex flex-col gap-3 border-t border-cacau/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite">
            <p className="text-sm font-semibold text-deep-green">
              {saving
                ? "Salvando…"
                : dirty
                  ? "Você tem alterações não salvas"
                  : "Nenhuma alteração pendente"}
            </p>
            <p className="mt-1 text-xs text-cacau/75">
              Salva os ajustes de todas as seções. Trocar de aba não apaga suas escolhas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={discard}
              disabled={!dirty || saving}
              className={secondary}
            >
              Desfazer alterações
            </button>
            <button
              type="button"
              onClick={save}
              disabled={
                !dirty || saving || status.isLoading || status.data !== true || !products.length
              }
              className="min-h-11 rounded-lg bg-deep-green px-4 text-sm font-semibold text-white hover:bg-deep-green/90 focus-visible:outline-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </footer>
      </fieldset>
    </section>
  );
}
