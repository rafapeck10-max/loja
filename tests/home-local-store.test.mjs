import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as store from "../src/lib/home-local-store.server.ts";
import { defaultHomeSections } from "../src/lib/home-configuration.ts";
const config = {
  schemaVersion: 1,
  sections: defaultHomeSections(),
  sectionIds: { weekly: [], discovery: [], new: [], room: [] },
  banners: [],
  navigation: [],
  service: { regionMessage: "Online", deliveryMessage: "Consultar", assemblyMessage: "Consultar" },
};
test("durable store prevents stale concurrent updates and keeps previous JSON on invalid command", async () => {
  assert.equal(typeof store.createLocalHomeStore, "function");
  const dir = await mkdtemp(join(tmpdir(), "mobi-home-"));
  try {
    const a = store.createLocalHomeStore(dir);
    const b = store.createLocalHomeStore(dir);
    const result = await Promise.allSettled([
      a.change({ action: "save", expected: 0, config, sourceVersion: "a" }),
      b.change({ action: "save", expected: 0, config, sourceVersion: "a" }),
    ]);
    assert.equal(
      result.filter((r) => r.status === "fulfilled").length,
      1,
      result.filter((r) => r.status === "rejected").map((r) => r.reason?.message).join("\n"),
    );
    assert.equal((await b.read()).revisions.length, 1);
    await assert.rejects(
      () => a.change({ action: "apply", expected: 1, id: 1, sourceVersion: "a" }),
      /revis/i,
    );
    assert.equal((await b.read()).sequence, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("corrupt persisted state is an error, not an empty replacement", async () => {
  assert.equal(typeof store.createLocalHomeStore, "function");
  const dir = await mkdtemp(join(tmpdir(), "mobi-home-"));
  try {
    await writeFile(join(dir, "home.json"), "{bad");
    await assert.rejects(() => store.createLocalHomeStore(dir).read(), /inválid/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("valid JSON with an incomplete applied configuration is rejected before public rendering", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mobi-home-"));
  try {
    await writeFile(
      join(dir, "home.json"),
      JSON.stringify({
        schemaVersion: 1,
        sequence: 1,
        publishedId: 1,
        revisions: [{ id: 1, status: "applied", config: { schemaVersion: 1 } }],
      }),
    );
    await assert.rejects(() => store.createLocalHomeStore(dir).read(), /inválid/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
