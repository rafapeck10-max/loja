import type { CSSProperties, ReactNode } from "react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import type { HomepageBanner } from "@/lib/homepage-banners";
import { isSafeBannerDestination, type BannerResponsiveMedia } from "@/lib/banner-drafts";

interface BannerSlideProps {
  banner: HomepageBanner;
  responsiveMedia?: BannerResponsiveMedia;
  children?: ReactNode;
  /** Forces a format inside the editor independently of the browser width. */
  previewViewport?: "desktop" | "mobile";
}

/** Shared by the public hero and the local media preview; defaults preserve the current hero. */
export function BannerSlide({
  banner,
  responsiveMedia,
  children,
  previewViewport,
}: BannerSlideProps) {
  const showText = responsiveMedia?.showText ?? true;
  const mobile = responsiveMedia?.mobile;
  const desktop = responsiveMedia?.desktop ?? banner.image_url;
  const source = previewViewport === "mobile" ? mobile || desktop : desktop;
  const alt = responsiveMedia?.alt ?? banner.title;
  const safeHref = isSafeBannerDestination(banner.cta_href) ? banner.cta_href : undefined;
  const imageStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: !mobile && previewViewport === "mobile" ? "contain" : "cover",
    objectPosition: "center 57%",
    filter: showText ? "brightness(0.59)" : "none",
  };
  const previewStyle: CSSProperties | undefined = previewViewport
    ? {
        height: "auto",
        width: "100%",
        aspectRatio: previewViewport === "mobile" ? "1 / 1" : "16 / 7",
        borderRadius: 10,
        isolation: "isolate",
      }
    : undefined;
  return (
    <section
      className={`mobi-hero ${!showText ? "mobi-hero-art" : ""}`}
      style={previewStyle}
      aria-label={
        previewViewport
          ? `Prévia ${previewViewport === "mobile" ? "celular" : "computador"}`
          : undefined
      }
    >
      {responsiveMedia ? (
        <picture
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            position: "absolute",
            inset: 0,
          }}
        >
          {!previewViewport && <source media="(max-width: 767px)" srcSet={mobile || desktop} />}
          <ImageWithFallback
            src={source}
            alt={alt}
            style={imageStyle}
            className={`mobi-hero-image ${!mobile ? "mobi-hero-image-no-mobile" : ""}`}
            fetchPriority="high"
          />
        </picture>
      ) : (
        <ImageWithFallback
          src={banner.image_url}
          alt={banner.title}
          className="mobi-hero-image"
          fetchPriority="high"
        />
      )}
      {showText ? (
        <div
          className="mobi-hero-content mobi-wrap"
          style={
            previewViewport
              ? { padding: "clamp(12px, 3vw, 24px)", width: "100%", boxSizing: "border-box" }
              : undefined
          }
        >
          {banner.eyebrow && (
            <span
              className="mobi-eyebrow"
              style={previewViewport ? { marginBottom: 8, fontSize: 10 } : undefined}
            >
              {banner.eyebrow}
            </span>
          )}
          <h1
            style={
              previewViewport
                ? {
                    color: "#fff",
                    fontSize: previewViewport === "mobile" ? 25 : "clamp(20px, 3vw, 34px)",
                    letterSpacing: "-0.7px",
                    marginBottom: 8,
                    overflowWrap: "anywhere",
                    maxWidth: "100%",
                  }
                : undefined
            }
          >
            {banner.title}
          </h1>
          {banner.subtitle && (
            <p
              style={
                previewViewport
                  ? { fontSize: 12, marginBottom: 10, lineHeight: 1.4, overflowWrap: "anywhere" }
                  : undefined
              }
            >
              {banner.subtitle}
            </p>
          )}
          {banner.cta_label &&
            (safeHref ? (
              <a
                href={safeHref}
                className="mobi-gold"
                style={previewViewport ? { padding: "10px 12px", fontSize: 11 } : undefined}
              >
                {banner.cta_label}
              </a>
            ) : (
              <span className="mobi-gold" aria-disabled="true">
                {banner.cta_label}
              </span>
            ))}
          {children}
        </div>
      ) : (
        <>
          {safeHref && (
            <a href={safeHref} aria-label={alt} style={{ position: "absolute", inset: 0 }} />
          )}
          {children && (
            <div
              className="mobi-hero-content mobi-wrap"
              style={{ justifyContent: "flex-end", paddingBottom: 20, pointerEvents: "none" }}
            >
              <div style={{ pointerEvents: "auto" }}>{children}</div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
