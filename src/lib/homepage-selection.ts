export function rehydrateHomepageSections<
  T extends { id: string },
  S extends Record<string, readonly { id: string }[]>,
>(selections: S, detailedProducts: readonly T[]) {
  const sectionIds = Object.fromEntries(
    Object.entries(selections).map(([name, products]) => [
      name,
      products.map((product) => product.id),
    ]),
  ) as { [K in keyof S]: string[] };
  const productIds = [...new Set(Object.values(sectionIds).flat())];
  const productsById = new Map(detailedProducts.map((product) => [product.id, product]));
  const availableIds = (ids: string[]) => ids.filter((id) => productsById.has(id));

  return {
    productIds,
    products: productIds.flatMap((id) => {
      const product = productsById.get(id);
      return product ? [product] : [];
    }),
    sectionIds: Object.fromEntries(
      Object.entries(sectionIds).map(([name, ids]) => [name, availableIds(ids)]),
    ) as { [K in keyof S]: string[] },
  };
}
