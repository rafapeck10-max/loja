import { createStudioRepositoryTransport } from "../../src/lib/admin-studio-repository";
import type { StudioWorkspaceSnapshot } from "../../src/lib/admin-studio-transport";

// Browser-only fixture for checking asynchronous UI. Not a remote database.
let stored: StudioWorkspaceSnapshot | null = null;
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 100));
export const remoteStudioFixture = createStudioRepositoryTransport({
  async read() {
    await delay();
    return structuredClone(stored);
  },
  async compareAndSwap(expected, next) {
    await delay();
    if ((stored?.serverVersion ?? 0) !== expected) return false;
    stored = structuredClone(next);
    return true;
  },
});
