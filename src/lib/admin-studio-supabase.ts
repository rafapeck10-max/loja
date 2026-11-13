import { validatedSnapshot, type StudioWorkspaceSnapshot } from "./admin-studio-transport.ts";
import type { StudioWorkspaceRepository } from "./admin-studio-repository.ts";

export type StudioRpc = (
  name: "mobi_studio_read" | "mobi_studio_compare_and_swap",
  args?: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

/** Only bind this adapter to the privileged client inside a server handler. */
export function createSupabaseStudioRepository(rpc: StudioRpc): StudioWorkspaceRepository {
  return {
    async read() {
      const result = await rpc("mobi_studio_read");
      if (result.error) throw new Error("Não foi possível ler os rascunhos remotos.");
      // SQL seeds the singleton. Missing data means installation failure, not an empty draft.
      return validatedSnapshot(result.data);
    },
    async compareAndSwap(expectedVersion: number, next: StudioWorkspaceSnapshot) {
      const snapshot = validatedSnapshot(next);
      if (snapshot.serverVersion !== expectedVersion + 1)
        throw new Error("Sequência de versões remotas inválida.");
      const result = await rpc("mobi_studio_compare_and_swap", {
        p_expected_version: expectedVersion,
        p_workspace: snapshot.workspace,
      });
      if (result.error)
        throw new Error("Não foi possível salvar os rascunhos remotos. A edição foi preservada.");
      if (typeof result.data !== "boolean")
        throw new Error("Resposta de salvamento remoto inválida.");
      return result.data;
    },
  };
}
