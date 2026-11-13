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

type RoomProduct = { nome: string; categoria: string; imagem_url: string };

/** Prefer the room's chosen product, then try actual photos from that same room. */
export function homepageRoomImageCandidates(
  slug: string,
  products: readonly RoomProduct[],
): string[] {
  const room = HOMEPAGE_ROOMS.find((item) => item.slug === slug);
  if (!room) return [];
  const candidates = [
    ...room.preferredProducts.flatMap((name) =>
      products.filter((item) => item.nome === name && categoryMatches(item.categoria, room.slug)),
    ),
    ...products.filter((item) => categoryMatches(item.categoria, room.slug)),
  ];
  return [
    ...new Set(
      candidates
        .map((item) => item.imagem_url?.trim())
        .filter((image): image is string => Boolean(image && /^https?:\/\//i.test(image))),
    ),
  ];
}

export function selectHomepageRoomImages(products: readonly RoomProduct[]): HomepageRoomImage[] {
  return HOMEPAGE_ROOMS.flatMap((room) => {
    const imageUrl = homepageRoomImageCandidates(room.slug, products)[0];
    return imageUrl ? [{ slug: room.slug, imageUrl }] : [];
  });
}
