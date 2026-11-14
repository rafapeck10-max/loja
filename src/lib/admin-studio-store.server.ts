import { supabaseAdmin } from "../integrations/supabase/client.server";
import { createStudioRepositoryTransport } from "./admin-studio-repository.ts";
import type { StudioScope } from "./admin-studio.ts";
import type { EditorProduct } from "./homepage-curation.ts";
import { createSupabaseStudioRepository, type StudioRpc } from "./admin-studio-supabase.ts";

export function remoteStudioStore(
  options: {
    sourceValues?: Partial<Record<StudioScope, unknown>>;
    products?: EditorProduct[];
    homePublicationEnabled?: boolean;
  } = {},
) {
  if (process.env.MOBI_REMOTE_STUDIO !== "1")
    throw new Error("Rascunhos remotos ainda não foram habilitados para este ambiente.");
  // Narrow boundary until types are generated from the validated destination schema.
  const rpc = supabaseAdmin.rpc.bind(supabaseAdmin) as unknown as StudioRpc;
  return createStudioRepositoryTransport(createSupabaseStudioRepository(rpc), options);
}
