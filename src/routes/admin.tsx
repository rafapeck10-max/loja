import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Filter,
  ImagePlus,
  Lock,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PRODUCT_CATEGORY_OPTIONS } from "@/lib/constants";
import {
  checkAdminPassword,
  deleteProduto,
  listAdminProdutos,
  upsertProduto,
  type ProdutoInput,
  type ProdutoAdmin,
} from "@/lib/admin.functions";
import { formatBRL } from "@/lib/constants";

const STORAGE_KEY = "mobili_admin_pwd";

function normalizeFilterText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

// These are the names stored in the catalog. Keep the current value in the
// select as well so older/custom supplier names are never cleared on edit.
const SUPPLIER_OPTIONS = [
  "Alpoim Distribuidora",
  "Tropical Móveis",
  "SR Móveis Atacadão",
  "Outro",
] as const;

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin | Mobi" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (!saved) {
      setChecking(false);
      return;
    }
    checkAdminPassword({ data: { password: saved } })
      .then(() => setPassword(saved))
      .catch(() => sessionStorage.removeItem(STORAGE_KEY))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="mx-auto max-w-md px-[5%] py-20 text-center text-text-light">Verificando…</div>
    );
  }

  return password ? (
    <AdminDashboard
      password={password}
      onLogout={() => {
        sessionStorage.removeItem(STORAGE_KEY);
        setPassword(null);
      }}
    />
  ) : (
    <LoginForm
      onSuccess={(pwd) => {
        sessionStorage.setItem(STORAGE_KEY, pwd);
        setPassword(pwd);
      }}
    />
  );
}

function LoginForm({ onSuccess }: { onSuccess: (pwd: string) => void }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    setLoading(true);
    try {
      await checkAdminPassword({ data: { password: value } });
      onSuccess(value);
      toast.success("Bem-vindo(a) ao painel Mobi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Senha incorreta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <div className="rounded-3xl border border-cacau/10 bg-white p-6 shadow-premium sm:p-9">
        <div className="mb-6 flex items-center gap-3 text-deep-green">
          <Lock className="h-5 w-5 text-gold" />
          <h1 className="text-2xl">Painel Mobi</h1>
        </div>
        <p className="mb-6 text-sm text-text-light">
          Área restrita para cadastrar e atualizar produtos.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cacau">
              Senha administrativa
            </label>
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              className="min-h-12 w-full rounded-xl border border-cacau/15 bg-white px-4 py-3 font-sans text-base text-cacau outline-none transition-colors focus:border-gold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-xl bg-deep-green py-3 text-sm font-bold text-sand transition-colors hover:bg-gold hover:text-deep-green disabled:opacity-60"
          >
            {loading ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

const EMPTY: ProdutoInput = {
  id: "",
  nome: "",
  slug: "",
  preco_novo: 0,
  imagem_url: "",
  categoria: "",
  ordem: 0,
  fornecedor: "",
  referencia: "",
  preco_fornecedor: null,
  link_fornecedor: "",
  fonte_preco: "",
  vendas_ultimos_30_dias: 0,
  descricao: "",
  medidas: "",
  cores: [],
};

type ProductStatus = "published" | "awaiting" | "incomplete";

const STATUS_LABELS: Record<ProductStatus, string> = {
  published: "Publicado",
  awaiting: "Aguardando precificação",
  incomplete: "Dados incompletos",
};

function productStatus(product: ProdutoAdmin): ProductStatus {
  const sitePrice = Number(product.preco_atual ?? 0);
  const supplierPrice = Number(product.preco_atacado ?? 0);
  const hasImage = /^https?:\/\//i.test(product.url_imagem ?? "");
  if (sitePrice > 0 && hasImage && product.fornecedor && supplierPrice > 0) return "published";
  if (supplierPrice > 0 && sitePrice <= 0) return "awaiting";
  return "incomplete";
}

function sourceUrl(product: ProdutoAdmin): string | null {
  return product.url_fornecedor || product.fonte_preco || null;
}

function sourceName(product: ProdutoAdmin): string {
  if (product.fornecedor) return product.fornecedor;
  const url = sourceUrl(product);
  if (!url) return "Sem fornecedor";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Fonte cadastrada";
  }
}

function moneyOrDash(value: number | null | undefined): string {
  return value == null || Number(value) <= 0 ? "—" : formatBRL(Number(value));
}

function marginLabel(product: ProdutoAdmin): string {
  const cost = Number(product.preco_atacado ?? 0);
  const price = Number(product.preco_atual ?? 0);
  if (cost <= 0 || price <= 0) return "—";
  return formatBRL(price - cost);
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const colors: Record<ProductStatus, string> = {
    published: "border-price-green/25 bg-price-green/10 text-price-green",
    awaiting: "border-gold/40 bg-gold/15 text-cacau",
    incomplete: "border-destructive/25 bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-tight ${colors[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function AdminDashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const {
    data: produtos = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-produtos"],
    queryFn: () => listAdminProdutos({ data: { password } }),
  });
  const [editing, setEditing] = useState<ProdutoInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ProductStatus>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 32;

  const suppliers = useMemo(
    () =>
      Array.from(
        new Set(produtos.map((product) => product.fornecedor).filter(Boolean) as string[]),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [produtos],
  );
  const categories = useMemo(
    () =>
      Array.from(new Set(produtos.map((product) => product.categoria).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [produtos],
  );
  const filteredProdutos = useMemo(() => {
    const normalizedSearch = normalizeFilterText(search);
    const normalizedSupplier = normalizeFilterText(supplierFilter);
    const normalizedCategory = normalizeFilterText(categoryFilter);
    return produtos.filter((product) => {
      const searchableText = normalizeFilterText(
        [
          product.nome,
          product.slug,
          product.sku,
          product.fornecedor,
          product.categoria,
          product.fonte_preco,
          product.url_fornecedor,
          product.descricao,
          product.medidas,
          ...(product.cores ?? []),
        ]
          .filter(Boolean)
          .join(" "),
      );
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesSupplier =
        supplierFilter === "all" || normalizeFilterText(product.fornecedor) === normalizedSupplier;
      const matchesCategory =
        categoryFilter === "all" || normalizeFilterText(product.categoria) === normalizedCategory;
      const matchesStatus = statusFilter === "all" || productStatus(product) === statusFilter;
      return matchesSearch && matchesSupplier && matchesCategory && matchesStatus;
    });
  }, [produtos, search, supplierFilter, categoryFilter, statusFilter]);
  const totals = useMemo(
    () =>
      produtos.reduce(
        (acc, product) => {
          acc[productStatus(product)] += 1;
          return acc;
        },
        { published: 0, awaiting: 0, incomplete: 0 } as Record<ProductStatus, number>,
      ),
    [produtos],
  );
  const totalPages = Math.max(1, Math.ceil(filteredProdutos.length / perPage));
  const visibleProdutos = filteredProdutos.slice((page - 1) * perPage, page * perPage);
  const activeFilterCount = Number(supplierFilter !== "all") + Number(categoryFilter !== "all");

  useEffect(() => {
    setPage(1);
  }, [search, supplierFilter, categoryFilter, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin-produtos"] });
    router.invalidate();
  };

  const startNew = () => setEditing({ ...EMPTY });
  const startEdit = (p: ProdutoAdmin) =>
    setEditing({
      id: p.id,
      nome: p.nome,
      slug: p.slug,
      preco_novo: p.preco_atual,
      imagem_url: p.url_imagem,
      categoria: p.categoria,
      ordem: p.ordem ?? 0,
      fornecedor: p.fornecedor ?? "",
      referencia: p.sku ?? "",
      preco_fornecedor: p.preco_atacado ?? null,
      link_fornecedor: p.url_fornecedor ?? p.fonte_preco ?? "",
      fonte_preco: p.fonte_preco ?? p.url_fornecedor ?? "",
      vendas_ultimos_30_dias: p.vendas_ultimos_30_dias ?? 0,
      descricao: p.descricao ?? "",
      medidas: p.medidas ?? "",
      cores: p.cores ?? [],
    });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await upsertProduto({ data: { password, produto: editing } });
      toast.success("Produto salvo com sucesso.");
      setEditing(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, nome: string) => {
    if (!confirm(`Remover "${nome}" da vitrine?`)) return;
    try {
      await deleteProduto({ data: { password, id } });
      toast.success("Produto removido.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSupplierFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-14 pt-6 sm:px-[5%] sm:py-10">
      <div className="mb-7 flex flex-col gap-5 rounded-3xl bg-deep-green px-5 py-6 text-sand shadow-premium sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-8">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[2px] text-gold">
            Catálogo interno
          </p>
          <h1 className="text-3xl sm:text-4xl">Painel de produtos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sand/75">
            Origem, custo e publicação do catálogo Mobi em um só lugar.
          </p>
        </div>
        <div className="flex gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={startNew}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-deep-green transition-colors hover:bg-sand sm:flex-none"
          >
            <Plus className="h-5 w-5" /> Novo produto
          </button>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sair"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sand/25 px-4 text-sm font-semibold text-sand transition-colors hover:border-gold hover:text-gold"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumo do catálogo">
        {(
          [
            ["all", "Todos", produtos.length],
            ["published", "Publicados", totals.published],
            ["awaiting", "Aguardam preço", totals.awaiting],
            ["incomplete", "Incompletos", totals.incomplete],
          ] as const
        ).map(([key, title, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            aria-pressed={statusFilter === key}
            className={`min-h-24 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${statusFilter === key ? "border-deep-green bg-deep-green text-sand shadow-premium" : "border-cacau/10 bg-white text-deep-green hover:border-gold/60"}`}
          >
            <span
              className={`block text-xs font-semibold ${statusFilter === key ? "text-sand/75" : "text-text-light"}`}
            >
              {title}
            </span>
            <span className="mt-1 block text-2xl font-bold">{count}</span>
          </button>
        ))}
      </div>

      <section
        className="mb-6 rounded-2xl border border-cacau/10 bg-white p-4 shadow-sm sm:p-5"
        aria-label="Busca e filtros"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-light"
            />
            <input
              type="search"
              aria-label="Buscar produtos"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar nome, SKU, fornecedor..."
              className="min-h-12 w-full rounded-xl border border-cacau/15 bg-sand/40 py-3 pl-12 pr-4 text-base text-cacau outline-none focus:border-gold"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((open) => !open)}
            aria-expanded={showFilters}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold ${showFilters || activeFilterCount ? "border-gold bg-gold/10 text-deep-green" : "border-cacau/15 text-cacau"}`}
          >
            <Filter className="h-4 w-4" /> Filtros
            {activeFilterCount ? ` (${activeFilterCount})` : ""}
          </button>
        </div>
        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-cacau/10 pt-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-cacau">
              Fornecedor
              <select
                value={supplierFilter}
                onChange={(event) => setSupplierFilter(event.target.value)}
                className="mt-1 min-h-12 w-full rounded-xl border border-cacau/15 bg-white px-3 text-base text-cacau outline-none focus:border-gold"
              >
                <option value="all">Todos os fornecedores</option>
                {suppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-cacau">
              Categoria
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="mt-1 min-h-12 w-full rounded-xl border border-cacau/15 bg-white px-3 text-base text-cacau outline-none focus:border-gold"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-11 justify-self-start text-sm font-semibold text-cacau underline decoration-gold underline-offset-4"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </section>

      {isLoading ? (
        <p className="text-text-light">Carregando produtos…</p>
      ) : isError ? (
        <div className="border border-destructive/25 bg-destructive/5 p-6 text-cacau">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h2 className="font-semibold">Não foi possível carregar os produtos</h2>
              <p className="mt-1 text-sm text-text-light">
                {error instanceof Error ? error.message : "Tente novamente em instantes."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mt-4 inline-flex items-center gap-2 bg-deep-green px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-sand disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                {isFetching ? "Tentando…" : "Tentar novamente"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3 text-sm text-text-light">
            <span>{filteredProdutos.length} produto(s) encontrado(s)</span>
            <span>
              Página {page} de {totalPages}
            </span>
          </div>
          {visibleProdutos.length === 0 ? (
            <div className="rounded-2xl border border-cacau/10 bg-white p-10 text-center text-sm text-text-light">
              Nenhum produto corresponde aos filtros atuais.
              <button
                type="button"
                onClick={clearFilters}
                className="mx-auto mt-3 block min-h-11 font-semibold text-deep-green underline decoration-gold underline-offset-4"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {visibleProdutos.map((p) => {
                const status = productStatus(p);
                const source = sourceUrl(p);
                return (
                  <article
                    key={p.id}
                    className="overflow-hidden rounded-2xl border border-cacau/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-premium sm:p-5"
                  >
                    <div className="flex gap-3">
                      <img
                        src={p.url_imagem}
                        alt=""
                        className="h-20 w-20 shrink-0 rounded-xl border border-cacau/10 bg-sand object-cover sm:h-24 sm:w-24"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="min-h-6 text-left text-sm font-semibold leading-snug text-cacau hover:text-gold sm:text-base"
                          >
                            {p.nome}
                          </button>
                          <StatusBadge status={status} />
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-light">
                          <span>{p.sku ? `SKU ${p.sku}` : "Sem SKU"}</span>
                          <span>{p.categoria || "Sem categoria"}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-deep-green">{sourceName(p)}</span>
                          {source ? (
                            <a
                              href={source}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-9 items-center gap-0.5 text-deep-green underline decoration-gold underline-offset-2"
                            >
                              Abrir fonte <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="text-text-light">Fonte não cadastrada</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 border-y border-cacau/10 py-3">
                      <div className="rounded-xl bg-sand/60 p-3">
                        <div className="text-xs text-text-light">Preço fornecedor</div>
                        <div className="mt-1 text-sm font-bold text-cacau sm:text-base">
                          {moneyOrDash(p.preco_atacado)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-price-green/5 p-3">
                        <div className="text-xs text-text-light">Preço no site</div>
                        <div className="mt-1 text-sm font-bold text-price-green sm:text-base">
                          {moneyOrDash(p.preco_atual)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
                      <span className="text-xs text-text-light">
                        Diferença:{" "}
                        <strong
                          className={
                            Number(p.preco_atual ?? 0) < Number(p.preco_atacado ?? 0)
                              ? "text-destructive"
                              : "text-cacau"
                          }
                        >
                          {marginLabel(p)}
                        </strong>{" "}
                        · {p.vendas_ultimos_30_dias ?? 0} venda(s) em 30 dias
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-cacau/20 px-4 text-sm font-semibold text-deep-green hover:border-gold"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(p.id, p.nome)}
                          aria-label={`Remover ${p.nome}`}
                          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-cacau/20 text-cacau hover:border-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="min-h-11 rounded-xl border border-cacau/20 px-4 text-sm font-semibold text-cacau disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-xs text-text-light">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="min-h-11 rounded-xl border border-cacau/20 px-4 text-sm font-semibold text-cacau disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}

      {editing && (
        <ProductForm
          value={editing}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={save}
          saving={saving}
        />
      )}
    </div>
  );
}

function ProductForm({
  value,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  value: ProdutoInput;
  onChange: (v: ProdutoInput) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const field =
    "min-h-12 w-full min-w-0 rounded-xl border border-cacau/15 bg-white px-3 py-2.5 text-base text-cacau outline-none transition-colors focus:border-gold";
  const label = "mb-1.5 block text-xs font-semibold text-cacau";
  const [uploading, setUploading] = useState(false);
  const initialValue = useRef(JSON.stringify(value));
  const supplierPrice = Number(value.preco_fornecedor ?? 0);
  const sitePrice = Number(value.preco_novo ?? 0);
  const pricingDifference = supplierPrice > 0 && sitePrice > 0 ? sitePrice - supplierPrice : null;
  const supplierOptions = Array.from(
    new Set([...(value.fornecedor ? [value.fornecedor] : []), ...SUPPLIER_OPTIONS]),
  );
  const canPublish = Boolean(
    value.nome.trim() &&
    value.categoria &&
    value.fornecedor &&
    supplierPrice > 0 &&
    sitePrice > 0 &&
    /^https?:\/\//i.test(value.imagem_url),
  );
  const requestClose = useCallback(() => {
    if (saving || uploading) return;
    if (
      initialValue.current !== JSON.stringify(value) &&
      !confirm("Descartar alterações deste produto?")
    )
      return;
    onCancel();
  }, [onCancel, saving, uploading, value]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [requestClose]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading("Enviando imagem para o Storage...");

    try {
      const { supabase } = await import("@/lib/supabaseClient");
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, "_")}.${fileExt}`;
      const filePath = `produtos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("produtos-bucket")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("produtos-bucket").getPublicUrl(filePath);

      onChange({ ...value, imagem_url: publicUrl });
      toast.success("Imagem enviada com sucesso!", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload da imagem", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 sm:p-5"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-sand shadow-drawer sm:max-h-[calc(100dvh-2.5rem)] sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gold/30 bg-deep-green px-5 py-4 text-sand sm:px-7">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-gold">
              Catálogo Mobi
            </p>
            <h2 id="product-form-title" className="text-xl font-semibold sm:text-2xl">
              {value.id ? "Editar produto" : "Novo produto"}
            </h2>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={saving || uploading}
            aria-label="Fechar edição"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-sand/30 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7 sm:py-6">
          <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4 text-sm text-cacau">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">Fluxo de publicação</span>
              <span className="text-xs font-bold text-deep-green">
                {supplierPrice > 0 && sitePrice <= 0
                  ? "Aguardando precificação"
                  : canPublish
                    ? "Pronto para publicar"
                    : "Preencha os preços"}
              </span>
            </div>
            <p className="mt-1 text-xs text-text-light">
              Produtos sem preço no site permanecem fora da vitrine.
            </p>
          </div>
          <section
            className="rounded-2xl border border-cacau/10 bg-white p-4 sm:p-5"
            aria-labelledby="identity-title"
          >
            <h3 id="identity-title" className="mb-1 text-lg font-semibold text-deep-green">
              Identificação
            </h3>
            <p className="mb-4 text-xs text-text-light">
              Dados usados para encontrar e organizar o produto.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label}>Nome *</label>
                <input
                  value={value.nome}
                  onChange={(e) => onChange({ ...value, nome: e.target.value })}
                  className={field}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>
                  Slug (URL amigável) — deixe em branco para gerar do nome
                </label>
                <input
                  value={value.slug ?? ""}
                  onChange={(e) => onChange({ ...value, slug: e.target.value })}
                  placeholder="ex: poltrona-velvet"
                  className={field}
                />
              </div>
              <div>
                <label className={label}>Fornecedor do catálogo</label>
                <select
                  value={value.fornecedor ?? ""}
                  onChange={(e) => onChange({ ...value, fornecedor: e.target.value })}
                  className={field}
                >
                  <option value="">Selecione</option>
                  {supplierOptions.map((supplier) => (
                    <option key={supplier} value={supplier}>
                      {supplier}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-text-light">
                  O fornecedor já cadastrado é carregado automaticamente ao editar.
                </p>
              </div>
              <div>
                <label className={label}>Referência / SKU</label>
                <input
                  value={value.referencia ?? ""}
                  onChange={(e) => onChange({ ...value, referencia: e.target.value })}
                  className={field}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Link do fornecedor / fonte do preço</label>
                <input
                  type="url"
                  value={value.link_fornecedor ?? value.fonte_preco ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      link_fornecedor: e.target.value,
                      fonte_preco: e.target.value,
                    })
                  }
                  placeholder="https://..."
                  className={field}
                />
                <p className="mt-1 text-xs text-text-light">
                  Este link fica disponível somente no painel para conferir a origem do produto.
                </p>
              </div>
            </div>
          </section>

          <section
            className="rounded-2xl border border-cacau/10 bg-white p-4 sm:p-5"
            aria-labelledby="pricing-title"
          >
            <h3 id="pricing-title" className="mb-1 text-lg font-semibold text-deep-green">
              Precificação
            </h3>
            <p className="mb-4 text-xs text-text-light">Compare custo e venda antes de publicar.</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="min-w-0">
                <label className={label}>Preço fornecedor (R$)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={value.preco_fornecedor ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      preco_fornecedor: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className={field}
                />
              </div>
              <div className="min-w-0">
                <label className={label}>Preço no site (R$) *</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={value.preco_novo}
                  onChange={(e) => onChange({ ...value, preco_novo: Number(e.target.value) })}
                  className={field}
                />
                <p className="mt-1 text-xs text-text-light">
                  O preço antigo será calculado automaticamente: +15%.
                </p>
              </div>
              <div className="col-span-2 rounded-xl border border-cacau/10 bg-sand/50 p-3">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-cacau">
                  Conferência de preço
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-text-light">Custo do fornecedor</div>
                    <div className="mt-1 font-bold text-cacau">
                      {moneyOrDash(value.preco_fornecedor)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-light">Preço no site</div>
                    <div className="mt-1 font-bold text-price-green">
                      {moneyOrDash(value.preco_novo)}
                    </div>
                  </div>
                </div>
                {pricingDifference != null && pricingDifference < 0 && (
                  <p className="mt-2 text-xs font-semibold text-destructive">
                    Atenção: o preço do site está abaixo do custo do fornecedor.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section
            className="rounded-2xl border border-cacau/10 bg-white p-4 sm:p-5"
            aria-labelledby="details-title"
          >
            <h3 id="details-title" className="mb-4 text-lg font-semibold text-deep-green">
              Detalhes do produto
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Vendas nos últimos 30 dias</label>
                <input
                  type="number"
                  min="0"
                  value={value.vendas_ultimos_30_dias ?? 0}
                  onChange={(e) =>
                    onChange({ ...value, vendas_ultimos_30_dias: Number(e.target.value) })
                  }
                  className={field}
                />
              </div>
              <div>
                <label className={label}>Medidas</label>
                <input
                  value={value.medidas ?? ""}
                  onChange={(e) => onChange({ ...value, medidas: e.target.value })}
                  placeholder="ex.: 1,80 × 0,80 m"
                  className={field}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Cores (separadas por vírgula)</label>
                <input
                  value={(value.cores ?? []).join(", ")}
                  onChange={(e) => onChange({ ...value, cores: e.target.value.split(",") })}
                  className={field}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Descrição</label>
                <textarea
                  value={value.descricao ?? ""}
                  onChange={(e) => onChange({ ...value, descricao: e.target.value })}
                  rows={3}
                  className={field}
                />
              </div>
            </div>
          </section>

          <section
            className="rounded-2xl border border-cacau/10 bg-white p-4 sm:p-5"
            aria-labelledby="publication-title"
          >
            <h3 id="publication-title" className="mb-1 text-lg font-semibold text-deep-green">
              Imagem e organização
            </h3>
            <p className="mb-4 text-xs text-text-light">
              A foto e o preço no site são necessários para aparecer na vitrine.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label}>Imagem do produto *</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={value.imagem_url}
                    onChange={(e) => onChange({ ...value, imagem_url: e.target.value })}
                    placeholder="Insira a URL ou faça upload de um arquivo"
                    className={field}
                  />
                  <label className="flex min-h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-deep-green px-4 text-sm font-semibold text-sand hover:bg-gold hover:text-deep-green">
                    <ImagePlus className="h-4 w-4" /> {uploading ? "Carregando..." : "Enviar foto"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="sr-only"
                    />
                  </label>
                </div>
                {value.imagem_url && (
                  <img
                    src={value.imagem_url}
                    alt="Prévia"
                    className="mt-3 h-32 w-32 rounded-xl border border-cacau/10 object-cover"
                  />
                )}
              </div>
              <div>
                <label className={label}>Categoria *</label>
                <select
                  value={value.categoria ?? ""}
                  onChange={(e) => onChange({ ...value, categoria: e.target.value })}
                  className={field}
                >
                  <option value="">Selecione uma categoria</option>
                  {PRODUCT_CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Ordem</label>
                <input
                  type="number"
                  value={value.ordem ?? 0}
                  onChange={(e) => onChange({ ...value, ordem: Number(e.target.value) })}
                  className={field}
                />
              </div>
            </div>
          </section>
        </div>
        <div className="flex shrink-0 gap-3 border-t border-cacau/10 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:justify-end sm:px-7">
          <button
            onClick={requestClose}
            disabled={saving || uploading}
            className="min-h-12 flex-1 rounded-xl border border-cacau/20 px-5 text-sm font-semibold text-cacau transition-colors hover:border-gold disabled:opacity-50 sm:flex-none"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving || uploading}
            className="min-h-12 flex-[2] rounded-xl bg-deep-green px-5 text-sm font-bold text-sand transition-colors hover:bg-gold hover:text-deep-green disabled:opacity-60 sm:flex-none"
          >
            {saving ? "Salvando…" : "Salvar produto"}
          </button>
        </div>
      </div>
    </div>
  );
}
