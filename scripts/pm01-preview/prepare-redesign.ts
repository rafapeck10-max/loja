/** Append a reviewable LOCAL demonstration revision. Never rewrites earlier snapshots. */
import { fileURLToPath } from "node:url";
import { pageProducts } from "./data";
import { createLocalHomeStore } from "../../src/lib/home-local-store.server";
import { homeConfigurationFromDraft, sourceFingerprint } from "../../src/lib/home-configuration";
import { initialPageDraft } from "../../src/lib/pages-shelves";
import { initialBannerData } from "../../src/lib/banner-drafts";
import { initialNavigation, initialService } from "../../src/lib/operational-config";
export async function prepareRedesign() {
  if (process.env.VERCEL || process.env.NODE_ENV === "production")
    throw new Error("Somente prévia local.");
  const store = createLocalHomeStore(
    fileURLToPath(new URL("../../.mobi-local-preview/demo", import.meta.url)),
  );
  let document = await store.read();
  const previous = document.revisions.find((r) => r.id === document.publishedId)?.config;
  const pages = initialPageDraft(pageProducts);
  if (previous?.curation)
    pages.curation = {
      weeklyIds: [...previous.curation.weeklyIds],
      settings: { ...pages.curation.settings, ...previous.curation.settings },
    };
  pages.sections.sort(
    (a, b) =>
      ["intro", "weekly", "discovery", "inspiration", "new", "room", "catalog"].indexOf(a.id) -
      ["intro", "weekly", "discovery", "inspiration", "new", "room", "catalog"].indexOf(b.id),
  );
  pages.sections = pages.sections.map((s) => ({
    ...s,
    enabled: ["inspiration", "discovery"].includes(s.id) ? false : s.enabled,
    subtitle: s.type === "vitrine" ? "" : s.subtitle,
  }));
  const navigation = initialNavigation();
  if (previous)
    navigation.items = navigation.items.map((n) => ({
      ...n,
      ...previous.navigation.find((p) => p.id === n.id),
    }));
  const service = { ...initialService(), ...previous?.service };
  const banners = initialBannerData();
  banners.banners[0].alt = "Poltrona Jamile azul do catálogo Mobi";
  const config = homeConfigurationFromDraft({ pages, banners, navigation, service }, pageProducts);
  const sourceVersion = sourceFingerprint(pageProducts);
  document = await store.change({
    action: "save",
    expected: document.sequence,
    sourceVersion,
    config,
  });
  const id = document.revisions.at(-1)!.id;
  document = await store.change({
    action: "review",
    expected: document.sequence,
    id,
    sourceVersion,
  });
  document = await store.change({
    action: "apply",
    expected: document.sequence,
    id,
    sourceVersion,
  });
  return {
    revision: document.publishedId,
    weeklyIds: config.sectionIds.weekly,
    previous: previous ? true : false,
  };
}
