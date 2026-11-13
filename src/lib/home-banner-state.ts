import type { HomeBanner } from "./home-configuration.ts";
export function visibleHomeBanners(banners: readonly HomeBanner[], now = new Date()) {
  return banners
    .filter(
      (b) =>
        b.active &&
        (!b.starts_at || Date.parse(b.starts_at + "-03:00") <= now.getTime()) &&
        (!b.ends_at || Date.parse(b.ends_at + "-03:00") > now.getTime()),
    )
    .sort((a, b) => a.position - b.position);
}
