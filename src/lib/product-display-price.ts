import type { Produto } from "./products.functions";

export function productDisplayPrice(produto: Produto) {
  const variations = (produto as Produto & { variacoes_preco?: { sale_price: number | null }[] })
    .variacoes_preco;
  return (
    variations?.find((variation) => variation.sale_price != null && variation.sale_price > 0)
      ?.sale_price ?? produto.preco_novo
  );
}
