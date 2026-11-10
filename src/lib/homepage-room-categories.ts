import { categoryMatches } from "./constants";

export const HOMEPAGE_ROOMS = [
  { slug: "dormitorios", label: "Quarto", preferredProducts: ["Camarim Áurea"] },
  {
    slug: "sala-de-estar",
    label: "Sala",
    preferredProducts: ["Sofá Gold 230", "Aparador Adega New Odin"],
  },
  { slug: "cozinha", label: "Cozinha", preferredProducts: ["Cozinha Cristal"] },
] as const;

export interface HomepageRoomImage {
  slug: string;
  imageUrl: string;
}

export function selectHomepageRoomImages(
  products: readonly { nome: string; categoria: string; imagem_url: string }[],
): HomepageRoomImage[] {
  return HOMEPAGE_ROOMS.flatMap((room) => {
    const product =
      room.preferredProducts
        .map((name) => products.find((item) => item.nome === name))
        .find((item) => item !== undefined) ??
      products.find((item) => categoryMatches(item.categoria, room.slug));
    return product?.imagem_url ? [{ slug: room.slug, imageUrl: product.imagem_url }] : [];
  });
}
