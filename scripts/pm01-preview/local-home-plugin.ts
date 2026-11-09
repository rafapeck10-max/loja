import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { pageProducts } from "./data";
import { createLocalHomeStore } from "../../src/lib/home-local-store.server";
import {
  homeConfigurationFromDraft,
  publicHomeConfiguration,
  sourceFingerprint,
  type HomeDraftInput,
} from "../../src/lib/home-configuration";
import type { HomeTransportCommand } from "../../src/lib/home-transport";
export function localHomePlugin(): Plugin {
  const token = randomBytes(32).toString("hex");
  const store = createLocalHomeStore(
    fileURLToPath(new URL("../../.mobi-local-preview/demo", import.meta.url)),
  );
  return {
    name: "mobi-local-home",
    resolveId(id) {
      if (id === "virtual:mobi-preview-token") return "\0" + id;
    },
    load(id) {
      if (id === "\0virtual:mobi-preview-token") return `export default ${JSON.stringify(token)}`;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0] ?? "";
        if (path.includes(".mobi-local-preview")) {
          res.statusCode = 403;
          res.end("Acesso negado");
          return;
        }
        if (!path.startsWith("/__mobi-local-home")) return next();
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Type", "application/json");
        try {
          if (
            !["127.0.0.1:5187", "localhost:5187"].includes(req.headers.host ?? "") ||
            (req.headers.origin &&
              !["http://127.0.0.1:5187", "http://localhost:5187"].includes(req.headers.origin))
          )
            throw new Error("Origem local inválida.");
          if (path === "/__mobi-local-home" && req.method === "GET") {
            res.end(JSON.stringify(publicHomeConfiguration(await store.read())));
            return;
          }
          if (
            path !== "/__mobi-local-home/admin" ||
            req.headers["x-mobi-preview-token"] !== token
          ) {
            res.statusCode = 403;
            res.end(JSON.stringify({ error: "Acesso administrativo local necessário." }));
            return;
          }
          if (req.method === "GET") {
            res.end(JSON.stringify({ enabled: true, document: await store.read() }));
            return;
          }
          if (req.method !== "POST") throw new Error("Método não permitido.");
          let raw = "";
          for await (const chunk of req) {
            raw += chunk.toString();
            if (raw.length > 4_000_000) throw new Error("Limite do rascunho atingido.");
          }
          const { command, draft } = JSON.parse(raw) as {
            command: HomeTransportCommand;
            draft?: HomeDraftInput;
          };
          if (!["save", "review", "apply", "restore"].includes(command?.action))
            throw new Error("Operação inválida.");
          const sourceVersion = sourceFingerprint(pageProducts);
          const document = await store.change(
            command.action === "save"
              ? {
                  ...command,
                  sourceVersion,
                  config: homeConfigurationFromDraft(draft!, pageProducts),
                }
              : { ...command, sourceVersion },
          );
          res.end(JSON.stringify({ enabled: true, document }));
        } catch (e) {
          res.statusCode = 409;
          res.end(
            JSON.stringify({
              error:
                e instanceof Error ? e.message : "Falha local. A versão anterior foi preservada.",
            }),
          );
        }
      });
    },
  };
}
