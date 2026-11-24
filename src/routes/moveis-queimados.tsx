import { createFileRoute } from "@tanstack/react-router";
import { RegionalStoreLanding } from "@/components/RegionalStoreLanding";
import { buildRegionalPageHead, getRegionalPage } from "@/lib/regional-pages";

const page = getRegionalPage("moveis-queimados");

export const Route = createFileRoute("/moveis-queimados")({
  head: () => buildRegionalPageHead(page),
  component: () => <RegionalStoreLanding page={page} />,
});
