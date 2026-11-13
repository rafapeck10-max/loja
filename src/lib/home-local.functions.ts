import { createServerFn } from "@tanstack/react-start";
import type { HomeDraftInput, HomeDocument } from "./home-configuration";
import type { HomeTransportCommand } from "./home-transport";

async function localStore() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL ||
    process.env.MOBI_LOCAL_HOME !== "1"
  )
    return null;
  const { createLocalHomeStore } = await import("./home-local-store.server");
  const { join } = await import("node:path");
  return createLocalHomeStore(join(process.cwd(), ".mobi-local-preview", "storefront"));
}
export const getLocalPublicHome = createServerFn({ method: "GET" }).handler(async () => {
  const store = await localStore();
  if (!store) return null;
  const { publicHomeConfiguration } = await import("./home-configuration");
  return publicHomeConfiguration(await store.read());
});
export const adminLocalHome = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { password: string; command?: HomeTransportCommand; draft?: HomeDraftInput }) => input,
  )
  .handler(async ({ data }): Promise<{ enabled: boolean; document?: HomeDocument }> => {
    const store = await localStore();
    if (!store) return { enabled: false };
    // Existing server-side password check and current catalog; no product writes.
    const { listAdminProdutos } = await import("./admin.functions");
    const products = await listAdminProdutos({ data: { password: data.password } });
    if (!data.command) return { enabled: true, document: await store.read() };
    const { homeConfigurationFromDraft, sourceFingerprint } = await import("./home-configuration");
    const command = data.command;
    const sourceVersion = sourceFingerprint(products);
    const document = await store.change(
      command.action === "save"
        ? { ...command, config: homeConfigurationFromDraft(data.draft!, products), sourceVersion }
        : { ...command, sourceVersion },
    );
    return { enabled: true, document };
  });
