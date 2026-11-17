import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ChevronDown } from "lucide-react";
import { ProductIdentity, type ThumbnailProduct } from "./ProductThumbnail";

export function ProductPicker<T extends ThumbnailProduct & { id: string }>({
  products,
  value,
  onChange,
}: {
  products: readonly T[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(24);
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  const matches = products.filter((product) => normalize(product.nome).includes(normalize(search)));
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="admin-product-picker-trigger"
          data-selected-product={value}
          aria-label="Escolher produto do atendimento"
          disabled={!products.length}
        >
          <ProductIdentity
            product={products.find((p) => p.id === value)}
            fallbackName="Nenhum produto disponível"
          />
          <ChevronDown size={18} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="aw-overlay" />
        <Dialog.Content className="admin-product-picker-dialog">
          <div className="admin-product-picker-heading">
            <Dialog.Title>Escolher produto</Dialog.Title>
            <Dialog.Close className="aw-icon-button" aria-label="Fechar seleção de produto">
              <X size={20} />
            </Dialog.Close>
          </div>
          <Dialog.Description>Encontre o móvel pela foto e pelo nome.</Dialog.Description>
          <label className="pm-field">
            Buscar produto
            <input
              autoFocus
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setLimit(24);
              }}
              placeholder="Nome do móvel"
            />
          </label>
          <div className="admin-product-picker-results">
            {matches.slice(0, limit).map((product) => (
              <button
                type="button"
                key={product.id}
                aria-pressed={product.id === value}
                onClick={() => {
                  onChange(product.id);
                  setOpen(false);
                }}
              >
                <ProductIdentity product={product} />
              </button>
            ))}
            {!matches.length && <p>Nenhum produto encontrado.</p>}
            {matches.length > limit && (
              <button type="button" onClick={() => setLimit((n) => n + 24)}>
                Mostrar mais produtos
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
