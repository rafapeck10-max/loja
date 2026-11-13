import { createFileRoute } from "@tanstack/react-router";
import { HelpPortalView } from "@/components/HelpPortalView";
import { getLocalPublicHome } from "@/lib/home-local.functions";
import { seoHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-metadata";

export const Route = createFileRoute("/ajuda")({
  loader: async () => {
    const home = await getLocalPublicHome();
    return { revisionId: home?.revisionId ?? null };
  },
  head: () => {
    const head = seoHead(
      "Central de ajuda | Mobi",
      "Orientações de compra e atendimento online da Mobi.",
      `${SITE_URL}/ajuda`,
    );
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex,follow" }] };
  },
  component: HelpPortal,
});

function HelpPortal() {
  const data = Route.useLoaderData();
  return <HelpPortalView {...data} />;
}
