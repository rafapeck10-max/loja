import { queryOptions } from "@tanstack/react-query";
import { pageProducts } from "./data";
import { initialPageDraft, toStorefrontProducts } from "../../src/lib/pages-shelves";

const publicProducts = () =>
  toStorefrontProducts(pageProducts, initialPageDraft(pageProducts).curation);

// The isolated preview never calls the store's server functions or Supabase.
export const produtosQueryOptions = () =>
  queryOptions({ queryKey: ["preview", "produtos"], queryFn: async () => publicProducts() });

export const homepageProductsQueryOptions = () =>
  queryOptions({
    queryKey: ["preview", "produtos", "home"],
    queryFn: async () => publicProducts(),
    staleTime: 30_000,
  });

export const produtoQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["preview", "produto", id],
    queryFn: async () =>
      publicProducts().find((product) => product.id === id || product.slug === id) ?? null,
  });
