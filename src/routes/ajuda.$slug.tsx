import { createFileRoute, notFound } from "@tanstack/react-router";
import { HelpContentPage } from "@/components/HelpContentPage";
import { getLocalPublicHome } from "@/lib/home-local.functions";
import { findPublicHelpPage } from "@/lib/public-help-pages";
import { seoHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-metadata";

export const Route = createFileRoute("/ajuda/$slug")({
  loader: async ({ params }) => {
    const home = await getLocalPublicHome();
    const previewPage = home?.config.content?.pages.find(
      (candidate) => candidate.slug === params.slug && candidate.status === "review",
    );
    if (previewPage && home) {
      return { revisionId: home.revisionId, page: previewPage };
    }
    const publicPage = findPublicHelpPage(params.slug);
    if (!publicPage) throw notFound();
    return { revisionId: null as number | null, page: publicPage };
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    const head = seoHead(
      page ? `${page.title} | Mobi` : "Ajuda | Mobi",
      page?.body.replace(/\s+/g, " ").trim().slice(0, 160) ??
        "Informações de compra, entrega, pagamento e garantia da Mobi.",
      `${SITE_URL}/ajuda/${page?.slug ?? ""}`,
    );
    return loaderData?.revisionId !== null
      ? { ...head, meta: [...head.meta, { name: "robots", content: "noindex,follow" }] }
      : head;
  },
  component: HelpPageRoute,
});

function HelpPageRoute() {
  const { page, revisionId } = Route.useLoaderData();
  return (
    <>
      {revisionId !== null && (
        <div className="border-b border-gold/30 bg-[#f3f4ed] px-4 py-2 text-center text-xs text-deep-green">
          Conteúdo de prévia local · revisão {revisionId} · não publicado
        </div>
      )}
      <HelpContentPage page={page} />
    </>
  );
}
