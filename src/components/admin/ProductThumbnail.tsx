import { ImageWithFallback } from "../ImageWithFallback";
import "../../admin-product-images.css";

export type ThumbnailProduct = {
  id?: string;
  nome: string;
  url_imagem?: string | null;
  imagens?: readonly string[] | null;
};

/** Reserved, uncropped image space for every administrative product reference. */
export function ProductThumbnail({
  product,
  className = "",
}: {
  product?: ThumbnailProduct;
  className?: string;
}) {
  return (
    <span className={`admin-product-thumbnail ${className}`}>
      <ImageWithFallback
        src={product?.url_imagem}
        fallbackSrcs={product?.imagens ?? []}
        alt={product ? `Foto de ${product.nome}` : "Foto do produto"}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

export function ProductIdentity({
  product,
  fallbackName = "Produto indisponível",
  children,
}: {
  product?: ThumbnailProduct;
  fallbackName?: string;
  children?: React.ReactNode;
}) {
  return (
    <span className="admin-product-identity">
      <ProductThumbnail product={product} />
      <span className="admin-product-identity-text">
        <strong>{product?.nome ?? fallbackName}</strong>
        {children}
      </span>
    </span>
  );
}

export function ProductDiffReferences({
  productById,
  path,
  before,
  after,
}: {
  productById: ReadonlyMap<string, ThumbnailProduct>;
  path: string;
  before: unknown;
  after: unknown;
}) {
  const tokens = new Set(
    (path + " " + JSON.stringify([before, after])).match(/[A-Za-z0-9][A-Za-z0-9_-]{2,}/g) ?? [],
  );
  const referenced = [...tokens]
    .map((id) => productById.get(id))
    .filter((product): product is ThumbnailProduct => Boolean(product));
  if (!referenced.length) return null;
  return (
    <div className="pm-review-products" aria-label="Produtos desta alteração">
      {referenced.map((product) => (
        <ProductIdentity key={product.id} product={product} />
      ))}
    </div>
  );
}
