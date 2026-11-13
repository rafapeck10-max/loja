import type { ContentArticleImage } from "@/lib/operational-config";
import { ImageWithFallback } from "@/components/ImageWithFallback";

export function ArticleBody({
  body,
  images = [],
  variant = "storefront",
}: {
  body: string;
  images?: ContentArticleImage[];
  variant?: "storefront" | "admin";
}) {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const imagesByParagraph = new Map<number, ContentArticleImage[]>();

  for (const image of images) {
    if (!image.url.trim()) continue;
    const position = paragraphs.length
      ? Math.min(Math.max(image.afterParagraph, 1), paragraphs.length)
      : 1;
    imagesByParagraph.set(position, [...(imagesByParagraph.get(position) ?? []), image]);
  }

  const renderImage = (image: ContentArticleImage, index: number) => (
    <figure
      className="my-6 overflow-hidden rounded-xl bg-[#f1eee7]"
      key={`inline-image-${index}-${image.url}`}
    >
      <ImageWithFallback
        src={image.url}
        alt={image.alt}
        loading="lazy"
        className="max-h-[560px] w-full object-cover"
      />
    </figure>
  );

  return (
    <div className={variant === "admin" ? "mt-3 space-y-3" : "mx-auto mt-7 max-w-3xl space-y-5"}>
      {paragraphs.map((paragraph, index) => (
        <div key={`paragraph-${index}`}>
          <p
            className={
              variant === "admin" ? "text-sm leading-6" : "text-base leading-8 text-[#455247]"
            }
          >
            {paragraph}
          </p>
          {(imagesByParagraph.get(index + 1) ?? []).map(renderImage)}
        </div>
      ))}
      {!paragraphs.length && [...imagesByParagraph.values()].flat().map(renderImage)}
    </div>
  );
}
