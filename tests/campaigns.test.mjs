import test from "node:test";
import assert from "node:assert/strict";
import {
  initialCampaignData,
  createCampaign,
  selectCampaignProduct,
  validateCampaignData,
  campaignState,
  previewCampaignProducts,
  endCampaign,
  compareCampaignPrice,
  parsePriceCents,
} from "../src/lib/campaigns.ts";

const products = [
  {
    id: "sofa",
    nome: "Sofá Mobi",
    preco_atual: 1000,
    preco_atacado: 700,
    url_imagem: "https://example.com/sofa.jpg",
    preco_antigo: null,
  },
  {
    id: "mesa",
    nome: "Mesa",
    preco_atual: 500,
    preco_atacado: 350,
    url_imagem: "https://example.com/mesa.jpg",
  },
];
function fixture() {
  let c = createCampaign("black");
  c = {
    ...c,
    name: "Semana Mobi",
    startsAt: "2026-11-10T09:00:00-03:00",
    endsAt: "2026-11-12T18:00:00-03:00",
    status: "review",
    simulation: "enabled",
  };
  c = selectCampaignProduct(c, products[0], true);
  c.participants[0].proposedPriceCents = 90000;
  return c;
}
test("normalizes decimal price input into integer cents without accepting fractions or scientific notation", () => {
  assert.equal(parsePriceCents("999,99"), 99999);
  assert.equal(parsePriceCents("0,01"), 1);
  for (const invalid of ["1,999", "1e3", "-4", "", "0", "1.000,00"])
    assert.equal(parsePriceCents(invalid), null);
});
test("validates Brasília offset, real calendar dates and strictly positive duration", () => {
  assert.deepEqual(validateCampaignData({ version: 1, campaigns: [fixture()] }, products), []);
  for (const startsAt of [
    "2026-11-10T12:00:00Z",
    "2026-02-30T09:00:00-03:00",
    "2026-11-12T18:00:00-03:00",
  ]) {
    assert.ok(
      validateCampaignData({ version: 1, campaigns: [{ ...fixture(), startsAt }] }, products)
        .length,
    );
  }
});
test("rejects unknown associations, missing participants, noninteger cents and fake reference prices", () => {
  const c = fixture();
  c.sectionIds = ["unknown"];
  c.bannerIds = ["unknown"];
  c.participants[0].proposedPriceCents = 90000.1;
  c.participants[0].referencePriceCents = 103500; // fabricated 15% above the proposed price
  c.participants.push({ ...c.participants[0], productId: "missing" });
  const errors = validateCampaignData({ version: 1, campaigns: [c] }, products);
  assert.ok(errors.some((e) => /seção/i.test(e)));
  assert.ok(errors.some((e) => /banner/i.test(e)));
  assert.ok(errors.some((e) => /centavos/i.test(e)));
  assert.ok(errors.some((e) => /referência/i.test(e)));
  assert.ok(errors.some((e) => /missing/.test(e)));
  assert.ok(
    validateCampaignData({ version: 1, campaigns: [{ ...fixture(), participants: [] }] }, products)
      .length,
  );
  assert.ok(validateCampaignData(null, products).length);
});
test("derives local scheduled, active and ended at Brasília boundaries", () => {
  const c = fixture();
  assert.equal(campaignState(c, "2026-11-10T11:59:59Z"), "programada");
  assert.equal(campaignState(c, "2026-11-10T12:00:00Z"), "ativa");
  assert.equal(campaignState(c, "2026-11-12T21:00:00Z"), "encerrada");
  assert.equal(campaignState({ ...c, simulation: "disabled" }), "desativada");
  assert.equal(campaignState(createCampaign("new")), "rascunho");
});
test("compares authoritative 10x total and Pix before and after without changing payment rules", () => {
  const result = compareCampaignPrice(100000, 90000);
  assert.equal(result.normal.pixPrice, 1000);
  assert.equal(result.normal.total, 1138);
  assert.equal(result.normal.approximateInstallment, 113.8);
  assert.equal(result.proposed.pixPrice, 900);
  assert.equal(result.proposed.total, 1024);
  assert.equal(result.proposed.approximateInstallment, 102.4);
  assert.equal(result.benefitCents, 10000);
});
test("preview overrides only selected products and leaves base data unchanged", () => {
  const original = structuredClone(products);
  const result = previewCampaignProducts(fixture(), products, "2026-11-11T12:00:00Z");
  assert.equal(result.products[0].preco_atual, 900);
  assert.equal(result.products[1].preco_atual, 500);
  assert.deepEqual(products, original);
  assert.deepEqual(result.overriddenIds, ["sofa"]);
  assert.equal(
    previewCampaignProducts(fixture(), products, "2026-11-13T00:00:00Z").products[0].preco_atual,
    1000,
  );
});
test("ending removes local overrides and preserves a legitimate later base price with an explicit conflict", () => {
  const c = fixture();
  const updated = [{ ...products[0], preco_atual: 1100 }, products[1]];
  const conflictPreview = previewCampaignProducts(c, updated, "2026-11-11T12:00:00Z");
  assert.equal(conflictPreview.products[0].preco_atual, 1100);
  assert.equal(conflictPreview.conflicts[0].productId, "sofa");
  const data = { ...initialCampaignData(), campaigns: [c] };
  const ended = endCampaign(data, c.id, updated);
  assert.equal(ended.products[0].preco_atual, 1100);
  assert.equal(ended.conflicts[0].productId, "sofa");
  assert.equal(
    previewCampaignProducts(ended.data.campaigns[0], updated, "2026-11-11T12:00:00Z").products[0]
      .preco_atual,
    1100,
  );
  assert.equal(data.campaigns[0].simulation, "enabled");
});
test("rejects overlapping enabled campaigns for the same product, but allows adjacent intervals", () => {
  const c = fixture();
  const next = { ...fixture(), id: "next" };
  assert.ok(
    validateCampaignData({ version: 1, campaigns: [c, next] }, products).some((e) =>
      /sobrepos/i.test(e),
    ),
  );
  next.startsAt = c.endsAt;
  next.endsAt = "2026-11-14T18:00:00-03:00";
  assert.deepEqual(validateCampaignData({ version: 1, campaigns: [c, next] }, products), []);
});
test("invalid imported monetary ranges cannot enable a preview that crashes the payment calculator", () => {
  const c = fixture();
  c.participants[0].proposedPriceCents = Number.MAX_SAFE_INTEGER;
  assert.ok(
    validateCampaignData({ version: 1, campaigns: [c] }, products).some((e) =>
      /limite|cálculo/i.test(e),
    ),
  );
  assert.equal(
    previewCampaignProducts(c, products, "2026-11-11T12:00:00Z").products[0].preco_atual,
    1000,
  );
});
test("malformed imported nested entries produce validation errors without throwing", () => {
  for (const entry of [
    null,
    {},
    { ...fixture(), participants: [null] },
    { ...fixture(), bannerIds: null },
    { ...fixture(), participants: "bad" },
  ]) {
    assert.ok(validateCampaignData({ version: 1, campaigns: [entry] }, products).length);
  }
});
