import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyWorkspace,
  reviseWorkspace,
  restoreRevision,
  reviewRevision,
  parseWorkspace,
  diffValues,
} from "../src/lib/admin-studio.ts";
test("saving a draft creates an immutable local revision without a published state", () => {
  const a = emptyWorkspace();
  const b = reviseWorkspace(a, 0, "content", { title: "Ajuda" }, "2026-11-09T15:00:00Z");
  assert.equal(a.revision, 0);
  assert.equal(b.revision, 1);
  assert.equal(b.history[0].status, "draft");
  assert.equal(b.published, undefined);
});
test("stale writer cannot overwrite another revision", () => {
  const b = reviseWorkspace(emptyWorkspace(), 0, "content", { title: "A" }, "2026-11-09T15:00:00Z");
  assert.throws(
    () => reviseWorkspace(b, 0, "content", { title: "B" }, "2026-11-09T15:00:00Z"),
    /conflito/i,
  );
});
test("review requires the current revision and restoration appends instead of deleting history", () => {
  let w = reviseWorkspace(emptyWorkspace(), 0, "content", { title: "A" }, "2026-11-09T15:00:00Z");
  w = reviewRevision(w, 1, "content", "2026-11-09T15:01:00Z");
  assert.equal(w.history.at(-1).status, "reviewed");
  w = reviseWorkspace(w, w.revision, "content", { title: "B" }, "2026-11-09T15:02:00Z");
  const restored = restoreRevision(w, w.revision, 1, "2026-11-09T15:03:00Z");
  assert.equal(restored.entries.content.title, "A");
  assert.equal(restored.history.length, 4);
  assert.equal(restored.history.at(-1).status, "draft");
});
test("invalid storage cannot replace working state and unsafe scopes are rejected", () => {
  assert.throws(() => parseWorkspace("{broken"), /inválid/i);
  assert.throws(() => parseWorkspace('{"schema":1,"revision":2}'), /inválid/i);
  assert.throws(
    () => reviseWorkspace(emptyWorkspace(), 0, "__proto__", {}, "2026-11-09T15:00:00Z"),
    /escopo/i,
  );
});
test("review shows nested before and after values", () => {
  assert.deepEqual(
    diffValues({ name: "A", flags: { active: true } }, { name: "B", flags: { active: false } }).map(
      (x) => x.path,
    ),
    ["name", "flags.active"],
  );
});
test("first revision retains the consulted baseline rather than reconstructing it after source changes", () => {
  const base = { title: "A" };
  const saved = reviseWorkspace(
    emptyWorkspace(),
    0,
    "content",
    { title: "B" },
    "2026-11-09T15:00:00Z",
    base,
  );
  base.title = "Changed";
  assert.equal(saved.history[0].before.title, "A");
});
