import { createFileRoute, notFound } from "@tanstack/react-router";
import { HelpContentPage } from "@/components/HelpContentPage";
import { getLocalPublicHome } from "@/lib/home-local.functions";
import { seoHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-metadata";

export const Route = createFileRoute("/ajuda/$slug")({
  loader: async ({ params }) => {
    const home = await getLocalPublicHome();
    if (!home) throw notFound();
    const page = home.config.content?.pages.find(
      (candidate) => candidate.slug === params.slug && candidate.status === "review",
    );
    if (!page) throw notFound();
    return { revisionId: home.revisionId, page };
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    const head = seoHead(
      page ? `${page.title} | Mobi` : "Ajuda | Mobi",
      page?.body.slice(0, 180) ?? "Informações de compra e atendimento da Mobi.",
      `${SITE_URL}/ajuda/${page?.slug ?? ""}`,
    );
    return {
      ...head,
      meta: [...head.meta, { name: "robots", content: "noindex,follow" }],
    };
  },
  component: HelpPageRoute,
});

function HelpPageRoute() {
  const { page, revisionId } = Route.useLoaderData();
  return (
    <>
      <div className="border-b border-gold/30 bg-[#f3f4ed] px-4 py-2 text-center text-xs text-deep-green">
        Conteúdo de prévia local · revisão {revisionId} · não publicado
      </div>
      <HelpContentPage page={page} />
    </>
  );
}
