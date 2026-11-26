import { adminLocalHome } from "../lib/home-local.functions";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  CircleDollarSign,
  Images,
  Layers3,
  LayoutGrid,
  List,
  Lock,
  LogOut,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Ruler,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MobiliLogo } from "@/components/MobiliLogo";
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
  quickUpdateProductPrice,
  upsertProduto,
  type ProdutoInput,
  type ProdutoAdmin,
  type ProdutoScrapImport,
  type ProdutoScrapImportInput,
  type PriceVariation,
} from "@/lib/admin.functions";
import { formatBRL } from "@/lib/constants";
import { cardInstallment, cardQuote } from "@/lib/payment";
import { hasRealReferencePrice } from "@/lib/price-reference";
import { productMeasurements } from "@/lib/product-measurements";
import { productSeo } from "@/lib/seo";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { AdminStudio } from "@/components/admin-studio/AdminStudio";
import { AdminOverview } from "@/components/AdminOverview";
import { ADMIN_REVIEW_QUERY_LIMIT } from "@/lib/admin-overview";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { ProductThumbnail, ProductIdentity } from "@/components/admin/ProductThumbnail";
import { SupplierPricingPanel } from "@/components/admin/SupplierPricingPanel";
import { ScrapedImportsPanel } from "@/components/admin/ScrapedImportsPanel";
import { GoogleShoppingPanel } from "@/components/admin/GoogleShoppingPanel";
import { StoreOrdersPanel } from "@/components/admin/StoreOrdersPanel";
import { createRemoteStudioTransport } from "@/lib/admin-studio-remote";
import { isEligibleBundleProduct } from "@/lib/product-bundles";
import type { AdminViewId } from "@/lib/admin-navigation";
import {
  buildCategoryCounts,
  filterAndSortAdminProducts,
  parsePriceFilter,
  productStatus,
  type ProductQuickFilter,
  type ProductSortOption,
  type ProductStatus,
} from "@/lib/admin-filters";
import "@/admin-theme.css";

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
    <div className="admin-login-shell">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <MobiliLogo className="admin-login-logo" />
          <span className="admin-login-badge">
            <Lock size={13} aria-hidden="true" />
            Acesso restrito
          </span>
        </div>
        <div className="admin-login-body">
          <h1>Painel administrativo</h1>
          <p className="admin-login-subtitle">
            Entre para precificar móveis, revisar importações e gerenciar o catálogo da Mobi.
          </p>
          <form onSubmit={submit} className="admin-login-form">
            <div className="admin-login-field">
              <label htmlFor="admin-password-input">Senha administrativa</label>
              <input
                id="admin-password-input"
                type="password"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Digite sua senha"
                autoFocus
              />
            </div>
            <button type="submit" disabled={loading} className="admin-login-submit">
              {loading ? "Verificando…" : "Entrar"}
            </button>
          </form>
        </div>
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
  status_estoque: "nao_verificado",
  compre_junto_ids: [],
  vitrine_black_friday: null,
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
  return <span className={`admin-status-pill is-${status}`}>{STATUS_LABELS[status]}</span>;
}

export function AdminDashboard({
  password,
  onLogout,
  demonstration = false,
}: {
  password: string;
  onLogout: () => void;
  demonstration?: boolean;
}) {
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
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState<ProdutoAdmin | null>(null);
  const [editorSection, setEditorSection] = useState("dados");
  const [editing, setEditing] = useState<ProdutoInput | null>(null);
  const [activeScrapedImport, setActiveScrapedImport] = useState<ProdutoScrapImport | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [workspaceTab, setWorkspaceTab] = useState<AdminViewId>("overview");
  const [statusFilter, setStatusFilter] = useState<"all" | ProductStatus>("all");
  const [quickFilter, setQuickFilter] = useState<ProductQuickFilter>("all");
  const [productSort, setProductSort] = useState<ProductSortOption>("default");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [priceField, setPriceField] = useState<"site" | "supplier">("site");
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
  const productCategoryOptions = useMemo(() => {
    const base = filterAndSortAdminProducts(produtos, {
      query: search,
      supplierFilter,
      missingSupplierKey: MISSING_SUPPLIER_FILTER,
      categoryKey: "all",
      statusFilter,
      quickFilter,
      priceField,
      minPrice: minimumPrice,
      maxPrice: maximumPrice,
      sort: "default",
    });
    return buildCategoryCounts(base);
  }, [
    produtos,
    search,
    supplierFilter,
    statusFilter,
    quickFilter,
    priceField,
    minimumPrice,
    maximumPrice,
  ]);
  const filteredProdutos = useMemo(
    () =>
      filterAndSortAdminProducts(produtos, {
        query: search,
        supplierFilter,
        missingSupplierKey: MISSING_SUPPLIER_FILTER,
        categoryKey: categoryFilter,
        statusFilter,
        quickFilter,
        priceField,
        minPrice: minimumPrice,
        maxPrice: maximumPrice,
        sort: productSort,
      }),
    [
      produtos,
      search,
      supplierFilter,
      categoryFilter,
      statusFilter,
      quickFilter,
      priceField,
      minimumPrice,
      maximumPrice,
      productSort,
    ],
  );
  const quickCounts = useMemo(() => {
    const base = filterAndSortAdminProducts(produtos, {
      query: search,
      supplierFilter,
      missingSupplierKey: MISSING_SUPPLIER_FILTER,
      categoryKey: categoryFilter,
      statusFilter,
      quickFilter: "all",
      priceField,
      minPrice: minimumPrice,
      maxPrice: maximumPrice,
      sort: "default",
    });
    return {
      all: base.length,
      "missing-photo": base.filter((p) => !/^https?:\/\//i.test(p.url_imagem ?? "")).length,
      "missing-measures": base.filter((p) => !(p.medidas ?? "").trim()).length,
      "out-of-stock": base.filter((p) => p.status_estoque === "esgotado").length,
      "black-friday": base.filter((p) => p.vitrine_black_friday === true).length,
      "below-cost": base.filter((p) => {
        const c = Number(p.preco_atacado ?? 0);
        const s = Number(p.preco_atual ?? 0);
        return c > 0 && s > 0 && s < c;
      }).length,
    };
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
    quickFilter,
    productSort,
    priceField,
    minimumPrice,
    maximumPrice,
  ]);

  useEffect(() => {
    if (
      categoryFilter !== "all" &&
      productCategoryOptions.length > 0 &&
      !productCategoryOptions.some((opt) => opt.key === categoryFilter)
    ) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, productCategoryOptions]);

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
    setEditorSection("dados");
    setActiveScrapedImport(null);
    setEditing({ ...EMPTY });
  };
  const startEdit = (p: ProdutoAdmin, section = "dados") => {
    setEditorSection(section);
    setActiveScrapedImport(null);
    setEditing({
      id: p.id,
      vitrine_black_friday: p.vitrine_black_friday ?? null,
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
      status_estoque:
        p.status_estoque === "disponivel" ||
        p.status_estoque === "esgotado" ||
        p.status_estoque === "revisar"
          ? p.status_estoque
          : "nao_verificado",
      compre_junto_ids: p.compre_junto_ids ?? [],
    });
  };

  const startScrapedEdit = (product: ProdutoScrapImport) => {
    setEditorSection("preco");
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

  const remove = (id: string) => setRemoving(produtos.find((product) => product.id === id) ?? null);
  const confirmRemoval = async () => {
    if (!removing || deleting) return;
    setDeleting(true);
    const id = removing.id;
    try {
      await deleteProduto({ data: { password, id } });
      setRemoving(null);
      toast.success("Produto removido.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickSavePrice = async (product: ProdutoAdmin, nextPrice: number) => {
    if (demonstration) {
      toast.info("Edição rápida desativada nesta prévia isolada.");
      return;
    }
    const updated = await quickUpdateProductPrice({
      data: { password, id: product.id, preco_atual: nextPrice },
    });
    qc.setQueryData<ProdutoAdmin[]>(["admin-produtos"], (current) =>
      current?.map((item) =>
        item.id === updated.id
          ? {
              ...item,
              preco_atual: updated.preco_atual,
              preco_antigo: updated.preco_antigo,
              variacoes_preco:
                updated.variacoes_preco as unknown as ProdutoAdmin["variacoes_preco"],
            }
          : item,
      ),
    );
    toast.success(`Preço de ${product.nome} salvo (${formatBRL(updated.preco_atual)}).`);
  };

  const clearFilters = () => {
    setSearch("");
    setSupplierFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
    setQuickFilter("all");
    setProductSort("default");
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
  const hasAnyProductFilter =
    search.trim() !== "" ||
    supplierFilter !== "all" ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    quickFilter !== "all" ||
    productSort !== "default" ||
    priceField !== "site" ||
    minimumPrice.trim() !== "" ||
    maximumPrice.trim() !== "";

  return (
    <AdminWorkspace
      area={workspaceTab}
      demonstration={demonstration}
      badges={{ fornecedores: totals.awaiting, revisao: pendingScrapedProducts.length }}
      onNavigate={setWorkspaceTab}
      onLogout={onLogout}
      onSearch={(query) => {
        clearFilters();
        setSearch(query);
        setWorkspaceTab("produtos");
      }}
    >
      {workspaceTab === "produtos" && (
        <div className="aw-editor-toolbar admin-page-header">
          <div>
            <h1>Produtos</h1>
            <p className="admin-page-subtitle">
              Busque, filtre por fornecedor ou categoria e edite custos e preços de venda.
            </p>
          </div>
          <button type="button" className="aw-action admin-btn-primary" onClick={startNew}>
            <Plus size={16} aria-hidden="true" /> Novo produto
          </button>
        </div>
      )}
      {storageMode.isError && (
        <div role="alert" className="pm-note">
          Não foi possível confirmar onde salvar os rascunhos.{" "}
          <button type="button" className="pm-button" onClick={() => storageMode.refetch()}>
            Tentar novamente
          </button>
        </div>
      )}
      <AdminStudio
        workspaceTransport={workspaceTransport}
        homePublicationEnabled={storageMode.data?.homePublicationEnabled ?? false}
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
        className="mobi-kpi-strip"
        aria-label="Resumo do catálogo"
      >
        <button
          type="button"
          onClick={() => selectSummary("all")}
          aria-pressed={statusFilter === "all"}
          className="mobi-kpi-cell"
        >
          <span className="mobi-kpi-head">
            <span className="mobi-kpi-label">Total</span>
          </span>
          <span className="mobi-kpi-value-row">
            <strong>{produtos.length.toLocaleString("pt-BR")}</strong>
            <span className="mobi-kpi-hint">Todos os itens</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => selectSummary("published")}
          aria-pressed={statusFilter === "published"}
          className="mobi-kpi-cell is-green"
        >
          <span className="mobi-kpi-head">
            <span className="mobi-kpi-label">Aptos para exibição</span>
          </span>
          <span className="mobi-kpi-value-row">
            <strong>{totals.published.toLocaleString("pt-BR")}</strong>
            <span className="mobi-kpi-hint">No site</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => selectSummary("awaiting")}
          aria-pressed={statusFilter === "awaiting"}
          className="mobi-kpi-cell is-gold"
        >
          <span className="mobi-kpi-head">
            <span className="mobi-kpi-label">Aguardando preço</span>
          </span>
          <span className="mobi-kpi-value-row">
            <strong>{totals.awaiting.toLocaleString("pt-BR")}</strong>
            <span className="mobi-kpi-hint">Sem preço</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => selectSummary("incomplete")}
          aria-pressed={statusFilter === "incomplete"}
          className="mobi-kpi-cell is-danger"
        >
          <span className="mobi-kpi-head">
            <span className="mobi-kpi-label">Incompletos</span>
          </span>
          <span className="mobi-kpi-value-row">
            <strong>{totals.incomplete.toLocaleString("pt-BR")}</strong>
            <span className="mobi-kpi-hint">Falta dado</span>
          </span>
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
            demonstration={demonstration}
            onPrice={(product) => startEdit(product, "preco")}
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
            onEdit={(product) => startEdit(product)}
            onNavigate={setWorkspaceTab}
          />
        </section>
        <section
          hidden={workspaceTab !== "revisao"}
          data-state={workspaceTab === "revisao" ? "active" : "inactive"}
          className="admin-workspace-panel"
          aria-label="revisao"
        >
          <ScrapedImportsPanel
            items={pendingScrapedProducts}
            importing={importing}
            isFetching={isFetchingScraped}
            isError={isScrapedError}
            errorMessage={scrapedError instanceof Error ? scrapedError.message : undefined}
            onImportFile={handleScrapeImport}
            onRefresh={() => void refreshScrapedProducts()}
            onReview={startScrapedEdit}
          />
        </section>
        <section
          hidden={workspaceTab !== "produtos"}
          data-state={workspaceTab === "produtos" ? "active" : "inactive"}
          className="admin-workspace-panel"
          aria-label="produtos"
        >
          <div className="admin-workbench">
            <section id="admin-product-filters" className="admin-workbench-filters scroll-mt-4">
              <div className="admin-filter-row-main admin-filter-row-products">
                <label className="admin-filter-field admin-filter-search">
                  <span>Buscar no catálogo</span>
                  <div className="admin-input-with-icon">
                    <Search size={16} aria-hidden="true" />
                    <input
                      type="search"
                      aria-label="Buscar produto no painel"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Nome, SKU ou categoria…"
                    />
                  </div>
                </label>

                <label className="admin-filter-field">
                  <span>Fornecedor</span>
                  <select
                    aria-label="Filtrar fornecedor"
                    value={supplierFilter}
                    onChange={(event) => setSupplierFilter(event.target.value)}
                  >
                    <option value="all">Todos ({produtos.length})</option>
                    {supplierPricingGroups.map((group) => (
                      <option key={group.key} value={group.key}>
                        {group.label} ({group.total})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-filter-field">
                  <span>Categoria</span>
                  <select
                    aria-label="Filtrar categoria"
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                  >
                    <option value="all">
                      Todas ({productCategoryOptions.reduce((sum, item) => sum + item.count, 0)})
                    </option>
                    {productCategoryOptions.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.label} ({category.count})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-filter-field">
                  <span>Situação</span>
                  <select
                    aria-label="Filtrar estado de publicação"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "all" | ProductStatus)
                    }
                  >
                    <option value="all">Todos os estados</option>
                    <option value="published">Aptos na loja</option>
                    <option value="awaiting">Aguardando preço</option>
                    <option value="incomplete">Dados incompletos</option>
                  </select>
                </label>

                <label className="admin-filter-field">
                  <span>Ordenar por</span>
                  <select
                    aria-label="Ordenar produtos"
                    value={productSort}
                    onChange={(event) => setProductSort(event.target.value as ProductSortOption)}
                  >
                    <option value="default">Padrão (por fornecedor)</option>
                    <option value="cost-asc">Menor custo</option>
                    <option value="cost-desc">Maior custo</option>
                    <option value="price-asc">Menor preço no site</option>
                    <option value="price-desc">Maior preço no site</option>
                    <option value="margin-asc">Menor diferença bruta</option>
                    <option value="name-asc">Nome (A–Z)</option>
                  </select>
                </label>
              </div>

              <div className="admin-filter-row-secondary">
                <div
                  className="pricing-filter-pills"
                  role="group"
                  aria-label="Atalhos de conferência"
                >
                  {(
                    [
                      { id: "all", label: "Todos", count: quickCounts.all },
                      {
                        id: "missing-photo",
                        label: "Sem foto",
                        count: quickCounts["missing-photo"],
                      },
                      {
                        id: "missing-measures",
                        label: "Sem medidas",
                        count: quickCounts["missing-measures"],
                      },
                      {
                        id: "out-of-stock",
                        label: "Esgotados",
                        count: quickCounts["out-of-stock"],
                      },
                      {
                        id: "black-friday",
                        label: "Black Friday",
                        count: quickCounts["black-friday"],
                      },
                      {
                        id: "below-cost",
                        label: "Abaixo do custo",
                        count: quickCounts["below-cost"],
                      },
                    ] as const
                  )
                    .filter(
                      (pill) => pill.id === "all" || pill.count > 0 || quickFilter === pill.id,
                    )
                    .map((pill) => (
                      <button
                        key={pill.id}
                        type="button"
                        className="pricing-filter-pill"
                        aria-pressed={quickFilter === pill.id}
                        onClick={() => setQuickFilter(pill.id)}
                      >
                        <span>{pill.label}</span>
                        <b>{pill.count.toLocaleString("pt-BR")}</b>
                      </button>
                    ))}
                </div>

                <div className="admin-products-secondary-right">
                  <div className="admin-cost-range" aria-label="Filtrar por faixa de valor">
                    <SlidersHorizontal size={14} aria-hidden="true" />
                    <select
                      aria-label="Campo da faixa de preço"
                      value={priceField}
                      onChange={(event) => setPriceField(event.target.value as "site" | "supplier")}
                      className="admin-range-field-select"
                    >
                      <option value="site">Preço site</option>
                      <option value="supplier">Custo</option>
                    </select>
                    <input
                      inputMode="decimal"
                      value={minimumPrice}
                      onChange={(event) => setMinimumPrice(event.target.value)}
                      placeholder="Mín."
                      aria-label="Valor mínimo em reais"
                      aria-invalid={invalidPrices}
                    />
                    <span className="admin-cost-sep">até</span>
                    <input
                      inputMode="decimal"
                      value={maximumPrice}
                      onChange={(event) => setMaximumPrice(event.target.value)}
                      placeholder="Máx."
                      aria-label="Valor máximo em reais"
                      aria-invalid={invalidPrices}
                    />
                  </div>

                  <div className="admin-view-toggle" role="group" aria-label="Modo de visualização">
                    <button
                      type="button"
                      aria-pressed={viewMode === "table"}
                      onClick={() => setViewMode("table")}
                      title="Lista compacta"
                    >
                      <List size={15} aria-hidden="true" />
                      <span>Lista</span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={viewMode === "cards"}
                      onClick={() => setViewMode("cards")}
                      title="Cartões detalhados"
                    >
                      <LayoutGrid size={15} aria-hidden="true" />
                      <span>Cartões</span>
                    </button>
                  </div>
                </div>
              </div>

              {invalidPrices && (
                <p role="alert" className="admin-filter-error">
                  Informe valores válidos; o mínimo não pode ser maior que o máximo.
                </p>
              )}

              {hasAnyProductFilter && (
                <div className="admin-active-chips">
                  {search.trim() && (
                    <button type="button" className="admin-chip" onClick={() => setSearch("")}>
                      Busca: “{search.trim()}” <X size={13} aria-hidden="true" />
                    </button>
                  )}
                  {categoryFilter !== "all" && (
                    <button
                      type="button"
                      className="admin-chip"
                      onClick={() => setCategoryFilter("all")}
                    >
                      Categoria:{" "}
                      {productCategoryOptions.find((c) => c.key === categoryFilter)?.label ??
                        categoryFilter}{" "}
                      <X size={13} aria-hidden="true" />
                    </button>
                  )}
                  <button type="button" className="admin-reset-filters" onClick={clearFilters}>
                    <RotateCcw size={13} aria-hidden="true" /> Limpar filtros
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
                <div className="admin-workbench-status-bar">
                  <span>
                    {filteredProdutos.length.toLocaleString("pt-BR")} produto(s) encontrado(s)
                  </span>
                  <span>
                    Página {page} de {totalPages}
                  </span>
                </div>
                {visibleProdutos.length === 0 ? (
                  <div className="border border-cacau/10 bg-white p-8 text-center text-sm text-text-light">
                    <p>Nenhum produto corresponde aos filtros atuais.</p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-3 inline-flex min-h-11 items-center rounded-md border border-cacau/20 px-4 text-xs font-semibold text-cacau hover:border-gold hover:text-deep-green"
                    >
                      Limpar filtros
                    </button>
                  </div>
                ) : viewMode === "table" ? (
                  <div className="admin-products-table-wrap">
                    <div
                      className="admin-products-table"
                      role="table"
                      aria-label="Produtos do catálogo"
                    >
                      <div className="admin-products-row admin-products-head" role="row">
                        <span role="columnheader">Produto / Categoria / Fornecedor</span>
                        <span role="columnheader">Custo</span>
                        <span role="columnheader">Preço site / 10x</span>
                        <span role="columnheader">Dif. bruta</span>
                        <span role="columnheader">Situação</span>
                        <span role="columnheader">
                          <span className="aw-sr-only">Ações</span>
                        </span>
                      </div>
                      {visibleProdutos.map((p) => {
                        const status = productStatus(p);
                        const difference = grossPriceDifference(p);
                        const sitePrice = Number(p.preco_atual ?? 0);
                        return (
                          <div className="admin-products-row" role="row" key={p.id}>
                            <div className="admin-products-cell-main" role="cell">
                              <ProductIdentity product={p}>
                                <small>
                                  {[
                                    p.categoria || "Sem categoria",
                                    p.sku || "Sem SKU",
                                    sourceName(p),
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </small>
                              </ProductIdentity>
                            </div>
                            <span className="supplier-pricing-value" role="cell" data-label="Custo">
                              {moneyOrDash(p.preco_atacado)}
                            </span>
                            <span
                              className="supplier-pricing-value supplier-pricing-site-price"
                              role="cell"
                              data-label="Preço no site"
                            >
                              <strong>{moneyOrDash(p.preco_atual)}</strong>
                              {sitePrice > 0 && (
                                <small>10x de {formatBRL(cardInstallment(sitePrice, 10))}</small>
                              )}
                            </span>
                            <span
                              className={`supplier-pricing-value ${difference == null ? "is-muted" : difference >= 0 ? "is-positive" : "is-negative"}`}
                              role="cell"
                              data-label="Diferença bruta"
                            >
                              {grossPriceDifferenceLabel(p)}
                            </span>
                            <span
                              className="admin-products-status-cell"
                              role="cell"
                              data-label="Situação"
                            >
                              <StatusBadge status={status} />
                            </span>
                            <div className="admin-products-actions" role="cell">
                              <button
                                type="button"
                                onClick={() => startEdit(p, "preco")}
                                className="admin-row-btn-price"
                                aria-label={`Precificar ${p.nome}`}
                              >
                                <CircleDollarSign size={14} aria-hidden="true" />
                                <span>Precificar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => startEdit(p, "dados")}
                                className="admin-row-btn-edit"
                                aria-label={`Editar ${p.nome}`}
                              >
                                <Pencil size={14} aria-hidden="true" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => remove(p.id)}
                                aria-label={`Remover ${p.nome}`}
                                className="admin-row-btn-delete"
                              >
                                <Trash2 size={14} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="admin-products-cards-wrap space-y-5">
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
                            const sitePrice = Number(p.preco_atual ?? 0);
                            return (
                              <article
                                key={p.id}
                                className="rounded-lg border border-cacau/10 bg-white p-4 transition-shadow hover:shadow-premium sm:p-5"
                              >
                                <div className="flex gap-3">
                                  <ProductThumbnail product={p} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <button
                                        type="button"
                                        onClick={() => startEdit(p)}
                                        className="min-h-11 text-left font-semibold text-cacau hover:text-deep-green"
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
                                        <span className="text-text-light">
                                          Fonte não cadastrada
                                        </span>
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
                                    {sitePrice > 0 && (
                                      <div className="mt-0.5 text-[11px] text-text-light">
                                        10x de {formatBRL(cardInstallment(sitePrice, 10))}
                                      </div>
                                    )}
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
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                                  <span className="text-xs text-text-light">
                                    {p.vendas_ultimos_30_dias ?? 0} venda(s) em 30 dias
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => startEdit(p, "preco")}
                                      className="inline-flex min-h-11 items-center gap-1.5 rounded border border-deep-green/30 bg-[#edf4e9] px-3 py-2 text-xs font-bold uppercase tracking-wider text-deep-green hover:border-gold"
                                    >
                                      <CircleDollarSign className="h-3.5 w-3.5" /> Precificar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => startEdit(p, "dados")}
                                      className="inline-flex min-h-11 items-center gap-1.5 rounded border border-cacau/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-cacau hover:border-gold hover:text-deep-green"
                                    >
                                      <Pencil className="h-3.5 w-3.5" /> Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => remove(p.id)}
                                      aria-label={`Remover ${p.nome}`}
                                      className="min-h-11 min-w-11 rounded border border-cacau/20 p-2 text-cacau hover:border-destructive hover:text-destructive"
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
                  <div className="supplier-pricing-pagination" aria-label="Paginação dos produtos">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {page} de {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={page === totalPages}
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
              onEdit={(product) => startEdit(product, "preco")}
              onQuickSavePrice={handleQuickSavePrice}
            />
          )}
        </section>
        <section
          hidden={workspaceTab !== "shopping"}
          data-state={workspaceTab === "shopping" ? "active" : "inactive"}
          className="admin-workspace-panel"
          aria-label="Google Shopping"
        >
          <GoogleShoppingPanel
            password={password}
            products={produtos}
            onUpdated={refresh}
            demonstration={demonstration}
          />
        </section>
        <section
          hidden={workspaceTab !== "pedidos"}
          data-state={workspaceTab === "pedidos" ? "active" : "inactive"}
          className="admin-workspace-panel"
          aria-label="Pedidos do site"
        >
          <StoreOrdersPanel password={password} />
        </section>
      </div>

      <Dialog.Root
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open && !deleting) setRemoving(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="aw-overlay" />
          <Dialog.Content className="aw-help">
            <Dialog.Title>Remover produto da vitrine?</Dialog.Title>
            <Dialog.Description>
              Confira o móvel antes de confirmar. Esta ação remove o cadastro da loja.
            </Dialog.Description>
            <ProductIdentity product={removing ?? undefined} />
            <div className="pm-actions mt-4 justify-between">
              <Dialog.Close className="aw-action" disabled={deleting}>
                Cancelar remoção
              </Dialog.Close>
              <button
                type="button"
                className="aw-action aw-action-danger"
                onClick={confirmRemoval}
                disabled={deleting}
              >
                {deleting ? "Removendo…" : "Confirmar remoção"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {editing && (
        <ProductForm
          value={editing}
          initialSection={editorSection}
          demonstration={demonstration}
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
  demonstration = false,
  initialSection = "dados",
  value,
  products,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  initialSection?: string;
  demonstration?: boolean;
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
  const [section, setSection] = useState(initialSection);
  const [bundleSearch, setBundleSearch] = useState("");
  const [coresText, setCoresText] = useState(() => (value.cores ?? []).join(", "));
  const previousProductId = useRef(value.id);
  const editorScroll = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const originalValue = useRef(JSON.stringify(value));
  useEffect(() => {
    if (previousProductId.current !== value.id) {
      previousProductId.current = value.id;
      setCoresText((value.cores ?? []).join(", "));
    }
  }, [value.id, value.cores]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(value) !== originalValue.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [value]);
  const hasUnsavedChanges = JSON.stringify(value) !== originalValue.current;
  const supplierPrice = Number(value.preco_fornecedor ?? 0);
  const sitePrice = Number(value.preco_novo ?? 0);
  const cardTerms = sitePrice > 0 ? cardQuote(sitePrice, 10) : null;
  const pricingDifference = supplierPrice > 0 && sitePrice > 0 ? sitePrice - supplierPrice : null;
  const pricingStatus =
    sitePrice > 0
      ? "Preço do site informado"
      : supplierPrice > 0
        ? "Falta preço no site"
        : "Sem preços cadastrados";
  const parsedMeasurements = productMeasurements(value.medidas ?? null);
  const seoSlug =
    value.slug?.trim() ||
    value.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    "produto";
  const seoPreview = productSeo({
    nome: value.nome.trim() || "Móvel Mobi",
    slug: seoSlug,
    categoria: value.categoria?.trim() || "Móveis",
    descricao: value.descricao ?? "",
    medidas: value.medidas ?? null,
    cores: value.cores ?? null,
    imagem_url: value.imagem_url ?? "",
    imagens: value.imagens ?? [],
    sku: value.referencia ?? null,
    preco_novo: sitePrice,
    status_estoque: value.status_estoque ?? "nao_verificado",
    variacoes_preco: (value.variacoes_preco ?? []).map((item) => ({
      sale_price: item.sale_price ?? null,
    })),
  });
  const seoChecks = [
    { label: "Foto HTTPS", ok: /^https?:\/\//i.test(value.imagem_url?.trim() ?? "") },
    { label: "Medidas reconhecidas", ok: parsedMeasurements.length > 0 },
    { label: "Cor informada", ok: (value.cores ?? []).length > 0 },
    { label: "SKU único", ok: Boolean(seoPreview.structured.sku) },
    { label: "Descrição útil", ok: (value.descricao?.trim().length ?? 0) >= 40 },
    {
      label: "Disponibilidade confirmada",
      ok: value.status_estoque === "disponivel" || value.status_estoque === "esgotado",
    },
  ];
  const photoCount =
    (value.imagem_url?.trim() ? 1 : 0) + (value.imagens?.filter((url) => url.trim()).length ?? 0);
  const missingBasics = !value.nome.trim() || !value.categoria?.trim();
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
    if (demonstration) {
      toast.info("Envio de arquivos desligado nesta prévia isolada.");
      return;
    }
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
    if (demonstration) {
      toast.info("Envio de arquivos desligado nesta prévia isolada.");
      return;
    }
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

          <nav className="product-editor-nav" aria-label="Seções do produto">
            {(
              [
                [
                  "dados",
                  "Dados do móvel",
                  missingBasics ? "Faltam obrigatórios" : "",
                  missingBasics,
                ],
                [
                  "fotos",
                  "Fotos",
                  photoCount > 0 ? String(photoCount) : "Sem foto",
                  photoCount === 0,
                ],
                [
                  "preco",
                  "Preço e fornecedor",
                  sitePrice > 0 ? formatBRL(sitePrice) : "Sem preço",
                  !(sitePrice > 0),
                ],
                ["extras", "Compre junto", `${selectedBundleIds.length}/3`, false],
              ] as const
            ).map(([key, title, pill, isAlert]) => (
              <button
                type="button"
                key={key}
                aria-pressed={section === key}
                onClick={() => {
                  setSection(key);
                  editorScroll.current?.scrollTo({ top: 0 });
                }}
              >
                <span>{title}</span>
                {pill && (
                  <small className={`product-editor-tab-pill${isAlert ? " is-alert" : ""}`}>
                    {pill}
                  </small>
                )}
              </button>
            ))}
          </nav>
          <div className="product-editor-identity">
            <ProductThumbnail
              product={{
                nome: value.nome || "Novo produto",
                url_imagem: value.imagem_url,
                imagens: value.imagens,
              }}
            />
            <strong>{value.nome || "Seu novo produto"}</strong>
            <span>{value.referencia || "Sem referência"}</span>
          </div>
          <div ref={editorScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid items-start gap-4 p-4 sm:p-6 lg:grid-cols-2">
              <section
                hidden={section !== "dados"}
                className="product-editor-section rounded-xl border border-cacau/10 bg-white p-4 lg:col-span-2 sm:p-5"
              >
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
                    <label htmlFor="product-field-1" className={label}>
                      Nome *
                    </label>
                    <input
                      id="product-field-1"
                      value={value.nome}
                      onChange={(e) => onChange({ ...value, nome: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="product-field-2" className={label}>
                      Slug (URL amigável) — deixe em branco para gerar do nome
                    </label>
                    <input
                      id="product-field-2"
                      value={value.slug ?? ""}
                      onChange={(e) => onChange({ ...value, slug: e.target.value })}
                      placeholder="ex: poltrona-velvet"
                      className={field}
                    />
                  </div>
                  <div>
                    <label htmlFor="product-field-3" className={label}>
                      Referência / SKU
                    </label>
                    <input
                      id="product-field-3"
                      value={value.referencia ?? ""}
                      onChange={(e) => onChange({ ...value, referencia: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div>
                    <label htmlFor="product-field-4" className={label}>
                      Categoria *
                    </label>
                    <select
                      id="product-field-4"
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
                    <label htmlFor="product-black-friday" className={label}>
                      Vitrine Black Friday
                    </label>
                    <select
                      id="product-black-friday"
                      className={field}
                      value={
                        value.vitrine_black_friday == null
                          ? "automatico"
                          : value.vitrine_black_friday
                            ? "incluir"
                            : "ocultar"
                      }
                      onChange={(event) =>
                        onChange({
                          ...value,
                          vitrine_black_friday:
                            event.target.value === "automatico"
                              ? null
                              : event.target.value === "incluir",
                        })
                      }
                    >
                      <option value="automatico">Automático: seguir oferta cadastrada</option>
                      <option value="incluir">Incluir na Black Friday</option>
                      <option value="ocultar">Ocultar da Black Friday</option>
                    </select>
                    <p className="mt-1 text-xs text-text-light">
                      Controla a vitrine e o selo, sem alterar o preço.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="product-field-5" className={label}>
                      Ordem na categoria
                    </label>
                    <input
                      id="product-field-5"
                      type="number"
                      value={value.ordem ?? 0}
                      onChange={(e) => onChange({ ...value, ordem: Number(e.target.value) })}
                      className={field}
                    />
                  </div>
                </div>
              </section>
              <section
                hidden={section !== "preco"}
                className="product-editor-section rounded-xl border border-cacau/10 bg-white p-4 lg:col-span-2 sm:p-5"
              >
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
                      <label htmlFor="product-field-6" className={label}>
                        Custo informado pelo fornecedor (R$)
                      </label>
                      <input
                        id="product-field-6"
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
                      <label htmlFor="product-field-7" className={label}>
                        Preço no site (R$) *
                      </label>
                      <input
                        id="product-field-7"
                        type="number"
                        step="0.01"
                        value={value.preco_novo || ""}
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
                    <label htmlFor="product-field-8" className={label}>
                      Preço anterior (opcional)
                    </label>
                    <input
                      id="product-field-8"
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
                    <label htmlFor="product-field-9" className={label}>
                      Fornecedor (uso interno)
                    </label>
                    <input
                      id="product-field-9"
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
                  <div className="sm:col-span-2 rounded-lg border border-cacau/10 bg-white p-3">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-cacau">
                      Conferência de preço
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                        <div className="text-xs text-text-light">Cartão 10x</div>
                        <div className="mt-1 font-bold text-deep-green">
                          {cardTerms
                            ? `10x de ${formatBRL(cardTerms.approximateInstallment)}`
                            : "—"}
                        </div>
                        {cardTerms && (
                          <div className="text-[11px] text-text-light">
                            Total {formatBRL(cardTerms.total)}
                          </div>
                        )}
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
                    <label htmlFor="product-field-10" className={label}>
                      Link do fornecedor / fonte do preço
                    </label>
                    <input
                      id="product-field-10"
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
              <section
                hidden={section !== "dados"}
                className="product-editor-section min-w-0 rounded-xl border border-cacau/10 bg-white p-4 lg:col-span-2 sm:p-5"
              >
                <div className="mb-4 flex items-center gap-3 border-b border-cacau/10 pb-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf1e9] text-deep-green">
                    <Ruler size={19} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-deep-green">Detalhes do produto</h3>
                    <p className="mt-0.5 text-xs text-text-light">
                      Informações úteis para apresentar e filtrar o móvel.
                    </p>
                  </div>
                </div>
                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="product-field-11" className={label}>
                      Vendas nos últimos 30 dias
                    </label>
                    <input
                      id="product-field-11"
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
                    <label className={label} htmlFor="admin-product-stock-status">
                      Disponibilidade no site e Google Shopping
                    </label>
                    <select
                      id="admin-product-stock-status"
                      value={value.status_estoque ?? "nao_verificado"}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          status_estoque: e.target.value as ProdutoInput["status_estoque"],
                        })
                      }
                      className={field}
                    >
                      <option value="nao_verificado">Não verificado (fora do feed TSV)</option>
                      <option value="disponivel">Disponível (in_stock)</option>
                      <option value="esgotado">Esgotado / Indisponível (out_of_stock)</option>
                      <option value="revisar">Em revisão</option>
                    </select>
                    <small className="mt-1 block text-xs text-muted-foreground">
                      Sincronizado automaticamente com o feed `/google-merchant.tsv` e o JSON-LD.
                    </small>
                  </div>
                  <div className="sm:col-span-2">
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
                      Para filtros por medida, informe cada valor identificado (aceita Largura/Larg,
                      Altura/Alt, Profundidade/Prof e Comprimento/Comp).
                    </small>
                    {parsedMeasurements.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {parsedMeasurements.map((item) => (
                          <span
                            key={item.label}
                            className="inline-flex items-center rounded bg-[#edf4e9] px-2 py-1 text-[11px] font-semibold text-deep-green"
                          >
                            {item.label}: {item.value}
                          </span>
                        ))}
                      </div>
                    ) : value.medidas?.trim() ? (
                      <small className="mt-1 block text-[11px] text-cacau/75">
                        Texto salvo como informativo; rotule cada dimensão com unidade (ex.: Larg
                        1,80m) para entrar nos filtros numéricos.
                      </small>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="product-field-12" className={label}>
                      Cores (separadas por vírgula)
                    </label>
                    <input
                      id="product-field-12"
                      value={coresText}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setCoresText(raw);
                        const cleanedColors = raw
                          .split(/[,;\n]/)
                          .map((color) => color.trim())
                          .filter(Boolean);
                        onChange({ ...value, cores: cleanedColors });
                      }}
                      placeholder="Ex.: Cinamomo, Off-white, Bege"
                      className={field}
                    />
                    {!!value.cores?.length && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {value.cores.map((color, index) => (
                          <span
                            key={`${color}-${index}`}
                            className="inline-flex items-center rounded-full border border-cacau/15 bg-sand px-2.5 py-0.5 text-[11px] font-semibold text-cacau"
                          >
                            {color}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="product-field-13" className={label}>
                      Descrição
                    </label>
                    <textarea
                      id="product-field-13"
                      value={value.descricao ?? ""}
                      onChange={(e) => onChange({ ...value, descricao: e.target.value })}
                      rows={6}
                      placeholder="Descreva materiais, estrutura, portas, gavetas e diferenciais do móvel."
                      className={field}
                    />
                  </div>
                  <div className="min-w-0 overflow-hidden sm:col-span-2 rounded-lg border border-cacau/15 bg-[#faf7f1] p-3.5">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-xs uppercase tracking-wide text-deep-green">
                        Prévia no Google Search (SEO)
                      </strong>
                      <span className="text-[11px] text-text-light">
                        {seoPreview.description.length}/160 caracteres no resumo
                      </span>
                    </div>
                    <div className="min-w-0 overflow-hidden rounded-md border border-cacau/10 bg-white p-3">
                      <div className="truncate text-[11px] text-[#3f503f]">
                        mobimb.com.br › produto › {seoSlug}
                      </div>
                      <div className="mt-0.5 break-words text-sm font-semibold text-[#1558d6]">
                        {seoPreview.title}
                      </div>
                      <p className="mt-1 break-words text-xs leading-relaxed text-[#4d5156]">
                        {seoPreview.description}
                      </p>
                      {sitePrice > 0 && cardTerms && (
                        <div className="mt-1.5 text-[11px] font-medium text-[#186839]">
                          {formatBRL(sitePrice)} · Devolução em 7 dias · Até 10x de{" "}
                          {formatBRL(cardTerms.approximateInstallment)}
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {seoChecks.map((check) => (
                        <span
                          key={check.label}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            check.ok ? "bg-[#edf4e9] text-deep-green" : "bg-[#f4efe6] text-cacau/75"
                          }`}
                        >
                          {check.ok ? "✓" : "•"} {check.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
              <section
                hidden={section !== "extras"}
                className="product-editor-section rounded-xl border border-cacau/10 bg-white p-4 lg:col-span-2 sm:p-5"
              >
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
                      <ProductIdentity
                        product={products.find((product) => product.id === id)}
                        fallbackName={id}
                      >
                        <small>Complemento indisponível para exibição.</small>
                      </ProductIdentity>
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
                  <label className={label} htmlFor="bundle-search">
                    Buscar complemento
                  </label>
                  <input
                    id="bundle-search"
                    className={field}
                    placeholder="Nome ou referência do móvel"
                    value={bundleSearch}
                    onChange={(e) => setBundleSearch(e.target.value)}
                  />
                  {!bundleSearch.trim() && (
                    <p className="my-3 text-sm text-text-light">
                      Busque um móvel para adicionar. Os selecionados aparecem abaixo.
                    </p>
                  )}
                  <div className="max-h-56 divide-y divide-cacau/10 overflow-y-auto border border-cacau/10">
                    {bundleCandidates
                      .filter(
                        (candidate) =>
                          selectedBundleIds.includes(candidate.id) ||
                          (bundleSearch.trim() &&
                            normalizeFilterText(candidate.nome + " " + candidate.sku).includes(
                              normalizeFilterText(bundleSearch),
                            )),
                      )
                      .slice(0, 30)
                      .map((candidate) => {
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
                            <ProductThumbnail product={candidate} />
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
              <section
                hidden={section !== "fotos"}
                className="product-editor-section rounded-xl border border-cacau/10 bg-white p-4 lg:col-span-2 sm:p-5"
              >
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
                    <label htmlFor="product-main-image" className={label}>
                      Imagem do produto *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={value.imagem_url}
                        onChange={(e) => onChange({ ...value, imagem_url: e.target.value })}
                        id="product-main-image"
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
                        className="mt-2 h-32 w-32 rounded-lg border border-cacau/10 bg-white object-contain p-1"
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
                      aria-label="URLs das fotos adicionais"
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
              {section === "preco" && sitePrice > 0 ? (
                <>
                  Prévia: {formatBRL(sitePrice)} à vista · 10x de{" "}
                  {formatBRL(cardInstallment(sitePrice, 10))}
                  <br />
                </>
              ) : null}
              {hasUnsavedChanges
                ? "Alterações ainda não salvas."
                : "Nenhuma alteração neste produto."}{" "}
              Salvar atualiza a loja.
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
                disabled={saving || uploading || (Boolean(value.id) && !hasUnsavedChanges)}
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
