import { readAdminStudioWorkspace, changeAdminStudioWorkspace } from "./admin.functions";
import { validatedSnapshot, type StudioWorkspaceTransport } from "./admin-studio-transport.ts";

/** Explicit opt-in by the caller; does not import or erase browser drafts. */
export function createRemoteStudioTransport(password: string): StudioWorkspaceTransport {
  return {
    async read() {
      return validatedSnapshot(JSON.parse(await readAdminStudioWorkspace({ data: { password } })));
    },
    async change(command) {
      return validatedSnapshot(
        JSON.parse(await changeAdminStudioWorkspace({ data: { password, command } })),
      );
    },
  };
}
