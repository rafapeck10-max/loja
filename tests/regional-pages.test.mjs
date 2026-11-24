import test from "node:test";
import assert from "node:assert/strict";
import { isSafeBannerDestination } from "../src/lib/banner-drafts.ts";
import { safeMobiLink } from "../src/lib/operational-config.ts";
import { REGIONAL_PAGE_PATHS, REGIONAL_STORE_PAGES } from "../src/lib/regional-pages.ts";
import { buildSitemap } from "../src/lib/sitemap.ts";

test("all regional landing pages follow Mobi online-only and Belford Roxo exclusion rules", () => {
  assert.equal(REGIONAL_STORE_PAGES.length, 6);
  const xml = buildSitemap([{ slug: "sofa-teste", categoria: "Sofás" }]);

  for (const page of REGIONAL_STORE_PAGES) {
    assert.equal(isSafeBannerDestination(page.path), true, page.path);
    assert.equal(safeMobiLink(page.path), true, page.path);
    assert.match(xml, new RegExp(`https://www\\.mobimb\\.com\\.br${page.path}<`));
    assert.doesNotMatch(page.intro + page.faqs.map((faq) => faq.answer).join(" "), /sem juros/i);
    assert.doesNotMatch(page.intro + page.faqs.map((faq) => faq.answer).join(" "), /26041-?250/);
  }
  assert.equal(REGIONAL_PAGE_PATHS.includes("/moveis-duque-de-caxias"), true);
});
