import { emptyWorkspace, type StudioScope } from "./admin-studio.ts";
import {
  applyStudioWorkspaceCommand,
  normalizeStudioWorkspaceCommand,
  validatedSnapshot,
  type StudioWorkspaceSnapshot,
  type StudioWorkspaceTransport,
} from "./admin-studio-transport.ts";

/** Private storage only. Implement compareAndSwap as one database transaction. */
export interface StudioWorkspaceRepository {
  read(): Promise<StudioWorkspaceSnapshot | null>;
  compareAndSwap(expectedVersion: number, next: StudioWorkspaceSnapshot): Promise<boolean>;
}

/** A successful read followed by an unconditional update is not concurrency protection. */
export function createStudioRepositoryTransport(
  repository: StudioWorkspaceRepository,
  options: { now?: () => string; sourceValues?: Partial<Record<StudioScope, unknown>> } = {},
): StudioWorkspaceTransport {
  const read = async (): Promise<StudioWorkspaceSnapshot> =>
    validatedSnapshot(
      (await repository.read()) ?? { serverVersion: 0, workspace: emptyWorkspace() },
    );

  return {
    read,
    async change(rawCommand) {
      const command = normalizeStudioWorkspaceCommand(rawCommand);
      // Recovery needs authoritative source data; never trust a browser-supplied snapshot.
      if (command.action === "recover" && !options.sourceValues)
        throw new Error(
          "A recuperação exige uma fonte administrativa atual conferida no servidor.",
        );
      const current = await read();
      const next = applyStudioWorkspaceCommand(current, command, {
        date: options.now?.() ?? new Date().toISOString(),
        sourceValues: options.sourceValues,
      });
      if (!(await repository.compareAndSwap(current.serverVersion, next)))
        throw new Error("Conflito: uma versão remota mais recente existe. Reabra antes de salvar.");
      return next;
    },
  };
}
