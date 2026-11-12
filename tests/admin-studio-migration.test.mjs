import test from "node:test";
import assert from "node:assert/strict";
import {
  createExplicitStudioImportCommand,
  inspectLocalWorkspaceImport,
} from "../src/lib/admin-studio-transport.ts";
import { emptyWorkspace, reviseWorkspace } from "../src/lib/admin-studio.ts";

function storageWith(raw) {
  const values = new Map([["mobi:admin-studio:v1:admin", raw]]);
  const mutations = [];
  return {
    mutations,
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      mutations.push(["set", key, value]);
      values.set(key, value);
    },
    removeItem(key) {
      mutations.push(["remove", key]);
      values.delete(key);
    },
  };
}

test("inspection preserves corrupt localStorage byte-for-byte and never rewrites or deletes it", () => {
  const raw = '{\n  "schema": 1,\n  "entries": [broken]\n}';
  const storage = storageWith(raw);
  const inspection = inspectLocalWorkspaceImport(storage, "mobi:admin-studio:v1:admin");

  assert.equal(inspection.status, "invalid");
  assert.equal(inspection.raw, raw);
  assert.equal(storage.getItem("mobi:admin-studio:v1:admin"), raw);
  assert.deepEqual(storage.mutations, []);
});

test("valid local workspace is only converted into a save command after an explicit, scoped action", () => {
  const raw = JSON.stringify(
    reviseWorkspace(
      emptyWorkspace(),
      0,
      "pages",
      { pages: [{ slug: "ajuda" }] },
      "2026-11-12T12:00:00Z",
    ),
  );
  const storage = storageWith(raw);
  const inspection = inspectLocalWorkspaceImport(storage, "mobi:admin-studio:v1:admin");

  assert.equal(inspection.status, "ready");
  assert.deepEqual(storage.mutations, []);
  const command = createExplicitStudioImportCommand(inspection, 7, "pages");
  assert.deepEqual(command, {
    action: "save",
    expectedServerVersion: 7,
    scope: "pages",
    value: { pages: [{ slug: "ajuda" }] },
  });
  assert.equal(storage.getItem("mobi:admin-studio:v1:admin"), raw);
  assert.deepEqual(storage.mutations, []);
});

test("corrupt or absent local workspaces cannot create an import command", () => {
  const missing = inspectLocalWorkspaceImport(storageWith(null), "mobi:admin-studio:v1:admin");
  const invalid = inspectLocalWorkspaceImport(storageWith("nope"), "mobi:admin-studio:v1:admin");

  assert.throws(() => createExplicitStudioImportCommand(missing, 0, "pages"), /local/i);
  assert.throws(() => createExplicitStudioImportCommand(invalid, 0, "pages"), /inválid/i);
});
