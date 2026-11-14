import { supabaseAdmin } from "../integrations/supabase/client.server";
import { publishedHomePageFromWorkspace, shouldReadPublishedHomePage } from "./home-publication.ts";

type ReadRpc = (name: "mobi_studio_read") => PromiseLike<{
  data: unknown;
  error: { code?: string; message: string } | null;
}>;

function isMissingWorkspaceSchema(error: { code?: string; message: string }) {
  return (
    ["42883", "42P01", "PGRST202", "PGRST205"].includes(error.code ?? "") ||
    /mobi_studio_read|mobi_studio_workspace|schema cache/i.test(error.message)
  );
}

export async function readPublishedHomePage() {
  const configured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!shouldReadPublishedHomePage(configured, process.env.NODE_ENV === "production")) return null;
  const rpc = supabaseAdmin.rpc.bind(supabaseAdmin) as unknown as ReadRpc;
  const { data, error } = await rpc("mobi_studio_read");
  if (error) {
    if (isMissingWorkspaceSchema(error)) return null;
    throw new Error("Não foi possível consultar a seleção aplicada da página inicial.");
  }
  return publishedHomePageFromWorkspace(data);
}
