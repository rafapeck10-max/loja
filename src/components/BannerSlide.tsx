import type { ReactNode } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import { approvedBannerArtwork, type HomepageBanner } from "../lib/homepage-banners";
import { isSafeBannerDestination, type BannerResponsiveMedia } from "../lib/banner-drafts";
interface BannerSlideProps {
  banner: HomepageBanner;
  responsiveMedia?: BannerResponsiveMedia;
  children?: ReactNode;
  previewViewport?: "desktop" | "mobile";
}
/** One complete artwork per viewport, shared by the storefront and editor preview. */
export function BannerSlide({
  banner,
  responsiveMedia,
  children,
  previewViewport,
}: BannerSlideProps) {
  const desktop = responsiveMedia?.desktop ?? banner.image_url;
  const artwork = approvedBannerArtwork(desktop);
  const mobile = responsiveMedia?.mobile || artwork?.mobile;
  const alt = responsiveMedia?.alt ?? banner.title;
  const href = isSafeBannerDestination(banner.cta_href) ? banner.cta_href : undefined;
  return (
    <section
      className="mobi-hero mobi-hero-art"
      data-has-mobile-art={!!mobile}
      data-approved-art={!!artwork}
      style={artwork ? { backgroundColor: artwork.background } : undefined}
      data-legacy-photo={responsiveMedia?.showText ?? true}
      data-preview-format={previewViewport}
      aria-label={
        previewViewport
          ? `Prévia ${previewViewport === "mobile" ? "celular" : "computador"}`
          : undefined
      }
    >
      <picture className="mobi-hero-media">
        {!previewViewport && <source media="(max-width:767px)" srcSet={mobile || desktop} />}
        <ImageWithFallback
          src={previewViewport === "mobile" ? mobile || desktop : desktop}
          alt={alt}
          className="mobi-hero-image"
          fetchPriority="high"
        />
      </picture>
      {href && <a className="mobi-hero-art-link" href={href} aria-label={alt} />}
      {children}
    </section>
  );
}
