import { createFileRoute } from "@tanstack/react-router";
import { RegionalStoreLanding } from "@/components/RegionalStoreLanding";
import { buildRegionalPageHead, getRegionalPage } from "@/lib/regional-pages";

const page = getRegionalPage("moveis-sao-joao-de-meriti");

export const Route = createFileRoute("/moveis-sao-joao-de-meriti")({
  head: () => buildRegionalPageHead(page),
  component: () => <RegionalStoreLanding page={page} />,
});
