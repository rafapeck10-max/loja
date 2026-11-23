import test from "node:test";
import assert from "node:assert/strict";
import { isSafeBannerDestination } from "../src/lib/banner-drafts.ts";
import { DEFAULT_HOMEPAGE_BANNERS, resolvePublicBannerHref } from "../src/lib/homepage-banners.ts";
import { safeMobiLink } from "../src/lib/operational-config.ts";
import { buildSitemap } from "../src/lib/sitemap.ts";

test("routes legacy Black Friday hero banner from /categoria/sofas to /black-friday", () => {
  assert.equal(
    resolvePublicBannerHref({
      image_url: DEFAULT_HOMEPAGE_BANNERS[0].image_url,
      title: "Black Friday Mobi — confira os modelos",
      cta_href: "/categoria/sofas",
    }),
    "/black-friday",
  );
  assert.equal(
    resolvePublicBannerHref({
      image_url: "https://www.mobimb.com.br/banners/outro-banner.webp",
      title: "Campanha Black Friday Mobi",
      cta_href: "/categoria/sofas",
    }),
    "/black-friday",
  );
});

test("preserves custom banner destinations and non-Black-Friday category links", () => {
  assert.equal(
    resolvePublicBannerHref({
      image_url: DEFAULT_HOMEPAGE_BANNERS[0].image_url,
      title: "Black Friday Mobi",
      cta_href: "/produto/alpoim-9602",
    }),
    "/produto/alpoim-9602",
  );
  assert.equal(
    resolvePublicBannerHref({
      image_url: DEFAULT_HOMEPAGE_BANNERS[1].image_url,
      title: "Sofás retráteis em promoção",
      cta_href: "/categoria/sofas",
    }),
    "/categoria/sofas",
  );
});

test("allows /black-friday in public banner destinations, operational links, and sitemap", () => {
  assert.equal(isSafeBannerDestination("/black-friday"), true);
  assert.equal(safeMobiLink("/black-friday"), true);
  assert.equal(safeMobiLink("https://www.mobimb.com.br/black-friday"), true);

  const xml = buildSitemap([{ slug: "sofa-teste", categoria: "Sofás" }]);
  assert.match(xml, /https:\/\/www\.mobimb\.com\.br\/black-friday</);
});
