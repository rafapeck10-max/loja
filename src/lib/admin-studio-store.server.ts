import { supabaseAdmin } from "../integrations/supabase/client.server";
import { createStudioRepositoryTransport } from "./admin-studio-repository.ts";
import type { StudioScope } from "./admin-studio.ts";
import { createSupabaseStudioRepository, type StudioRpc } from "./admin-studio-supabase.ts";

export function remoteStudioStore(sourceValues?: Partial<Record<StudioScope, unknown>>) {
  if (process.env.MOBI_REMOTE_STUDIO !== "1")
    throw new Error("Rascunhos remotos ainda não foram habilitados para este ambiente.");
  // Narrow boundary until types are generated from the validated destination schema.
  const rpc = supabaseAdmin.rpc.bind(supabaseAdmin) as unknown as StudioRpc;
  return createStudioRepositoryTransport(createSupabaseStudioRepository(rpc), { sourceValues });
}
