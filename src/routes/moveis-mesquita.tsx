import { createFileRoute } from "@tanstack/react-router";
import { RegionalStoreLanding } from "@/components/RegionalStoreLanding";
import { buildRegionalPageHead, getRegionalPage } from "@/lib/regional-pages";

const page = getRegionalPage("moveis-mesquita");

export const Route = createFileRoute("/moveis-mesquita")({
  head: () => buildRegionalPageHead(page),
  component: () => <RegionalStoreLanding page={page} />,
});
