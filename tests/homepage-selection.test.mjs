import assert from "node:assert/strict";
import test from "node:test";
import { rehydrateHomepageSections } from "../src/lib/homepage-selection.ts";

test("rehydrates only unique products selected for homepage sections", () => {
  const sections = {
    discovery: [{ id: "a" }, { id: "b" }],
    weekly: [{ id: "b" }, { id: "c" }],
    new: [{ id: "c" }],
    room: [{ id: "d" }],
  };
  const catalog = [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
    { id: "c", name: "C" },
    { id: "d", name: "D" },
    { id: "unrelated", name: "Not on the homepage" },
  ];

  const result = rehydrateHomepageSections(sections, catalog);

  assert.deepEqual(
    result.products.map((product) => product.id),
    ["a", "b", "c", "d"],
  );
  assert.deepEqual(result.sectionIds, {
    discovery: ["a", "b"],
    weekly: ["b", "c"],
    new: ["c"],
    room: ["d"],
  });
});

test("keeps a section order while omitting products missing from the detail query", () => {
  const result = rehydrateHomepageSections(
    {
      discovery: [{ id: "missing" }, { id: "ready" }],
      weekly: [],
      new: [],
      room: [],
    },
    [{ id: "ready", name: "Ready" }],
  );

  assert.deepEqual(
    result.products.map((product) => product.id),
    ["ready"],
  );
  assert.deepEqual(result.sectionIds.discovery, ["ready"]);
});
