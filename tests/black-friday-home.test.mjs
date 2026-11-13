import test from "node:test";
import assert from "node:assert/strict";
import { createCampaign, selectCampaignProduct } from "../src/lib/campaigns.ts";
import {
  projectBlackFridayCampaigns,
  activeBlackFridayProductIds,
  blackFridayProductIdsToLoad,
} from "../src/lib/home-configuration.ts";

const products = [
  {
    id: "sofa",
    nome: "Sofá Mobi",
    categoria: "Sofás",
    preco_atual: 1000,
    preco_atacado: 500,
    url_imagem: "https://example.com/sofa.jpg",
    descricao: "",
    cores: [],
    variacoes_preco: [],
  },
];
const campaign = () => ({
  ...selectCampaignProduct(createCampaign("bf"), products[0], true),
  name: "Black Friday de demonstração",
  sectionIds: ["blackFriday"],
  status: "review",
  simulation: "enabled",
  startsAt: "2026-11-10T09:00:00-03:00",
  endsAt: "2026-11-12T18:00:00-03:00",
});
const project = (value, at) =>
  projectBlackFridayCampaigns({ version: 1, campaigns: [value] }, products, new Date(at));

test("Black Friday has no products without a reviewed local projection", () => {
  assert.deepEqual(activeBlackFridayProductIds(null), []);
  assert.deepEqual(project({ ...campaign(), status: "draft" }, "2026-11-11T12:00:00Z"), []);
});
test("scheduled products preload but become visible only at the Brasília start boundary", () => {
  const config = { blackFridayCampaigns: project(campaign(), "2026-11-10T11:59:59Z") };
  assert.deepEqual(blackFridayProductIdsToLoad(config, new Date("2026-11-10T11:59:59Z")), ["sofa"]);
  assert.deepEqual(activeBlackFridayProductIds(config, new Date("2026-11-10T11:59:59Z")), []);
  assert.deepEqual(activeBlackFridayProductIds(config, new Date("2026-11-10T12:00:00Z")), ["sofa"]);
  assert.deepEqual(activeBlackFridayProductIds(config, new Date("2026-11-12T21:00:00Z")), []);
});
test("ending, cancelling or expiry removes the section's data without changing base prices", () => {
  const before = JSON.stringify(products);
  for (const simulation of ["disabled", "ended", "off"]) {
    assert.deepEqual(project({ ...campaign(), simulation }, "2026-11-11T12:00:00Z"), []);
  }
  assert.deepEqual(project(campaign(), "2026-11-13T12:00:00Z"), []);
  assert.equal(JSON.stringify(products), before);
});
test("home projection contains product IDs only and does not publish simulated price overrides or costs", () => {
  const c = campaign();
  c.participants[0].proposedPriceCents = 90000;
  const projected = project(c, "2026-11-11T12:00:00Z");
  assert.equal(projected.length, 1);
  assert.equal(projected[0].source, "local-preview");
  assert.deepEqual(Object.keys(projected[0]).sort(), [
    "endsAt",
    "id",
    "productIds",
    "source",
    "startsAt",
  ]);
  assert.equal(products[0].preco_atual, 1000);
});
test("conflicting campaigns cannot silently choose an arbitrary commercial owner", () => {
  const first = campaign(),
    second = { ...campaign(), id: "bf-other" };
  assert.throws(
    () =>
      projectBlackFridayCampaigns(
        { version: 1, campaigns: [first, second] },
        products,
        new Date("2026-11-11T12:00:00Z"),
      ),
    /conflit|mais de uma/,
  );
});
