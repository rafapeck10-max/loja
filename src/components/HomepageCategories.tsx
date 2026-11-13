import type { Produto } from "../lib/products.functions";
import {
  HOMEPAGE_ROOMS,
  homepageRoomImageCandidates,
  selectHomepageRoomImages,
  type HomepageRoomImage,
} from "../lib/homepage-room-categories";
import { ImageWithFallback } from "./ImageWithFallback";

export function HomepageCategories({
  products,
  roomImages,
  destinations,
}: {
  products: Produto[];
  roomImages?: HomepageRoomImage[];
  destinations?: readonly { id: string; href: string; visible?: boolean }[];
}) {
  const selectedImages = roomImages ?? [];
  const defaultImages = selectHomepageRoomImages(products);
  const rooms = HOMEPAGE_ROOMS.flatMap((room) => {
    const destination = destinations?.find((item) => item.id === room.slug);
    if (destination?.visible === false) return [];
    const image =
      selectedImages.find((selected) => selected.slug === room.slug)?.imageUrl ||
      defaultImages.find((selected) => selected.slug === room.slug)?.imageUrl;
    return image
      ? [
          {
            ...room,
            image,
            href: destination?.href ?? `/categoria/${room.slug}`,
            fallbackImages: homepageRoomImageCandidates(room.slug, products),
          },
        ]
      : [];
  });

  if (!rooms.length) return null;

  return (
    <section className="mobi-shop-categories mobi-wrap" aria-label="Quarto, sala e cozinha">
      <div className="mobi-shop-heading">
        <h2>Encontre por ambiente</h2>
      </div>
      <nav
        className="mobi-photo-categories"
        aria-label="Comprar por ambiente"
        style={{
          gridTemplateColumns: `repeat(${rooms.length}, minmax(0, 1fr))`,
          maxWidth: `${(600 / HOMEPAGE_ROOMS.length) * rooms.length}px`,
        }}
      >
        {rooms.map((room) => (
          <a key={room.slug} href={room.href}>
            <span className="mobi-category-photo">
              <ImageWithFallback
                src={room.image}
                fallbackSrcs={room.fallbackImages}
                alt=""
                loading="lazy"
              />
            </span>
            <span>{room.label}</span>
          </a>
        ))}
      </nav>
    </section>
  );
}
