import { createFileRoute } from "@tanstack/react-router";
import { InspirationIndexView } from "@/components/InspirationIndexView";
import { getLocalPublicHome } from "@/lib/home-local.functions";
import { seoHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-metadata";

export const Route = createFileRoute("/inspiracao")({
  loader: async () => {
    const home = await getLocalPublicHome();
    return { revisionId: home?.revisionId ?? null };
  },
  head: () => {
    const head = seoHead(
      "Inspiração para sua casa | Mobi",
      "Ideias e conteúdo editorial da Mobi para escolher móveis para sua casa.",
      `${SITE_URL}/inspiracao`,
    );
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex,follow" }] };
  },
  component: InspirationIndex,
});

function InspirationIndex() {
  const data = Route.useLoaderData();
  return <InspirationIndexView {...data} />;
}
