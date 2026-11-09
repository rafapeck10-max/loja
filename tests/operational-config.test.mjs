import test from "node:test";
import assert from "node:assert/strict";
import {
  initialNavigation,
  validateNavigation,
  filterCoverage,
  initialContent,
  validateContent,
  initialService,
  validateService,
  serviceLink,
  validateProductDrafts,
} from "../src/lib/operational-config.ts";
test("navigation derives existing taxonomy and rejects unknown routes and unimplemented filters", () => {
  const data = initialNavigation();
  assert.ok(data.items.length > 5);
  assert.deepEqual(validateNavigation(data), []);
  assert.ok(
    validateNavigation({
      items: [{ ...data.items[0], href: "javascript:alert(1)", filters: ["unknown"] }],
    }).length,
  );
});
test("coverage counts normalized catalog attributes and identifies missing data", () => {
  const r = filterCoverage([
    {
      nome: "Sofá Veludo Azul",
      categoria: "Sofás",
      descricao: "Veludo",
      cores: ["Azul"],
      medidas: "Largura 200 cm",
    },
  ]);
  assert.equal(r.material.covered, 1);
  assert.equal(r.color.covered, 1);
  assert.equal(r.material.missing, 0);
});
test("structured content rejects unsafe links, duplicate slugs and unsupported blocks", () => {
  const d = initialContent();
  assert.deepEqual(validateContent(d), []);
  assert.ok(
    validateContent({
      pages: [
        { ...d.pages[0], slug: "../admin", links: [{ label: "X", href: "https://evil.example" }] },
      ],
    }).length,
  );
});
test("delivery has no implicit free freight or deadline, requires public store WhatsApp", () => {
  const d = initialService();
  assert.equal(d.freightMode, "consult");
  assert.deepEqual(validateService(d), []);
  assert.ok(validateService({ ...d, number: "123" }).length);
  const link = serviceLink(d, { name: "Sofá & Azul", variant: "Azul", quantity: 2, price: 500 });
  assert.ok(link.startsWith("https://wa.me/5521984324338?text="));
  assert.match(decodeURIComponent(link), /2/);
  assert.match(decodeURIComponent(link), /Sofá & Azul/);
});
test("product draft rejects stale base and invalid commercial fields", () => {
  const p = {
    id: "a",
    nome: "Sofá",
    preco_atual: 500,
    preco_atacado: 300,
    url_imagem: "https://example.com/a.jpg",
  };
  assert.ok(
    validateProductDrafts(
      { changes: { a: { basePrice: 500, product: { ...p, preco_atual: -1 } } } },
      [p],
    ).length,
  );
  assert.ok(validateProductDrafts({ changes: { a: { basePrice: 400, product: p } } }, [p]).length);
});
