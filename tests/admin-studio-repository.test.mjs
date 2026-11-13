import test from "node:test";
import assert from "node:assert/strict";
import { createStudioRepositoryTransport } from "../src/lib/admin-studio-repository.ts";

function fixture() {
  let stored = null;
  let writes = 0;
  const repository = {
    async read() {
      return structuredClone(stored);
    },
    async compareAndSwap(expectedVersion, next) {
      if ((stored?.serverVersion ?? 0) !== expectedVersion) return false;
      stored = structuredClone(next);
      writes++;
      return true;
    },
  };
  return { repository, writes: () => writes };
}
const command = (value) => ({
  action: "save",
  expectedServerVersion: 0,
  scope: "content",
  value,
});
const options = { now: () => "2026-11-12T12:00:00.000Z" };

test("two simultaneous first saves cannot overwrite each other", async () => {
  const f = fixture();
  const a = createStudioRepositoryTransport(f.repository, options);
  const b = createStudioRepositoryTransport(f.repository, options);
  const outcomes = await Promise.allSettled([
    a.change(command({ text: "A" })),
    b.change(command({ text: "B" })),
  ]);
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  assert.match(outcomes.find((x) => x.status === "rejected").reason.message, /Conflito/);
  assert.equal(f.writes(), 1);
  assert.equal((await a.read()).serverVersion, 1);
});

test("stale saves, unavailable recovery and invalid commands never write", async () => {
  const f = fixture();
  const transport = createStudioRepositoryTransport(f.repository, options);
  await transport.change(command({ text: "original" }));
  await assert.rejects(transport.change(command({ text: "stale" })), /Conflito/);
  await assert.rejects(
    transport.change({ action: "recover", expectedServerVersion: 1, scopes: ["content"] }),
    /fonte administrativa/,
  );
  await assert.rejects(transport.change({ ...command({}), unexpected: true }), /não reconhecidos/);
  assert.equal(f.writes(), 1);
  assert.deepEqual((await transport.read()).workspace.entries.content, { text: "original" });
});

test("a failed storage commit is reported and never returns a successful save", async () => {
  const transport = createStudioRepositoryTransport(
    {
      async read() {
        return null;
      },
      async compareAndSwap() {
        throw new Error("storage unavailable");
      },
    },
    options,
  );
  await assert.rejects(transport.change(command({})), /storage unavailable/);
});

test("a corrupt stored workspace is rejected on read instead of rendering it", async () => {
  const transport = createStudioRepositoryTransport({
    async read() {
      return { serverVersion: 2, workspace: { entries: {} } };
    },
    async compareAndSwap() {
      assert.fail("corrupt data must never be written");
    },
  });
  await assert.rejects(transport.read(), /Estado remoto inválido/);
});

test("recovery uses trusted repository sources and commits all scopes as one version", async () => {
  const f = fixture();
  const transport = createStudioRepositoryTransport(f.repository, {
    ...options,
    sourceValues: { content: { source: "server" }, service: { source: "server" } },
  });
  const result = await transport.change({
    action: "recover",
    expectedServerVersion: 0,
    scopes: ["content", "service"],
  });
  assert.equal(result.serverVersion, 1);
  assert.equal(result.workspace.history.length, 2);
  assert.equal(f.writes(), 1);
});
