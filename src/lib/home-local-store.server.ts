import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { homeConfigurationSchema } from "./home-configuration-schema.ts";
import {
  changeHomeDocument,
  newHomeDocument,
  type HomeDocument,
  type HomeCommand,
} from "./home-configuration.ts";

/** Local development adapter only; never an ephemeral Vercel filesystem database. */
export function createLocalHomeStore(directory: string) {
  const file = join(directory, "home.json");
  async function read(): Promise<HomeDocument> {
    let raw: string;
    try {
      raw = await readFile(file, "utf8");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return newHomeDocument();
      throw e;
    }
    try {
      if (raw.length > 12_000_000) throw new Error();
      const d = JSON.parse(raw) as HomeDocument;
      if (Array.isArray(d.revisions))
        for (const r of d.revisions) homeConfigurationSchema.parse(r.config);
      if (
        d.schemaVersion !== 1 ||
        !Number.isSafeInteger(d.sequence) ||
        d.sequence < 0 ||
        !Array.isArray(d.revisions) ||
        new Set(d.revisions.map((r) => r.id)).size !== d.revisions.length ||
        d.revisions.some(
          (r) =>
            !Number.isSafeInteger(r.id) ||
            r.id < 1 ||
            r.id > d.sequence ||
            !["draft", "reviewed", "applied"].includes(r.status) ||
            r.config?.schemaVersion !== 1,
        ) ||
        (d.publishedId !== null &&
          !d.revisions.some((r) => r.id === d.publishedId && r.status === "applied"))
      )
        throw new Error();
      return d;
    } catch {
      throw new Error(
        "Histórico local inválido. O arquivo foi preservado; recupere uma cópia antes de continuar.",
      );
    }
  }
  async function change(command: HomeCommand) {
    await mkdir(directory, { recursive: true });
    const lockPath = join(directory, "home.lock");
    const lock = await open(lockPath, "wx").catch(() => {
      throw new Error(
        "Conflito: gravação local bloqueada. Se persistir após reiniciar a prévia, recupere o bloqueio local; o histórico foi preservado.",
      );
    });
    const temporary = join(directory, `home-${randomUUID()}.tmp`);
    try {
      const next = changeHomeDocument(await read(), command);
      const output = await open(temporary, "wx", 0o600);
      try {
        await output.writeFile(JSON.stringify(next));
        await output.sync();
      } finally {
        await output.close();
      }
      await rename(temporary, file);
      return next;
    } finally {
      await unlink(temporary).catch(() => {});
      await lock.close();
      await unlink(lockPath);
    }
  }
  return { read, change };
}
export function configuredLocalHomeStore() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL ||
    process.env.MOBI_LOCAL_HOME !== "1"
  )
    return null;
  return createLocalHomeStore(join(process.cwd(), ".mobi-local-preview", "storefront"));
}
export async function readLocalHomeConfiguration() {
  const store = configuredLocalHomeStore();
  if (!store) return null;
  const { publicHomeConfiguration } = await import("./home-configuration.ts");
  return publicHomeConfiguration(await store.read());
}
