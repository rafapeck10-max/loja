import { createFileRoute, notFound } from "@tanstack/react-router";
import { InspirationArticleView } from "@/components/InspirationArticleView";
import { getLocalPublicHome } from "@/lib/home-local.functions";
import { seoHead } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-metadata";

export const Route = createFileRoute("/inspiracao/$slug")({
  loader: async ({ params }) => {
    const home = await getLocalPublicHome();
    const article = home?.config.content?.articles?.find(
      (candidate) => candidate.slug === params.slug && candidate.status === "review",
    );
    if (!home || !article) throw notFound();
    return { revisionId: home.revisionId, article };
  },
  head: ({ loaderData }) => {
    const article = loaderData?.article;
    const head = seoHead(
      article ? `${article.title} | Mobi` : "Inspiração | Mobi",
      article?.excerpt ?? "Ideias e conteúdo da Mobi para sua casa.",
      `${SITE_URL}/inspiracao/${article?.slug ?? ""}`,
    );
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex,follow" }] };
  },
  component: InspirationArticle,
});

function InspirationArticle() {
  const data = Route.useLoaderData();
  return <InspirationArticleView {...data} />;
}
