import { createFileRoute } from "@tanstack/react-router";
import { RegionalStoreLanding } from "@/components/RegionalStoreLanding";
import { buildRegionalPageHead, getRegionalPage } from "@/lib/regional-pages";

const page = getRegionalPage("moveis-nilopolis");

export const Route = createFileRoute("/moveis-nilopolis")({
  head: () => buildRegionalPageHead(page),
  component: () => <RegionalStoreLanding page={page} />,
});
