import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateCepCoverage,
  formatCep,
  FREE_SHIPPING_CEP_RANGES,
  lookupCepWithCoverage,
  normalizeCepDigits,
} from "../src/lib/delivery-coverage.ts";

test("normalizes and formats CEP inputs without overflowing 8 digits", () => {
  assert.equal(normalizeCepDigits("26015-000abc"), "26015000");
  assert.equal(formatCep("26015000999"), "26015-000");
});

test("rejects malformed or repeated-digit CEPs as invalid", () => {
  assert.equal(evaluateCepCoverage("123").status, "invalid");
  assert.equal(evaluateCepCoverage("00000-000").status, "invalid");
  assert.equal(evaluateCepCoverage("22222222").status, "invalid");
});

test("all 13 synchronized Merchant Center radius ranges qualify for free shipping", () => {
  assert.equal(FREE_SHIPPING_CEP_RANGES.length, 13);
  const sampleEligibleCeps = [
    "26015-000", // Nova Iguacu (Botafogo / Centro)
    "26210-000", // Nova Iguacu
    "26325-000", // Queimados
    "26435-000", // Japeri
    "26510-000", // Nilopolis
    "26550-000", // Mesquita
    "26600-000", // Paracambi
    "25010-000", // Duque de Caxias
    "25510-000", // Sao Joao de Meriti
    "23890-000", // Seropedica
    "21510-000", // Zona Norte RJ
    "22750-000", // Jacarepagua / Zona Oeste RJ
    "23050-000", // Campo Grande / Zona Oeste RJ
  ];

  for (const cep of sampleEligibleCeps) {
    const result = evaluateCepCoverage(cep);
    assert.equal(result.status, "eligible", `Expected ${cep} to be eligible`);
    assert.equal(result.freeShipping, true);
    assert.equal(result.deadlineLabel, "até 7 dias úteis");
    assert.match(result.accessNote ?? "", /barricadas/i);
  }
});

test("explicitly excludes Belford Roxo by CEP range and by resolved city name", () => {
  const byRange = evaluateCepCoverage("26110-000");
  assert.equal(byRange.status, "excluded_belford_roxo");
  assert.equal(byRange.freeShipping, false);
  assert.match(byRange.message, /Belford Roxo/);

  const byCity = evaluateCepCoverage("26099-000", {
    localidade: "Belford Roxo",
    uf: "RJ",
  });
  assert.equal(byCity.status, "excluded_belford_roxo");
  assert.equal(byCity.freeShipping, false);
});

test("marks out-of-area CEPs and non-RJ addresses as out_of_area", () => {
  for (const cep of ["01001-000", "22041-001", "23510-000", "24020-000"]) {
    const result = evaluateCepCoverage(cep);
    assert.equal(result.status, "out_of_area", `Expected ${cep} to be out_of_area`);
    assert.equal(result.freeShipping, false);
  }

  const wrongState = evaluateCepCoverage("26015-000", {
    localidade: "Outra Cidade",
    uf: "SP",
  });
  assert.equal(wrongState.status, "out_of_area");
});

test("lookupCepWithCoverage resolves ViaCEP data, separates not_found, and falls back offline", async () => {
  const validFetch = async () =>
    new Response(
      JSON.stringify({
        logradouro: "Rua Exemplo",
        bairro: "Centro",
        localidade: "Nova Iguaçu",
        uf: "RJ",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  const ok = await lookupCepWithCoverage("26015-000", validFetch);
  assert.equal(ok.status, "eligible");
  assert.equal(ok.addressResolved, true);
  assert.equal(ok.address?.bairro, "Centro");
  assert.equal(ok.lookupWarning, undefined);

  const notFoundFetch = async () =>
    new Response(JSON.stringify({ erro: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  const missing = await lookupCepWithCoverage("26015-999", notFoundFetch);
  assert.equal(missing.status, "not_found");
  assert.equal(missing.freeShipping, false);

  const failingFetch = async () => {
    throw new Error("network down");
  };

  const fallback = await lookupCepWithCoverage("26015-000", failingFetch);
  assert.equal(fallback.status, "eligible");
  assert.equal(fallback.addressResolved, false);
  assert.match(fallback.lookupWarning ?? "", /Consulta de endereço indisponível/);
});
