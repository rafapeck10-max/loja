import type { Produto } from "../lib/products.functions";
import {
  HOMEPAGE_ROOMS,
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
  destinations?: readonly { id: string; href: string }[];
}) {
  const selectedImages = roomImages?.length ? roomImages : selectHomepageRoomImages(products);
  const rooms = HOMEPAGE_ROOMS.flatMap((room) => {
    const image = selectedImages.find((selected) => selected.slug === room.slug)?.imageUrl;
    return image ? [{ ...room, image }] : [];
  });

  if (!rooms.length) return null;

  return (
    <section className="mobi-shop-categories mobi-wrap">
      <div className="mobi-shop-heading">
        <h2>Encontre por ambiente</h2>
      </div>
      <nav className="mobi-photo-categories" aria-label="Comprar por ambiente">
        {rooms.map((room) => (
          <a
            key={room.slug}
            href={
              destinations?.find((destination) => destination.id === room.slug)?.href ??
              `/categoria/${room.slug}`
            }
          >
            <span className="mobi-category-photo">
              <ImageWithFallback src={room.image} alt="" loading="lazy" />
            </span>
            <span>{room.label}</span>
          </a>
        ))}
      </nav>
    </section>
  );
}
