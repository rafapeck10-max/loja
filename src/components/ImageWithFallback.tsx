import { useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";

type ImageWithFallbackProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
};

export function ImageWithFallback({
  src,
  alt,
  className,
  onError,
  ...props
}: ImageWithFallbackProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!src || failedUrl === src) {
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
      src={src}
      alt={alt ?? ""}
      className={className}
      onError={(event) => {
        onError?.(event);
        setFailedUrl(src);
      }}
    />
  );
}
