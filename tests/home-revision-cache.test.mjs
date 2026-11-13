import test from "node:test";
import assert from "node:assert/strict";
import { QueryClient } from "@tanstack/react-query";
import * as cache from "../src/lib/home-revision-cache.ts";
test("applying a revision invalidates both cached home snapshot and non-home header config", async () => {
  assert.equal(typeof cache.invalidateHomeRevision, "function");
  const client = new QueryClient();
  client.setQueryData(["produtos", "homepage"], {
    revisionId: 1,
    configuration: { title: "anterior" },
  });
  client.setQueryData(["local-home-configuration"], { revisionId: 1 });
  await cache.invalidateHomeRevision(client);
  assert.equal(client.getQueryState(["produtos", "homepage"]).isInvalidated, true);
  assert.equal(client.getQueryState(["local-home-configuration"]).isInvalidated, true);
  client.clear();
});
