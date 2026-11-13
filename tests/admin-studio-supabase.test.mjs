import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseStudioRepository } from "../src/lib/admin-studio-supabase.ts";
import { emptyWorkspace } from "../src/lib/admin-studio.ts";
const snapshot = () => ({ serverVersion: 0, workspace: emptyWorkspace() });

test("RPC reads validate payload and reject a missing installation", async () => {
  const repo = createSupabaseStudioRepository(async (name) => {
    assert.equal(name, "mobi_studio_read");
    return { data: snapshot(), error: null };
  });
  assert.deepEqual(await repo.read(), snapshot());
  for (const data of [null, {}, { ...snapshot(), serverVersion: "0" }]) {
    await assert.rejects(
      createSupabaseStudioRepository(async () => ({ data, error: null })).read(),
      /inválido/,
    );
  }
});
test("RPC writes pass the version to atomic compare-and-swap and distinguish conflicts", async () => {
  const next = { ...snapshot(), serverVersion: 1 };
  for (const committed of [true, false]) {
    const repo = createSupabaseStudioRepository(async (name, args) => {
      assert.equal(name, "mobi_studio_compare_and_swap");
      assert.deepEqual(args, { p_expected_version: 0, p_workspace: next.workspace });
      return { data: committed, error: null };
    });
    assert.equal(await repo.compareAndSwap(0, next), committed);
  }
});
test("database errors are explicit without disclosing internal SQL details", async () => {
  const repo = createSupabaseStudioRepository(async () => ({
    data: null,
    error: { message: "private SQL details" },
  }));
  await assert.rejects(
    repo.read(),
    (error) => !error.message.includes("private") && /ler/.test(error.message),
  );
  await assert.rejects(
    repo.compareAndSwap(0, { ...snapshot(), serverVersion: 1 }),
    /edição foi preservada/,
  );
});
test("bad version and malformed RPC success cannot appear as saved", async () => {
  let calls = 0;
  const repo = createSupabaseStudioRepository(async () => {
    calls++;
    return { data: null, error: null };
  });
  await assert.rejects(repo.compareAndSwap(0, snapshot()), /Sequência/);
  assert.equal(calls, 0);
  await assert.rejects(repo.compareAndSwap(0, { ...snapshot(), serverVersion: 1 }), /Resposta/);
});
