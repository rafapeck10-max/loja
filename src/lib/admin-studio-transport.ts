import {
  MAX_WORKSPACE_BYTES,
  STUDIO_SCOPES,
  parseWorkspace,
  restoreRevision,
  reviewRevision,
  reviseWorkspace,
  type StudioScope,
  type StudioWorkspace,
} from "./admin-studio.ts";

export interface StudioWorkspaceSnapshot {
  serverVersion: number;
  workspace: StudioWorkspace;
}

export type StudioWorkspaceCommand =
  | {
      action: "save";
      expectedServerVersion: number;
      scope: StudioScope;
      value: unknown;
    }
  | {
      action: "review";
      expectedServerVersion: number;
      scope: StudioScope;
    }
  | {
      action: "restore";
      expectedServerVersion: number;
      revisionId: number;
    }
  | {
      action: "recover";
      expectedServerVersion: number;
      scopes: StudioScope[];
    };

export interface StudioWorkspaceTransport {
  read(): Promise<StudioWorkspaceSnapshot>;
  change(command: StudioWorkspaceCommand): Promise<StudioWorkspaceSnapshot>;
}

export interface LocalWorkspaceStorageReader {
  getItem(key: string): string | null;
}

export type LocalWorkspaceInspection =
  | { status: "missing"; raw: null }
  | { status: "ready"; raw: string; workspace: StudioWorkspace }
  | { status: "invalid"; raw: string; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function serializedBytes(value: unknown): number {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new Error("O comando contém dados que não podem ser salvos.");
  }
  if (typeof serialized !== "string")
    throw new Error("O comando contém dados que não podem ser salvos.");
  return new TextEncoder().encode(serialized).byteLength;
}

function assertOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]) {
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    throw new Error("Comando inválido: contém campos não reconhecidos.");
}

function assertExpectedVersion(value: unknown): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 0)
    throw new Error("Versão-base inválida.");
}

function assertScope(value: unknown): asserts value is StudioScope {
  if (!STUDIO_SCOPES.includes(value as StudioScope)) throw new Error("Escopo inválido.");
}

export function validatedSnapshot(value: unknown): StudioWorkspaceSnapshot {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.serverVersion) ||
    (value.serverVersion as number) < 0 ||
    !Object.hasOwn(value, "workspace")
  )
    throw new Error("Estado remoto inválido.");

  let workspace: StudioWorkspace;
  try {
    const serialized = JSON.stringify(value.workspace);
    if (typeof serialized !== "string" || serializedBytes(value.workspace) > MAX_WORKSPACE_BYTES)
      throw new Error();
    workspace = parseWorkspace(serialized);
  } catch {
    throw new Error("Estado remoto inválido.");
  }
  return { serverVersion: value.serverVersion as number, workspace };
}

export function normalizeStudioWorkspaceCommand(value: unknown): StudioWorkspaceCommand {
  if (!isRecord(value)) throw new Error("Comando inválido.");
  assertExpectedVersion(value.expectedServerVersion);

  switch (value.action) {
    case "save": {
      assertOnlyKeys(value, ["action", "expectedServerVersion", "scope", "value"]);
      assertScope(value.scope);
      if (!Object.hasOwn(value, "value")) throw new Error("Conteúdo do rascunho ausente.");
      if (serializedBytes(value.value) > MAX_WORKSPACE_BYTES)
        throw new Error("O conteúdo excede o limite de armazenamento.");
      return {
        action: "save",
        expectedServerVersion: value.expectedServerVersion,
        scope: value.scope,
        value: JSON.parse(JSON.stringify(value.value)) as unknown,
      };
    }
    case "review": {
      assertOnlyKeys(value, ["action", "expectedServerVersion", "scope"]);
      assertScope(value.scope);
      return {
        action: "review",
        expectedServerVersion: value.expectedServerVersion,
        scope: value.scope,
      };
    }
    case "restore": {
      assertOnlyKeys(value, ["action", "expectedServerVersion", "revisionId"]);
      if (!Number.isSafeInteger(value.revisionId) || (value.revisionId as number) < 1)
        throw new Error("Número de revisão inválido.");
      return {
        action: "restore",
        expectedServerVersion: value.expectedServerVersion,
        revisionId: value.revisionId as number,
      };
    }
    case "recover": {
      assertOnlyKeys(value, ["action", "expectedServerVersion", "scopes"]);
      if (!Array.isArray(value.scopes) || value.scopes.length === 0)
        throw new Error("Informe as áreas que serão recuperadas.");
      const scopes = value.scopes.map((scope) => {
        assertScope(scope);
        return scope;
      });
      if (new Set(scopes).size !== scopes.length)
        throw new Error("A lista de recuperação contém áreas duplicadas.");
      return {
        action: "recover",
        expectedServerVersion: value.expectedServerVersion,
        scopes,
      };
    }
    default:
      throw new Error("Ação de revisão inválida.");
  }
}

export function applyStudioWorkspaceCommand(
  rawSnapshot: unknown,
  rawCommand: unknown,
  options: {
    date: string;
    sourceValues?: Partial<Record<StudioScope, unknown>>;
  },
): StudioWorkspaceSnapshot {
  const snapshot = validatedSnapshot(rawSnapshot);
  const command = normalizeStudioWorkspaceCommand(rawCommand);
  if (command.expectedServerVersion !== snapshot.serverVersion)
    throw new Error("Conflito: uma versão remota mais recente existe. Reabra antes de salvar.");
  if (snapshot.serverVersion === Number.MAX_SAFE_INTEGER)
    throw new Error("Limite de versões remotas atingido.");
  if (!Number.isFinite(Date.parse(options.date))) throw new Error("Data inválida.");

  let workspace = snapshot.workspace;
  switch (command.action) {
    case "save":
      workspace = reviseWorkspace(
        workspace,
        workspace.revision,
        command.scope,
        command.value,
        options.date,
      );
      break;
    case "review":
      workspace = reviewRevision(workspace, workspace.revision, command.scope, options.date);
      break;
    case "restore":
      workspace = restoreRevision(workspace, workspace.revision, command.revisionId, options.date);
      break;
    case "recover":
      for (const scope of command.scopes) {
        if (!options.sourceValues || !Object.hasOwn(options.sourceValues, scope))
          throw new Error(`Fonte atual indisponível para recuperar ${scope}.`);
        workspace = reviseWorkspace(
          workspace,
          workspace.revision,
          scope,
          options.sourceValues[scope],
          options.date,
        );
      }
      break;
  }
  return { serverVersion: snapshot.serverVersion + 1, workspace };
}

export function inspectLocalWorkspaceImport(
  storage: LocalWorkspaceStorageReader,
  key: string,
): LocalWorkspaceInspection {
  const raw = storage.getItem(key);
  if (raw === null) return { status: "missing", raw: null };
  try {
    return { status: "ready", raw, workspace: parseWorkspace(raw) };
  } catch (error) {
    return {
      status: "invalid",
      raw,
      error: error instanceof Error ? error.message : "Arquivo local inválido.",
    };
  }
}

export function createExplicitStudioImportCommand(
  inspection: LocalWorkspaceInspection,
  expectedServerVersion: number,
  scope: StudioScope,
): Extract<StudioWorkspaceCommand, { action: "save" }> {
  if (inspection.status === "missing") throw new Error("Não há um rascunho local para importar.");
  if (inspection.status === "invalid")
    throw new Error(
      "O rascunho local inválido precisa ser exportado e conferido antes da importação.",
    );
  assertScope(scope);
  if (!Object.hasOwn(inspection.workspace.entries, scope))
    throw new Error(`O rascunho local não contém a área ${scope}.`);
  return normalizeStudioWorkspaceCommand({
    action: "save",
    expectedServerVersion,
    scope,
    value: inspection.workspace.entries[scope],
  }) as Extract<StudioWorkspaceCommand, { action: "save" }>;
}
