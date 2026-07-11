import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Lock, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { produtosQueryOptions, type Produto } from "@/lib/products.functions";
import {
  checkAdminPassword,
  deleteProduto,
  upsertProduto,
  type ProdutoInput,
} from "@/lib/admin.functions";
import { formatBRL } from "@/lib/constants";

const STORAGE_KEY = "mobili_admin_pwd";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin | Mobili" }, { name: "robots", content: "noindex,nofollow" }],
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
      toast.success("Bem-vindo(a) ao painel Mobili.");
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
          <h1 className="text-2xl">Painel Mobili</h1>
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
  preco_antigo: 0,
  preco_novo: 0,
  imagem_url: "",
  categoria: "",
  ordem: 0,
};

function AdminDashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: produtos = [], isLoading } = useQuery(produtosQueryOptions());
  const [editing, setEditing] = useState<ProdutoInput | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["produtos"] });
    router.invalidate();
  };

  const startNew = () => setEditing({ ...EMPTY });
  const startEdit = (p: Produto) =>
    setEditing({
      id: p.id,
      nome: p.nome,
      slug: p.slug,
      preco_antigo: p.preco_antigo,
      preco_novo: p.preco_novo,
      imagem_url: p.imagem_url,
      categoria: p.categoria,
      ordem: p.ordem ?? 0,
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

  return (
    <div className="mx-auto max-w-[1100px] px-[5%] py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-deep-green">Painel de Produtos</h1>
          <p className="mt-1 text-sm text-text-light">
            Cadastre novos móveis ou atualize os existentes. A vitrine reflete as mudanças
            automaticamente.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={startNew}
            className="flex items-center gap-2 bg-deep-green px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-sand transition-colors hover:bg-gold hover:text-deep-green"
          >
            <Plus className="h-4 w-4" /> Novo
          </button>
          <button
            onClick={onLogout}
            aria-label="Sair"
            className="flex items-center gap-2 border border-cacau/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-cacau transition-colors hover:border-gold hover:text-gold"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-text-light">Carregando produtos…</p>
      ) : (
        <div className="overflow-hidden border border-cacau/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand text-xs uppercase tracking-wider text-cacau">
              <tr>
                <th className="p-3">Produto</th>
                <th className="p-3">Preços</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className="border-t border-cacau/10">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={p.imagem_url} alt={p.nome} className="h-14 w-14 object-cover" />
                      <div>
                        <div className="font-semibold text-cacau">{p.nome}</div>
                        <div className="text-xs text-text-light">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-cacau">
                    <div className="text-xs text-text-light line-through">
                      {formatBRL(p.preco_antigo)}
                    </div>
                    <div className="font-bold text-price-green">{formatBRL(p.preco_novo)}</div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        aria-label="Editar"
                        className="border border-cacau/20 p-2 text-cacau transition-colors hover:border-gold hover:text-gold"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(p.id, p.nome)}
                        aria-label="Remover"
                        className="border border-cacau/20 p-2 text-cacau transition-colors hover:border-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {produtos.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-text-light">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
    "w-full border border-cacau/15 bg-white px-3 py-2.5 text-sm text-cacau outline-none transition-colors focus:border-gold";
  const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-cacau";
  const [uploading, setUploading] = useState(false);

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
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg border border-cacau/10 bg-sand p-6 shadow-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-2xl text-deep-green">
          {value.id ? "Editar produto" : "Novo produto"}
        </h2>
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
            <label className={label}>Preço antigo (R$) *</label>
            <input
              type="number"
              step="0.01"
              value={value.preco_antigo}
              onChange={(e) => onChange({ ...value, preco_antigo: Number(e.target.value) })}
              className={field}
            />
          </div>
          <div>
            <label className={label}>Preço novo (R$) *</label>
            <input
              type="number"
              step="0.01"
              value={value.preco_novo}
              onChange={(e) => onChange({ ...value, preco_novo: Number(e.target.value) })}
              className={field}
            />
          </div>
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
              <label className="flex shrink-0 cursor-pointer items-center justify-center bg-deep-green px-4 text-xs font-bold uppercase tracking-wider text-sand hover:bg-gold hover:text-deep-green">
                {uploading ? "Carregando..." : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
            {value.imagem_url && (
              <img
                src={value.imagem_url}
                alt="Prévia"
                className="mt-2 h-32 w-32 border border-cacau/10 object-cover"
              />
            )}
          </div>
          <div>
            <label className={label}>Categoria *</label>
            <input
              value={value.categoria ?? ""}
              onChange={(e) => onChange({ ...value, categoria: e.target.value })}
              placeholder="ex: Poltronas"
              className={field}
            />
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
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="border border-cacau/20 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-cacau transition-colors hover:border-gold hover:text-gold"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving || uploading}
            className="bg-deep-green px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-sand transition-colors hover:bg-gold hover:text-deep-green disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
