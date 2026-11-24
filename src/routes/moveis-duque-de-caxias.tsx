import { createFileRoute } from "@tanstack/react-router";
import { RegionalStoreLanding } from "@/components/RegionalStoreLanding";
import { buildRegionalPageHead, getRegionalPage } from "@/lib/regional-pages";

const page = getRegionalPage("moveis-duque-de-caxias");

export const Route = createFileRoute("/moveis-duque-de-caxias")({
  head: () => buildRegionalPageHead(page),
  component: () => <RegionalStoreLanding page={page} />,
});
