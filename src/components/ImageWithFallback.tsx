import { useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";
import { firstAvailableImageSource } from "@/lib/image-fallback";

type ImageWithFallbackProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
  fallbackSrcs?: readonly (string | null | undefined)[];
};

export function ImageWithFallback({
  src,
  alt,
  className,
  onError,
  fallbackSrcs = [],
  ...props
}: ImageWithFallbackProps) {
  const primarySrc = src?.trim() ?? "";
  const [imageFailures, setImageFailures] = useState<{ primarySrc: string; failed: string[] }>({
    primarySrc: "",
    failed: [],
  });
  const failedSources = imageFailures.primarySrc === primarySrc ? imageFailures.failed : [];
  const activeSrc = firstAvailableImageSource([primarySrc, ...fallbackSrcs], failedSources);

  if (!activeSrc) {
    return (
      <span
        className={`mobi-image-fallback ${className ?? ""}`}
        role="img"
        aria-label={`${alt || "Imagem"} — imagem indisponível`}
      >
        <ImageOff size={20} strokeWidth={1.7} aria-hidden="true" />
        <span className="sr-only">Imagem indisponível</span>
      </span>
    );
  }
  return (
    <img
      {...props}
      src={activeSrc}
      alt={alt ?? ""}
      className={className}
      onError={(event) => {
        onError?.(event);
        setImageFailures((current) => {
          const failed = current.primarySrc === primarySrc ? current.failed : [];
          return failed.includes(activeSrc)
            ? current
            : { primarySrc, failed: [...failed, activeSrc] };
        });
      }}
    />
  );
}
