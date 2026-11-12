import test from "node:test";
import assert from "node:assert/strict";
import {
  applyStudioWorkspaceCommand,
  normalizeStudioWorkspaceCommand,
} from "../src/lib/admin-studio-transport.ts";
import { emptyWorkspace, reviseWorkspace } from "../src/lib/admin-studio.ts";

const snapshot = (serverVersion = 0, workspace = emptyWorkspace()) => ({
  serverVersion,
  workspace,
});
const date = "2026-11-12T12:00:00.000Z";

test("save validates scope and size before creating a new server revision", () => {
  const command = normalizeStudioWorkspaceCommand({
    action: "save",
    expectedServerVersion: 0,
    scope: "pages",
    value: { pages: [{ slug: "ajuda", title: "Ajuda" }] },
  });
  const next = applyStudioWorkspaceCommand(snapshot(), command, { date });

  assert.equal(next.serverVersion, 1);
  assert.equal(next.workspace.revision, 1);
  assert.equal(next.workspace.history[0].status, "draft");
  assert.deepEqual(next.workspace.entries.pages, command.value);
});

test("unknown scope, non-finite version, malformed snapshot and oversized payload are rejected", () => {
  assert.throws(
    () =>
      normalizeStudioWorkspaceCommand({
        action: "save",
        expectedServerVersion: 0,
        scope: "__proto__",
        value: {},
      }),
    /escopo/i,
  );
  assert.throws(
    () =>
      normalizeStudioWorkspaceCommand({
        action: "save",
        expectedServerVersion: Number.NaN,
        scope: "pages",
        value: {},
      }),
    /versão/i,
  );
  assert.throws(
    () =>
      normalizeStudioWorkspaceCommand({
        action: "restore",
        expectedServerVersion: 0,
        revisionId: Number.POSITIVE_INFINITY,
      }),
    /revisão/i,
  );
  assert.throws(
    () =>
      normalizeStudioWorkspaceCommand({
        action: "save",
        expectedServerVersion: 0,
        scope: "pages",
        value: "x".repeat(3_500_001),
      }),
    /limite/i,
  );
  assert.throws(
    () =>
      applyStudioWorkspaceCommand(
        { serverVersion: Number.POSITIVE_INFINITY, workspace: emptyWorkspace() },
        { action: "recover", expectedServerVersion: 0, scopes: ["pages"] },
        { date, sourceValues: { pages: [] } },
      ),
    /inválido/i,
  );
});

test("stale server version rejects a save without changing the source snapshot", () => {
  const current = snapshot(
    4,
    reviseWorkspace(emptyWorkspace(), 0, "content", { title: "Versão atual" }, date),
  );
  const before = JSON.stringify(current);

  assert.throws(
    () =>
      applyStudioWorkspaceCommand(
        current,
        {
          action: "save",
          expectedServerVersion: 3,
          scope: "content",
          value: { title: "Edição antiga" },
        },
        { date },
      ),
    /conflito/i,
  );
  assert.equal(JSON.stringify(current), before);
});

test("review, restore and source recovery append revisions while retaining prior history", () => {
  let current = snapshot();
  current = applyStudioWorkspaceCommand(
    current,
    { action: "save", expectedServerVersion: 0, scope: "content", value: { title: "Ajuda" } },
    { date },
  );
  current = applyStudioWorkspaceCommand(
    current,
    { action: "review", expectedServerVersion: 1, scope: "content" },
    { date },
  );
  current = applyStudioWorkspaceCommand(
    current,
    {
      action: "save",
      expectedServerVersion: 2,
      scope: "content",
      value: { title: "Rascunho novo" },
    },
    { date },
  );
  current = applyStudioWorkspaceCommand(
    current,
    { action: "restore", expectedServerVersion: 3, revisionId: 1 },
    { date },
  );

  assert.equal(current.workspace.entries.content.title, "Ajuda");
  assert.equal(current.workspace.history.length, 4);
  assert.equal(current.workspace.history[1].status, "reviewed");
  assert.equal(current.workspace.history[3].restoredFrom, 1);

  current = applyStudioWorkspaceCommand(
    current,
    { action: "recover", expectedServerVersion: 4, scopes: ["banners", "navigation"] },
    { date, sourceValues: { banners: [{ id: "home" }], navigation: [{ label: "Sala" }] } },
  );
  assert.equal(current.workspace.revision, 6);
  assert.equal(current.serverVersion, 5);
  assert.equal(current.workspace.history.at(-2).scope, "banners");
  assert.equal(current.workspace.history.at(-1).scope, "navigation");
  assert.equal(current.workspace.history.length, 6);
});

test("recover rejects missing source values and duplicate or unknown scopes", () => {
  assert.throws(
    () =>
      normalizeStudioWorkspaceCommand({
        action: "recover",
        expectedServerVersion: 0,
        scopes: ["pages", "pages"],
      }),
    /duplicad/i,
  );
  assert.throws(
    () =>
      normalizeStudioWorkspaceCommand({
        action: "recover",
        expectedServerVersion: 0,
        scopes: ["pages", "unknown"],
      }),
    /escopo/i,
  );
  assert.throws(
    () =>
      applyStudioWorkspaceCommand(
        snapshot(),
        { action: "recover", expectedServerVersion: 0, scopes: ["pages"] },
        { date },
      ),
    /fonte/i,
  );
});
