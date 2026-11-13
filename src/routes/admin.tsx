import { adminLocalHome } from "../lib/home-local.functions";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  CircleDollarSign,
  FileUp,
  Images,
  Layers3,
  Lock,
  LogOut,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Ruler,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PRODUCT_CATEGORY_OPTIONS } from "@/lib/constants";
import {
  checkAdminPassword,
  completeScrapedProductImport,
  deleteProduto,
  importScrapedProducts,
  listAdminProdutos,
  getAdminStudioStorageMode,
  listPendingScrapedProducts,
  listAdminHomepageBanners,
  upsertProduto,
  type ProdutoInput,
  type ProdutoAdmin,
  type ProdutoScrapImport,
  type ProdutoScrapImportInput,
  type PriceVariation,
} from "@/lib/admin.functions";
import { formatBRL } from "@/lib/constants";
import { hasRealReferencePrice } from "@/lib/price-reference";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { AdminStudio } from "@/components/admin-studio/AdminStudio";
import { AdminOverview } from "@/components/AdminOverview";
import { ADMIN_REVIEW_QUERY_LIMIT } from "@/lib/admin-overview";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { SupplierPricingPanel } from "@/components/admin/SupplierPricingPanel";
import { createRemoteStudioTransport } from "@/lib/admin-studio-remote";
import { isEligibleBundleProduct } from "@/lib/product-bundles";
import type { AdminViewId } from "@/lib/admin-navigation";
import {
  matchesPriceFilter,
  parsePriceFilter,
  productStatus,
  type ProductStatus,
} from "@/lib/admin-filters";

const STORAGE_KEY = "mobili_admin_pwd";

function normalizeFilterText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

// Suggestions only. The catalog field remains text until supplier IDs are
// introduced through a reviewed database migration.
const SUPPLIER_OPTIONS = ["Alpoim Distribuidora", "Tropical Móveis", "SR Móveis Atacadão"] as const;

const MISSING_SUPPLIER_FILTER = "__missing_supplier__";

function supplierFilterValue(name: string): string {
  return `supplier:${name}`;
}

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
    <div className="mx-auto max-w-md px-[5%] py-16">
      <div className="border border-cacau/10 bg-white p-8 shadow-premium">
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
              className="w-full border border-cacau/15 bg-white px-4 py-3 font-sans text-sm text-cacau outline-none transition-colors focus:border-gold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-deep-green py-3 text-xs font-bold uppercase tracking-[1.5px] text-sand transition-colors hover:bg-gold hover:text-deep-green disabled:opacity-60"
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
  preco_antigo: null,
  preco_novo: 0,
  imagem_url: "",
  imagens: [],
  variacoes_preco: [],
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
  compre_junto_ids: [],
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  published: "Publicado",
  awaiting: "Aguardando precificação",
  incomplete: "Dados incompletos",
};

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

function supplierGroupName(product: ProdutoAdmin): string {
  return product.fornecedor?.trim() || "Sem fornecedor cadastrado";
}

function moneyOrDash(value: number | null | undefined): string {
  return value == null || Number(value) <= 0 ? "—" : formatBRL(Number(value));
}

function parsePriceVariations(value: unknown): PriceVariation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const variation = entry as Record<string, unknown>;
    const name = String(variation.name ?? "").trim();
    const sku = String(variation.sku ?? "").trim();
    if (!name || !sku) return [];
    const supplierPrice = Number(variation.supplier_price);
    const salePrice =
      variation.sale_price == null || variation.sale_price === ""
        ? null
        : Number(variation.sale_price);
    return [
      {
        name,
        sku,
        supplier_price: Number.isFinite(supplierPrice) ? supplierPrice : null,
        sale_price: salePrice != null && Number.isFinite(salePrice) ? salePrice : null,
      },
    ];
  });
}

async function readScrapeFile(file: File): Promise<ProdutoScrapImportInput[]> {
  const content = (await file.text()).trim();
  const parsed = content.startsWith("[")
    ? JSON.parse(content)
    : content
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line));
  if (!Array.isArray(parsed)) throw new Error("O arquivo precisa conter uma lista JSON ou JSONL.");
  return parsed as ProdutoScrapImportInput[];
}

function grossPriceDifference(product: ProdutoAdmin): number | null {
  const cost = Number(product.preco_atacado ?? 0);
  const price = Number(product.preco_atual ?? 0);
  if (cost <= 0 || price <= 0) return null;
  return price - cost;
}

function grossPriceDifferenceLabel(product: ProdutoAdmin): string {
  const difference = grossPriceDifference(product);
  if (difference == null) return "—";
  return `${difference < 0 ? "−" : "+"}${formatBRL(Math.abs(difference))}`;
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const colors: Record<ProductStatus, string> = {
    published: "border-price-green/25 bg-price-green/10 text-price-green",
    awaiting: "border-gold/40 bg-gold/15 text-cacau",
    incomplete: "border-destructive/25 bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${colors[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function AdminDashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const {
    data: produtos = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dataUpdatedAt: catalogUpdatedAt,
    isPending: isCatalogPending,
  } = useQuery({
    queryKey: ["admin-produtos"],
    queryFn: () => listAdminProdutos({ data: { password } }),
  });
  const {
    data: pendingScrapedProducts = [],
    refetch: refreshScrapedProducts,
    isFetching: isFetchingScraped,
    isError: isScrapedError,
    error: scrapedError,
    isPending: isScrapedPending,
    dataUpdatedAt: reviewUpdatedAt,
  } = useQuery({
    queryKey: ["admin-scraped-products"],
    queryFn: () => listPendingScrapedProducts({ data: { password } }),
  });
  const [editing, setEditing] = useState<ProdutoInput | null>(null);
  const [activeScrapedImport, setActiveScrapedImport] = useState<ProdutoScrapImport | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [workspaceTab, setWorkspaceTab] = useState<AdminViewId>("overview");
  const [statusFilter, setStatusFilter] = useState<"all" | ProductStatus>("all");
  const [priceField, setPriceField] = useState<"site" | "supplier">("site");
  const [priceFiltersOpen, setPriceFiltersOpen] = useState(false);
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 32;
  const storageMode = useQuery({
    queryKey: ["admin-studio-storage-mode"],
    queryFn: () => getAdminStudioStorageMode({ data: { password } }),
    retry: false,
  });
  const workspaceTransport = useMemo(
    () => (storageMode.data?.remote ? createRemoteStudioTransport(password) : undefined),
    [storageMode.data?.remote, password],
  );
  const homeTransport = useMemo(
    () => ({
      read: () => adminLocalHome({ data: { password } }),
      change: (
        command: import("../lib/home-transport").HomeTransportCommand,
        draft?: import("../lib/home-configuration").HomeDraftInput,
      ) => adminLocalHome({ data: { password, command, draft } }),
    }),
    [password],
  );
  const studioBanners = useQuery({
    queryKey: ["admin-homepage-banners", password],
    queryFn: () => listAdminHomepageBanners({ data: { password } }),
  });

  const supplierPricingGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        label: string;
        total: number;
        missingCost: number;
        missingSitePrice: number;
        belowCost: number;
      }
    >();

    for (const product of produtos) {
      const supplier = product.fornecedor?.trim() ?? "";
      const key = supplier ? supplierFilterValue(supplier) : MISSING_SUPPLIER_FILTER;
      const label = supplier || "Sem fornecedor cadastrado";
      const summary = groups.get(key) ?? {
        key,
        label,
        total: 0,
        missingCost: 0,
        missingSitePrice: 0,
        belowCost: 0,
      };
      const cost = Number(product.preco_atacado ?? 0);
      const sitePrice = Number(product.preco_atual ?? 0);

      summary.total += 1;
      if (cost <= 0) summary.missingCost += 1;
      if (sitePrice <= 0) summary.missingSitePrice += 1;
      if (cost > 0 && sitePrice > 0 && sitePrice < cost) summary.belowCost += 1;
      groups.set(key, summary);
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (a.key === MISSING_SUPPLIER_FILTER) return 1;
      if (b.key === MISSING_SUPPLIER_FILTER) return -1;
      return a.label.localeCompare(b.label, "pt-BR");
    });
  }, [produtos]);
  const allSupplierPricing = useMemo(
    () =>
      produtos.reduce(
        (summary, product) => {
          const cost = Number(product.preco_atacado ?? 0);
          const sitePrice = Number(product.preco_atual ?? 0);
          summary.total += 1;
          if (cost <= 0) summary.missingCost += 1;
          if (sitePrice <= 0) summary.missingSitePrice += 1;
          if (cost > 0 && sitePrice > 0 && sitePrice < cost) summary.belowCost += 1;
          return summary;
        },
        { total: 0, missingCost: 0, missingSitePrice: 0, belowCost: 0 },
      ),
    [produtos],
  );
  const supplierPricingChoices = useMemo(
    () => [
      { key: "all", label: "Todos os fornecedores", ...allSupplierPricing },
      ...supplierPricingGroups,
    ],
    [allSupplierPricing, supplierPricingGroups],
  );
  const supplierFilteredProducts = useMemo(
    () =>
      produtos
        .filter((product) => {
          const supplier = product.fornecedor?.trim() ?? "";
          return (
            supplierFilter === "all" ||
            (supplierFilter === MISSING_SUPPLIER_FILTER
              ? !supplier
              : supplierFilter === supplierFilterValue(supplier))
          );
        })
        .sort((a, b) => {
          const supplierA = a.fornecedor?.trim() ?? "";
          const supplierB = b.fornecedor?.trim() ?? "";
          return (
            supplierA.localeCompare(supplierB, "pt-BR") ||
            Number(a.ordem ?? 0) - Number(b.ordem ?? 0) ||
            a.nome.localeCompare(b.nome, "pt-BR")
          );
        }),
    [produtos, supplierFilter],
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
    const normalizedCategory = normalizeFilterText(categoryFilter);
    return produtos
      .filter((product) => {
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
        const supplier = product.fornecedor?.trim() ?? "";
        const matchesSupplier =
          supplierFilter === "all" ||
          (supplierFilter === MISSING_SUPPLIER_FILTER
            ? !supplier
            : supplierFilter === supplierFilterValue(supplier));
        const matchesCategory =
          categoryFilter === "all" || normalizeFilterText(product.categoria) === normalizedCategory;
        const matchesStatus = statusFilter === "all" || productStatus(product) === statusFilter;
        const matchesPrice = matchesPriceFilter(
          priceField === "site" ? product.preco_atual : product.preco_atacado,
          minimumPrice,
          maximumPrice,
        );
        return matchesSearch && matchesSupplier && matchesCategory && matchesStatus && matchesPrice;
      })
      .sort((a, b) => {
        const supplierA = a.fornecedor?.trim() ?? "";
        const supplierB = b.fornecedor?.trim() ?? "";
        if (!supplierA && supplierB) return 1;
        if (supplierA && !supplierB) return -1;
        const supplierOrder = supplierA.localeCompare(supplierB, "pt-BR");
        return (
          supplierOrder ||
          Number(a.ordem ?? 0) - Number(b.ordem ?? 0) ||
          a.nome.localeCompare(b.nome, "pt-BR")
        );
      });
  }, [
    produtos,
    search,
    supplierFilter,
    categoryFilter,
    statusFilter,
    priceField,
    minimumPrice,
    maximumPrice,
  ]);
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
  const visibleProductGroups = useMemo(() => {
    const groups = new Map<string, { label: string; products: ProdutoAdmin[] }>();
    for (const product of visibleProdutos) {
      const supplier = product.fornecedor?.trim() ?? "";
      const key = supplier ? supplierFilterValue(supplier) : MISSING_SUPPLIER_FILTER;
      const group = groups.get(key) ?? {
        label: supplier || "Sem fornecedor cadastrado",
        products: [],
      };
      group.products.push(product);
      groups.set(key, group);
    }
    return Array.from(groups.entries()).map(([key, group]) => ({ key, ...group }));
  }, [visibleProdutos]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    supplierFilter,
    categoryFilter,
    statusFilter,
    priceField,
    minimumPrice,
    maximumPrice,
  ]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!supplierPricingChoices.some((choice) => choice.key === supplierFilter)) {
      setSupplierFilter("all");
    }
  }, [supplierFilter, supplierPricingChoices]);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin-produtos"] });
    await qc.invalidateQueries({ queryKey: ["admin-scraped-products"] });
    router.invalidate();
  };

  const startNew = () => {
    setActiveScrapedImport(null);
    setEditing({ ...EMPTY });
  };
  const startEdit = (p: ProdutoAdmin) => {
    setActiveScrapedImport(null);
    setEditing({
      id: p.id,
      nome: p.nome,
      slug: p.slug,
      preco_antigo: hasRealReferencePrice(Number(p.preco_antigo), Number(p.preco_atual))
        ? Number(p.preco_antigo)
        : null,
      preco_novo: p.preco_atual,
      imagem_url: p.url_imagem,
      imagens: p.imagens ?? [],
      variacoes_preco: parsePriceVariations(p.variacoes_preco),
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
      compre_junto_ids: p.compre_junto_ids ?? [],
    });
  };

  const startScrapedEdit = (product: ProdutoScrapImport) => {
    setActiveScrapedImport(product);
    setEditing({
      ...EMPTY,
      deduplicateExisting: true,
      id: product.product_id ?? product.id,
      nome: product.name,
      preco_novo: 0,
      imagem_url: product.image_urls[0] ?? "",
      imagens: product.image_urls.slice(1),
      variacoes_preco: parsePriceVariations(product.price_variations),
      categoria: product.category ?? "",
      fornecedor: product.supplier,
      referencia: product.sku ?? product.reference ?? "",
      preco_fornecedor: product.supplier_price == null ? null : Number(product.supplier_price),
      link_fornecedor: product.source_url ?? "",
      fonte_preco: product.source_url ?? "",
      descricao: product.description ?? "",
      medidas: product.measurements ?? "",
      compre_junto_ids: undefined,
      cores:
        Array.isArray(product.availability) && product.availability.length
          ? product.availability
              .map((value) => String(value).split(" - ")[0].trim())
              .filter(Boolean)
          : product.colors
            ? product.colors
                .split(/[,;\n]/)
                .map((value) => value.trim())
                .filter(Boolean)
            : [],
    });
  };

  const handleScrapeImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const records = await readScrapeFile(file);
      const result = await importScrapedProducts({ data: { password, records } });
      toast.success(`${result.processed} produto(s) adicionado(s) ou atualizado(s) para revisão.`);
      await refreshScrapedProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível importar o arquivo.");
    } finally {
      setImporting(false);
    }
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const saved = await upsertProduto({
        data: {
          password,
          produto: { ...editing, deduplicateExisting: Boolean(activeScrapedImport) },
        },
      });
      if (activeScrapedImport) {
        await completeScrapedProductImport({
          data: { password, importId: activeScrapedImport.id, productId: saved.id },
        });
      }
      toast.success(
        activeScrapedImport
          ? saved.duplicate
            ? "Produto existente atualizado sem duplicar no catálogo."
            : "Produto cadastrado e enviado para o catálogo."
          : "Produto salvo com sucesso.",
      );
      setEditing(null);
      setActiveScrapedImport(null);
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
    setPriceField("site");
    setMinimumPrice("");
    setMaximumPrice("");
  };

  const selectSummary = (status: "all" | ProductStatus) => {
    clearFilters();
    setStatusFilter(status);
    setPage(1);
    setWorkspaceTab("produtos");
    requestAnimationFrame(() => {
      document
        .getElementById("admin-product-filters")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const minPrice = parsePriceFilter(minimumPrice);
  const maxPrice = parsePriceFilter(maximumPrice);
  const invalidPrices =
    Number.isNaN(minPrice) ||
    Number.isNaN(maxPrice) ||
    (minPrice != null && maxPrice != null && minPrice > maxPrice);
  const priceFiltersActive =
    priceField !== "site" || minimumPrice.trim() !== "" || maximumPrice.trim() !== "";

  useEffect(() => {
    setPriceFiltersOpen(priceFiltersActive || invalidPrices);
  }, [priceFiltersActive, invalidPrices]);

  return (
    <AdminWorkspace
      area={workspaceTab}
      onNavigate={setWorkspaceTab}
      onLogout={onLogout}
      onSearch={(query) => {
        clearFilters();
        setSearch(query);
        setWorkspaceTab("produtos");
      }}
    >
      {workspaceTab === "produtos" && (
        <div className="aw-editor-toolbar">
          <h1>Produtos</h1>
          <button className="aw-action" onClick={startNew}>
            <Plus size={16} /> Novo produto
          </button>
        </div>
      )}
      {storageMode.isError && (
        <div role="alert" className="pm-note">
          Não foi possível confirmar onde salvar os rascunhos.{" "}
          <button className="pm-button" onClick={() => storageMode.refetch()}>
            Tentar novamente
          </button>
        </div>
      )}
      <AdminStudio
        workspaceTransport={workspaceTransport}
        homeTransport={homeTransport}
        area={workspaceTab}
        products={produtos}
        ready={!isCatalogPending && !isError && storageMode.isSuccess}
        onNavigate={setWorkspaceTab}
        bannerSource={{
          status: studioBanners.isPending ? "pending" : studioBanners.isError ? "error" : "success",
          data: studioBanners.data?.banners,
          available: studioBanners.data?.available,
        }}
      />
      <div
        hidden={workspaceTab !== "produtos"}
        className={
          workspaceTab !== "produtos" && workspaceTab !== "revisao"
            ? "hidden"
            : "mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
        }
      >
        <button
          type="button"
          onClick={() => selectSummary("all")}
          aria-pressed={statusFilter === "all"}
          className="border border-cacau/10 bg-white p-4 text-left aria-pressed:ring-2 aria-pressed:ring-deep-green"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-text-light">
            Total
          </div>
          <div className="mt-1 text-2xl font-bold text-deep-green">{produtos.length}</div>
        </button>
        <button
          type="button"
          onClick={() => selectSummary("published")}
          aria-pressed={statusFilter === "published"}
          className="border border-price-green/20 bg-price-green/5 p-4 text-left aria-pressed:ring-2 aria-pressed:ring-deep-green"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-price-green">
            Publicados
          </div>
          <div className="mt-1 text-2xl font-bold text-price-green">{totals.published}</div>
        </button>
        <button
          type="button"
          onClick={() => selectSummary("awaiting")}
          aria-pressed={statusFilter === "awaiting"}
          className="border border-gold/30 bg-gold/10 p-4 text-left aria-pressed:ring-2 aria-pressed:ring-deep-green"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-cacau">
            Aguardando preço
          </div>
          <div className="mt-1 text-2xl font-bold text-cacau">{totals.awaiting}</div>
        </button>
        <button
          type="button"
          onClick={() => selectSummary("incomplete")}
          aria-pressed={statusFilter === "incomplete"}
          className="border border-destructive/20 bg-destructive/5 p-4 text-left aria-pressed:ring-2 aria-pressed:ring-deep-green"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-destructive">
            Incompletos
          </div>
          <div className="mt-1 text-2xl font-bold text-destructive">{totals.incomplete}</div>
        </button>
      </div>

      <div className="admin-workspace">
        <section
          hidden={workspaceTab !== "overview"}
          data-state={workspaceTab === "overview" ? "active" : "inactive"}
          className="admin-workspace-panel"
          aria-label="overview"
        >
          <AdminOverview
            catalog={{
              status: isError ? "error" : isCatalogPending ? "pending" : "success",
              data: produtos,
              updatedAt: catalogUpdatedAt,
            }}
            review={{
              status: isScrapedError ? "error" : isScrapedPending ? "pending" : "success",
              data: pendingScrapedProducts,
              updatedAt: reviewUpdatedAt,
              limit: ADMIN_REVIEW_QUERY_LIMIT,
            }}
            refreshing={isFetching || isFetchingScraped}
            onRefresh={() => {
              void refetch();
              void refreshScrapedProducts();
            }}
            onProducts={selectSummary}
            onEdit={startEdit}
            onNavigate={setWorkspaceTab}
          />
        </section>
        <section
          hidden={workspaceTab !== "revisao"}
          data-state={workspaceTab === "revisao" ? "active" : "inactive"}
          className="admin-workspace-panel"
          aria-label="revisao"
        >
          <section className="mb-6 border border-gold/30 bg-gold/5 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-deep-green">Produtos coletados para revisão</h2>
                <p className="mt-1 text-xs text-text-light">
                  Importe um JSONL do worker. O custo fica registrado como preço do fornecedor; o
                  preço de venda só é definido por você ao completar o cadastro.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 bg-deep-green px-4 py-3 text-xs font-bold uppercase tracking-wider text-sand transition-colors hover:bg-gold hover:text-deep-green">
                <FileUp className="h-4 w-4" />
                {importing ? "Importando…" : "Importar JSONL"}
                <input
                  type="file"
                  accept=".jsonl,.ndjson,.json,application/json,text/plain"
                  onChange={handleScrapeImport}
                  disabled={importing}
                  className="hidden"
                />
              </label>
            </div>

            {pendingScrapedProducts.length === 0 ? (
              <p className="mt-4 border-t border-gold/20 pt-3 text-sm text-text-light">
                {isScrapedError
                  ? `A fila de importação ainda não está disponível: ${scrapedError instanceof Error ? scrapedError.message : "verifique a migração do banco."}`
                  : isFetchingScraped
                    ? "Carregando importações…"
                    : "Nenhum produto aguardando revisão."}
              </p>
            ) : (
              <>
                <div className="mt-4 flex items-center justify-between border-t border-gold/20 pt-3 text-xs text-text-light">
                  <span>{pendingScrapedProducts.length} produto(s) aguardando revisão</span>
                  <button
                    type="button"
                    onClick={() => refreshScrapedProducts()}
                    disabled={isFetchingScraped}
                    className="inline-flex items-center gap-1 font-semibold text-cacau"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${isFetchingScraped ? "animate-spin" : ""}`}
                    />
                    Atualizar
                  </button>
                </div>
                <div className="mt-3 grid max-h-[640px] gap-3 overflow-y-auto pr-1 xl:grid-cols-2">
                  {pendingScrapedProducts.map((product) => (
                    <article
                      key={product.id}
                      className="border border-cacau/10 bg-white p-3 sm:p-4"
                    >
                      <div className="flex gap-3">
                        {product.image_urls[0] ? (
                          <ImageWithFallback
                            src={product.image_urls[0]}
                            alt={`Imagem de ${product.name}`}
                            className="h-16 w-16 shrink-0 border border-cacau/10 object-contain sm:h-20 sm:w-20"
                          />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-cacau/10 bg-sand text-[10px] text-text-light sm:h-20 sm:w-20">
                            Sem foto
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="font-semibold text-cacau">{product.name}</h3>
                            <span className="shrink-0 text-xs font-bold text-deep-green">
                              {moneyOrDash(product.supplier_price)} custo
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-text-light">
                            {[product.supplier, product.category, product.sku]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          {parsePriceVariations(product.price_variations).length > 1 && (
                            <p className="mt-2 text-xs text-cacau">
                              {parsePriceVariations(product.price_variations)
                                .map(
                                  (variation) =>
                                    `${variation.name}: ${moneyOrDash(variation.supplier_price)}`,
                                )
                                .join(" · ")}
                            </p>
                          )}
                          {product.measurements && (
                            <p className="mt-2 line-clamp-2 text-xs text-cacau">
                              {product.measurements}
                            </p>
                          )}
                          {product.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-text-light">
                              {product.description}
                            </p>
                          )}
                          {Array.isArray(product.availability) &&
                            product.availability.length > 0 && (
                              <p className="mt-1 line-clamp-2 text-[11px] text-text-light">
                                Disponibilidade: {product.availability.map(String).join(" · ")}
                              </p>
                            )}
                          <button
                            type="button"
                            onClick={() => startScrapedEdit(product)}
                            className="mt-3 border border-gold px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-cacau hover:bg-gold hover:text-deep-green"
                          >
                            Completar preço e fotos
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </section>
        <section
          hidden={workspaceTab !== "produtos"}
          data-state={workspaceTab === "produtos" ? "active" : "inactive"}
          className="admin-workspace-panel"
          aria-label="produtos"
        >
          <section
            id="admin-product-filters"
            className="mb-6 scroll-mt-4 border border-cacau/10 bg-sand/50 p-4 sm:p-5"
          >
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-deep-green">Encontrar produtos</h2>
                <p className="text-xs text-text-light">
                  Pesquise por nome, SKU, fornecedor ou fonte do preço.
                </p>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="self-start text-xs font-bold uppercase tracking-wider text-cacau underline decoration-gold underline-offset-4"
              >
                Limpar filtros
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <input
                aria-label="Buscar produto no painel"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, SKU, slug..."
                className="border border-cacau/15 bg-white px-3 py-3 text-sm text-cacau outline-none focus:border-gold lg:col-span-2"
              />
              <select
                aria-label="Filtrar fornecedor"
                value={supplierFilter}
                onChange={(event) => setSupplierFilter(event.target.value)}
                className="border border-cacau/15 bg-white px-3 py-3 text-sm text-cacau outline-none focus:border-gold"
              >
                <option value="all">Todos os fornecedores</option>
                {supplierPricingGroups.map((group) => (
                  <option key={group.key} value={group.key}>
                    {group.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filtrar categoria"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="border border-cacau/15 bg-white px-3 py-3 text-sm text-cacau outline-none focus:border-gold"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filtrar estado de publicação"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | ProductStatus)}
                className="border border-cacau/15 bg-white px-3 py-3 text-sm text-cacau outline-none focus:border-gold md:col-span-2 lg:col-span-1"
              >
                <option value="all">Todos os estados</option>
                <option value="published">Publicados</option>
                <option value="awaiting">Aguardando precificação</option>
                <option value="incomplete">Dados incompletos</option>
              </select>
            </div>
            <details
              className="admin-advanced-price-filters"
              open={priceFiltersOpen}
              onToggle={(event) => setPriceFiltersOpen(event.currentTarget.open)}
            >
              <summary>Faixa de preço{priceFiltersActive ? " · aplicada" : ""}</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="text-xs text-cacau">
                  Aplicar faixa a
                  <select
                    value={priceField}
                    onChange={(event) => setPriceField(event.target.value as "site" | "supplier")}
                    className="mt-1 min-h-11 w-full border border-cacau/15 bg-white px-3 text-sm"
                  >
                    <option value="site">Preço no site</option>
                    <option value="supplier">Custo informado pelo fornecedor</option>
                  </select>
                </label>
                <label className="text-xs text-cacau">
                  Preço mínimo (R$)
                  <input
                    inputMode="decimal"
                    value={minimumPrice}
                    onChange={(event) => setMinimumPrice(event.target.value)}
                    placeholder="Sem mínimo"
                    aria-invalid={invalidPrices}
                    className="mt-1 min-h-11 w-full border border-cacau/15 bg-white px-3 text-sm"
                  />
                </label>
                <label className="text-xs text-cacau">
                  Preço máximo (R$)
                  <input
                    inputMode="decimal"
                    value={maximumPrice}
                    onChange={(event) => setMaximumPrice(event.target.value)}
                    placeholder="Sem máximo"
                    aria-invalid={invalidPrices}
                    className="mt-1 min-h-11 w-full border border-cacau/15 bg-white px-3 text-sm"
                  />
                </label>
              </div>
              {invalidPrices && (
                <p role="alert" className="mt-2 text-xs text-destructive">
                  Informe valores válidos; o mínimo não pode ser maior que o máximo.
                </p>
              )}
            </details>
            {statusFilter === "awaiting" && (
              <p className="mt-3 text-xs text-cacau">
                Produtos sem preço de venda, inclusive os que ainda não têm custo cadastrado. Edite
                o produto para definir o preço; ele continua fora da vitrine até estar pronto.
              </p>
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
              <div className="mb-3 flex items-center justify-between gap-3 text-xs text-text-light">
                <span>{filteredProdutos.length} produto(s) encontrado(s)</span>
                <span>
                  Página {page} de {totalPages}
                </span>
              </div>
              {visibleProdutos.length === 0 ? (
                <div className="border border-cacau/10 bg-white p-10 text-center text-sm text-text-light">
                  Nenhum produto corresponde aos filtros atuais.
                </div>
              ) : (
                <div className="space-y-5">
                  {visibleProductGroups.map((group) => (
                    <section key={group.key} aria-label={`Produtos de ${group.label}`}>
                      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-cacau/10 pb-2">
                        <h3 className="font-semibold text-deep-green">{group.label}</h3>
                        <span className="text-xs text-text-light">
                          {group.products.length} produto(s) nesta página
                        </span>
                      </div>
                      <div className="grid gap-3 xl:grid-cols-2">
                        {group.products.map((p) => {
                          const status = productStatus(p);
                          const source = sourceUrl(p);
                          const difference = grossPriceDifference(p);
                          return (
                            <article
                              key={p.id}
                              className="border border-cacau/10 bg-white p-4 transition-shadow hover:shadow-premium sm:p-5"
                            >
                              <div className="flex gap-3">
                                <ImageWithFallback
                                  src={p.url_imagem}
                                  alt={`Imagem de ${p.nome}`}
                                  className="h-20 w-20 shrink-0 border border-cacau/10 object-cover sm:h-24 sm:w-24"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() => startEdit(p)}
                                      className="text-left font-semibold text-cacau hover:text-gold"
                                    >
                                      {p.nome}
                                    </button>
                                    <StatusBadge status={status} />
                                  </div>
                                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-light">
                                    <span>{p.sku || "Sem SKU"}</span>
                                    <span>{p.categoria || "Sem categoria"}</span>
                                  </div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="font-semibold text-deep-green">
                                      {sourceName(p)}
                                    </span>
                                    {source ? (
                                      <a
                                        href={source}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-gold underline underline-offset-2"
                                      >
                                        Abrir fonte
                                      </a>
                                    ) : (
                                      <span className="text-text-light">Fonte não cadastrada</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 grid grid-cols-3 gap-2 border-y border-cacau/10 py-3 text-xs">
                                <div>
                                  <div className="text-text-light">Custo informado</div>
                                  <div className="mt-1 font-bold text-cacau">
                                    {moneyOrDash(p.preco_atacado)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-text-light">Preço no site</div>
                                  <div className="mt-1 font-bold text-price-green">
                                    {moneyOrDash(p.preco_atual)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-text-light">Diferença bruta</div>
                                  <div
                                    className={`mt-1 font-bold ${difference == null ? "text-text-light" : difference >= 0 ? "text-price-green" : "text-destructive"}`}
                                  >
                                    {grossPriceDifferenceLabel(p)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-3 pt-1">
                                <span className="text-xs text-text-light">
                                  {p.vendas_ultimos_30_dias ?? 0} venda(s) em 30 dias
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(p)}
                                    className="inline-flex min-h-11 items-center gap-1.5 border border-cacau/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-cacau hover:border-gold hover:text-gold"
                                  >
                                    <Pencil className="h-3.5 w-3.5" /> Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => remove(p.id, p.nome)}
                                    aria-label={`Remover ${p.nome}`}
                                    className="min-h-11 min-w-11 border border-cacau/20 p-2 text-cacau hover:border-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="mx-auto h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
              {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="border border-cacau/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cacau disabled:opacity-40"
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
                    className="border border-cacau/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cacau disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
        <section
          hidden={workspaceTab !== "fornecedores"}
          data-state={workspaceTab === "fornecedores" ? "active" : "inactive"}
          className="admin-workspace-panel"
          aria-label="Fornecedores e preços"
        >
          {isCatalogPending ? (
            <p className="text-text-light">Carregando catálogo…</p>
          ) : isError ? (
            <div
              className="border border-destructive/25 bg-destructive/5 p-5 text-cacau"
              role="alert"
            >
              <h2 className="font-semibold">Não foi possível carregar a precificação</h2>
              <p className="mt-1 text-sm text-text-light">
                {error instanceof Error ? error.message : "Tente atualizar os dados."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mt-3 min-h-11 border border-cacau/20 px-3 text-xs font-semibold"
              >
                {isFetching ? "Atualizando…" : "Tentar novamente"}
              </button>
            </div>
          ) : (
            <SupplierPricingPanel
              summaries={supplierPricingChoices}
              products={supplierFilteredProducts}
              selectedSupplier={supplierFilter}
              onSelectSupplier={setSupplierFilter}
              onEdit={startEdit}
            />
          )}
        </section>
      </div>

      {editing && (
        <ProductForm
          value={editing}
          products={produtos}
          onChange={setEditing}
          onCancel={() => {
            setEditing(null);
            setActiveScrapedImport(null);
          }}
          onSave={save}
          saving={saving}
        />
      )}
    </AdminWorkspace>
  );
}

function ProductForm({
  value,
  products,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  value: ProdutoInput;
  products: ProdutoAdmin[];
  onChange: (v: ProdutoInput) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const field =
    "min-h-11 w-full rounded-lg border border-cacau/15 bg-white px-3 py-2.5 text-base text-cacau outline-none transition-colors placeholder:text-cacau/40 focus:border-deep-green focus:ring-2 focus:ring-deep-green/10 sm:text-sm";
  const label = "mb-1.5 block text-sm font-semibold text-cacau";
  const [uploading, setUploading] = useState(false);
  const originalValue = useRef(JSON.stringify(value));
  const hasUnsavedChanges = JSON.stringify(value) !== originalValue.current;
  const supplierPrice = Number(value.preco_fornecedor ?? 0);
  const sitePrice = Number(value.preco_novo ?? 0);
  const pricingDifference = supplierPrice > 0 && sitePrice > 0 ? sitePrice - supplierPrice : null;
  const pricingStatus =
    sitePrice > 0
      ? "Preço do site informado"
      : supplierPrice > 0
        ? "Falta preço no site"
        : "Sem preços cadastrados";
  const requestClose = () => {
    if (
      hasUnsavedChanges &&
      typeof window !== "undefined" &&
      !window.confirm("Descartar as alterações deste produto?")
    )
      return;
    onCancel();
  };
  const supplierOptions = Array.from(
    new Set([
      ...(value.fornecedor ? [value.fornecedor] : []),
      ...products
        .map((product) => product.fornecedor?.trim())
        .filter((supplier): supplier is string => Boolean(supplier)),
      ...SUPPLIER_OPTIONS,
    ]),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const pricingDifferenceLabel =
    pricingDifference == null
      ? "—"
      : `${pricingDifference < 0 ? "−" : "+"}${formatBRL(Math.abs(pricingDifference))}`;
  const bundleCandidates = products.filter(
    (product) => product.id !== value.id && isEligibleBundleProduct(product),
  );
  const selectedBundleIds = value.compre_junto_ids ?? [];
  const invalidBundleIds = selectedBundleIds.filter(
    (id) => !bundleCandidates.some((product) => product.id === id),
  );

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

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    setUploading(true);
    const toastId = toast.loading("Enviando fotos para o Storage...");
    try {
      const { supabase } = await import("@/lib/supabaseClient");
      const urls: string[] = [];
      for (const file of files) {
        const extension = file.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}_${crypto.randomUUID()}.${extension}`;
        const filePath = `produtos/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("produtos-bucket")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("produtos-bucket").getPublicUrl(filePath);
        urls.push(publicUrl);
      }
      onChange({ ...value, imagens: [...(value.imagens ?? []), ...urls] });
      toast.success(`${urls.length} foto(s) adicionada(s).`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload das fotos", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && requestClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1100] bg-[#17271d]/65 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby="admin-product-editor-description"
          onPointerDownOutside={(event) => event.preventDefault()}
          className="fixed inset-0 z-[1110] mx-auto flex h-[100dvh] w-full max-w-[1100px] flex-col overflow-hidden border border-[#ded3bf] bg-[#f8f6f0] shadow-2xl outline-none sm:inset-y-4 sm:h-[calc(100dvh-2rem)] sm:rounded-2xl"
        >
          <header className="z-10 flex shrink-0 items-start justify-between gap-4 border-b border-cacau/10 bg-[#fbfaf6] px-4 py-4 sm:items-center sm:px-6">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a743c]">
                Catálogo Mobi · produto
              </p>
              <Dialog.Title className="text-xl font-bold leading-tight text-deep-green sm:text-2xl">
                {value.id ? "Editar produto" : "Novo produto"}
              </Dialog.Title>
              <Dialog.Description
                id="admin-product-editor-description"
                className="mt-1 max-w-2xl text-xs leading-relaxed text-text-light sm:text-sm"
              >
                Edite os dados do catálogo e confira o preço antes de salvar.
              </Dialog.Description>
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold sm:hidden ${sitePrice > 0 ? "bg-[#e6efe4] text-deep-green" : "bg-[#f3ead6] text-[#765a2f]"}`}
              >
                {pricingStatus}
              </span>
            </div>
            <div className="flex shrink-0 items-start gap-2 sm:items-center">
              <span
                className={`hidden rounded-full px-3 py-1.5 text-xs font-semibold sm:inline-flex ${sitePrice > 0 ? "bg-[#e6efe4] text-deep-green" : "bg-[#f3ead6] text-[#765a2f]"}`}
              >
                {pricingStatus}
              </span>
              <button
                type="button"
                aria-label="Fechar editor"
                onClick={requestClose}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-cacau/15 bg-white text-cacau transition-colors hover:border-gold hover:text-deep-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-green"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid items-start gap-4 p-4 sm:p-6 lg:grid-cols-2">
              <section className="rounded-xl border border-cacau/10 bg-white p-4 lg:col-span-2 sm:p-5">
                <div className="mb-4 flex items-center gap-3 border-b border-cacau/10 pb-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf1e9] text-deep-green">
                    <Package size={19} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-deep-green">Identificação</h3>
                    <p className="mt-0.5 text-xs text-text-light">
                      Nome e endereço do produto na loja.
                    </p>
                  </div>
                </div>
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
                    <label className={label}>Referência / SKU</label>
                    <input
                      value={value.referencia ?? ""}
                      onChange={(e) => onChange({ ...value, referencia: e.target.value })}
                      className={field}
                    />
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
                    <label className={label}>Ordem na categoria</label>
                    <input
                      type="number"
                      value={value.ordem ?? 0}
                      onChange={(e) => onChange({ ...value, ordem: Number(e.target.value) })}
                      className={field}
                    />
                  </div>
                </div>
              </section>
              <section className="rounded-xl border border-cacau/10 bg-white p-4 lg:col-span-2 sm:p-5">
                <div className="mb-4 flex items-center gap-3 border-b border-cacau/10 pb-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3ead6] text-[#8a682f]">
                    <CircleDollarSign size={19} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-deep-green">Preço e fornecedor</h3>
                    <p className="mt-0.5 text-xs text-text-light">
                      Dados internos separados do preço à vista mostrado ao cliente.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2 sm:gap-4">
                    <div className="min-w-0">
                      <label className={label}>Custo informado pelo fornecedor (R$)</label>
                      <input
                        type="number"
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
                        step="0.01"
                        value={value.preco_novo}
                        onChange={(e) => {
                          const price = Number(e.target.value);
                          const variations = value.variacoes_preco ?? [];
                          onChange({
                            ...value,
                            preco_novo: price,
                            variacoes_preco: variations.map((variation, index) =>
                              index === 0 ? { ...variation, sale_price: price || null } : variation,
                            ),
                          });
                        }}
                        className={field}
                      />
                      <p className="mt-1 text-[11px] text-text-light">
                        Preço à vista ou dinheiro, antes de qualquer promoção.
                      </p>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label}>Preço anterior (opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={value.preco_antigo ?? ""}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          preco_antigo: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      placeholder="Informe somente um preço anterior real"
                      className={field}
                    />
                    <p className="mt-1 text-[11px] text-text-light">
                      Deixe vazio para não mostrar preço riscado nem selo de desconto. Preencha
                      apenas se esse preço anterior foi realmente praticado.
                    </p>
                  </div>
                  <div>
                    <label className={label}>Fornecedor (uso interno)</label>
                    <input
                      type="text"
                      value={value.fornecedor ?? ""}
                      onChange={(e) => onChange({ ...value, fornecedor: e.target.value })}
                      list="admin-product-supplier-options"
                      maxLength={120}
                      placeholder="Digite ou selecione um fornecedor"
                      className={field}
                    />
                    <datalist id="admin-product-supplier-options">
                      {supplierOptions.map((supplier) => (
                        <option key={supplier} value={supplier} />
                      ))}
                    </datalist>
                    <p className="mt-1 text-[11px] text-text-light">
                      O nome fica no painel para organizar o catálogo; não aparece como vendedor no
                      site.
                    </p>
                  </div>
                  <div className="sm:col-span-2 border border-cacau/10 bg-white p-3">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-cacau">
                      Conferência de preço
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div>
                        <div className="text-xs text-text-light">Custo informado</div>
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
                      <div>
                        <div className="text-xs text-text-light">Diferença bruta</div>
                        <div
                          className={`mt-1 font-bold ${pricingDifference == null ? "text-text-light" : pricingDifference >= 0 ? "text-price-green" : "text-destructive"}`}
                        >
                          {pricingDifferenceLabel}
                        </div>
                      </div>
                    </div>
                    {pricingDifference != null && pricingDifference < 0 && (
                      <p className="mt-2 text-xs font-semibold text-destructive">
                        Atenção: o preço do site está abaixo do custo do fornecedor.
                      </p>
                    )}
                    <p className="mt-2 text-xs text-text-light">
                      Diferença bruta: não considera taxas, frete, impostos ou outros custos.
                    </p>
                    {pricingDifference == null && (
                      <p className="mt-2 text-xs text-text-light">
                        Informe custo e preço no site para comparar os valores.
                      </p>
                    )}
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
                  {!!value.variacoes_preco?.length && (
                    <div className="sm:col-span-2 border border-gold/30 bg-white p-3">
                      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-cacau">
                        Preços por referência / peça
                      </div>
                      <p className="mb-3 text-[11px] text-text-light">
                        Cada código TROP da referência tem seu próprio custo. Preencha o preço de
                        venda de cada opção; o primeiro também define o preço principal do produto.
                      </p>
                      <div className="space-y-2">
                        {value.variacoes_preco.map((variation, index) => (
                          <div
                            key={`${variation.sku}-${index}`}
                            className="grid items-center gap-2 border-t border-cacau/10 pt-2 sm:grid-cols-[minmax(0,1fr)_100px_130px]"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold text-cacau">
                                {variation.name || "Peça"}
                              </div>
                              <div className="text-[11px] text-text-light">{variation.sku}</div>
                            </div>
                            <div className="text-xs text-text-light">
                              Custo: {moneyOrDash(variation.supplier_price)}
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variation.sale_price ?? ""}
                              onChange={(event) => {
                                const raw = event.target.value;
                                const salePrice = raw === "" ? null : Number(raw);
                                const variations = (value.variacoes_preco ?? []).map(
                                  (entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, sale_price: salePrice }
                                      : entry,
                                );
                                const primaryPrice =
                                  variations[0]?.sale_price ??
                                  variations.find((entry) => (entry.sale_price ?? 0) > 0)
                                    ?.sale_price ??
                                  0;
                                onChange({
                                  ...value,
                                  preco_novo: primaryPrice,
                                  variacoes_preco: variations,
                                });
                              }}
                              placeholder="Venda (R$)"
                              aria-label={`Preço de venda de ${variation.name}`}
                              className={field}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
              <section className="rounded-xl border border-cacau/10 bg-white p-4 lg:col-span-2 sm:p-5">
                <div className="mb-4 flex items-center gap-3 border-b border-cacau/10 pb-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf1e9] text-deep-green">
                    <Ruler size={19} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-deep-green">Detalhes do produto</h3>
                    <p className="mt-0.5 text-xs text-text-light">
                      Informações úteis para apresentar e filtrar o móvel.
                    </p>
                  </div>
                </div>
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
                    <label className={label} htmlFor="admin-product-measurements">
                      Medidas
                    </label>
                    <input
                      id="admin-product-measurements"
                      value={value.medidas ?? ""}
                      onChange={(e) => onChange({ ...value, medidas: e.target.value })}
                      placeholder="Largura: 200 cm; Altura: 90 cm; Profundidade fechada: 100 cm"
                      className={field}
                    />
                    <small className="mt-1 block text-xs text-muted-foreground">
                      Para filtros por medida, informe cada valor identificado. Sofás podem ter
                      profundidade fechada e aberta separadas.
                    </small>
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
              <section className="rounded-xl border border-cacau/10 bg-white p-4 lg:col-span-2 sm:p-5">
                <div className="mb-4 flex items-center gap-3 border-b border-cacau/10 pb-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3ead6] text-[#8a682f]">
                    <Layers3 size={19} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-deep-green">Compre junto</h3>
                    <p className="mt-0.5 text-xs text-text-light">
                      Selecione até três complementos que combinem com este produto.
                    </p>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-3 text-xs text-text-light">
                    Escolha até 3 móveis que realmente combinam com este produto. A vitrine não
                    escolhe complementos automaticamente.
                  </p>
                  {invalidBundleIds.map((id) => (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-3 border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-cacau"
                    >
                      <span>
                        {products.find((product) => product.id === id)?.nome ?? id}: complemento
                        indisponível para exibição.
                      </span>
                      <button
                        type="button"
                        className="min-h-11 font-semibold underline"
                        onClick={() =>
                          onChange({
                            ...value,
                            compre_junto_ids: selectedBundleIds.filter((item) => item !== id),
                          })
                        }
                      >
                        Remover vínculo
                      </button>
                    </div>
                  ))}
                  <div className="max-h-56 divide-y divide-cacau/10 overflow-y-auto border border-cacau/10">
                    {bundleCandidates.map((candidate) => {
                      const checked = selectedBundleIds.includes(candidate.id);
                      return (
                        <label
                          key={candidate.id}
                          className="flex min-h-14 items-center gap-3 px-3 py-2 text-sm text-cacau"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!checked && selectedBundleIds.length >= 3}
                            onChange={(event) =>
                              onChange({
                                ...value,
                                compre_junto_ids: event.target.checked
                                  ? [...selectedBundleIds, candidate.id]
                                  : selectedBundleIds.filter((id) => id !== candidate.id),
                              })
                            }
                            className="h-4 w-4 shrink-0 accent-[#304a32]"
                          />
                          <ImageWithFallback
                            src={candidate.url_imagem}
                            alt=""
                            className="h-10 w-10 shrink-0 object-contain"
                          />
                          <span className="min-w-0 flex-1 truncate">{candidate.nome}</span>
                          <strong className="shrink-0 text-xs">
                            {formatBRL(Number(candidate.preco_atual))}
                          </strong>
                        </label>
                      );
                    })}
                    {bundleCandidates.length === 0 && (
                      <p className="p-3 text-xs text-text-light">
                        Nenhum complemento com custo, preço, foto HTTPS e disponibilidade informada
                        elegíveis no catálogo.
                      </p>
                    )}
                  </div>
                  <p className="mb-0 mt-2 text-[11px] text-text-light">
                    {selectedBundleIds.length}/3 selecionados. A lista aparece no produto somente
                    enquanto cada complemento continuar disponível no catálogo.
                  </p>
                </div>
              </section>
              <section className="rounded-xl border border-cacau/10 bg-white p-4 lg:col-span-2 sm:p-5">
                <div className="mb-4 flex items-center gap-3 border-b border-cacau/10 pb-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf1e9] text-deep-green">
                    <Images size={19} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-deep-green">Fotos do produto</h3>
                    <p className="mt-0.5 text-xs text-text-light">
                      Defina a imagem principal e organize as fotos da galeria.
                    </p>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={label}>Imagem do produto *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={value.imagem_url}
                        onChange={(e) => onChange({ ...value, imagem_url: e.target.value })}
                        placeholder="Insira a URL ou faça upload de um arquivo"
                        className={field}
                      />
                      <label className="flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-deep-green px-4 text-sm font-semibold text-white transition-colors hover:bg-[#243a28]">
                        {uploading ? "Carregando..." : "Upload"}
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
                      <ImageWithFallback
                        src={value.imagem_url}
                        alt="Prévia"
                        className="mt-2 h-32 w-32 border border-cacau/10 object-cover"
                      />
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label}>Fotos adicionais</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-cacau/20 px-4 py-2 text-sm font-semibold text-cacau transition-colors hover:border-gold hover:text-deep-green">
                        {uploading ? "Enviando…" : "Adicionar fotos"}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGalleryUpload}
                          disabled={uploading}
                          className="sr-only"
                        />
                      </label>
                      <span className="text-xs text-text-light">
                        A primeira foto é a principal; as demais aparecem na galeria do produto.
                      </span>
                    </div>
                    <textarea
                      value={(value.imagens ?? []).join("\n")}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          imagens: e.target.value
                            .split(/\r?\n/)
                            .map((url) => url.trim())
                            .filter(Boolean),
                        })
                      }
                      rows={3}
                      placeholder="Uma URL de foto por linha"
                      className={`${field} mt-2`}
                    />
                    {!!value.imagens?.length && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {value.imagens.map((src, index) => (
                          <ImageWithFallback
                            key={`${src}-${index}`}
                            src={src}
                            alt={`Foto adicional ${index + 1}`}
                            className="h-16 w-16 border border-cacau/10 object-contain"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
          <footer className="z-10 flex shrink-0 flex-col-reverse gap-2 border-t border-cacau/10 bg-[#fbfaf6] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-text-light">
              As alterações só entram na loja depois de salvar.
            </p>
            <div className="flex gap-2 sm:justify-end">
              <button
                type="button"
                onClick={requestClose}
                className="min-h-11 flex-1 rounded-lg border border-cacau/20 px-5 py-2.5 text-sm font-semibold text-cacau transition-colors hover:border-gold hover:text-deep-green sm:flex-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving || uploading}
                className="min-h-11 flex-1 rounded-lg bg-deep-green px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#243a28] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                {saving ? "Salvando…" : "Salvar produto"}
              </button>
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
