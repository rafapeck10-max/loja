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
  head: ({ loaderData }) => {
    const head = seoHead(
      "Central de ajuda | Mobi",
      "Como comprar, entrega e montagem, formas de pagamento, trocas, devolução e garantia da Mobi.",
      `${SITE_URL}/ajuda`,
    );
    return loaderData?.revisionId != null
      ? { ...head, meta: [...head.meta, { name: "robots", content: "noindex,follow" }] }
      : head;
  },
  component: HelpPortal,
});

function HelpPortal() {
  const data = Route.useLoaderData();
  return <HelpPortalView {...data} />;
}
