import assert from "node:assert/strict";
import test from "node:test";
import { parseProductPublicCopy, publicDescription } from "../src/lib/product-copy.ts";

test("strips supplier availability lines and escaped newlines while keeping copy intact", () => {
  const cleaned = publicDescription(
    "Disponibilidade no fornecedor: Off/Savana - DISPONÍVEL x67\\n\\nLarg:1,80m Alt: 0,50m Prof: 0,45m\\n\\n100% MDF Tampo e base de 25mm",
  );
  assert.doesNotMatch(cleaned, /disponibilidade no fornecedor|dispo[ní]vel/i);
  assert.match(cleaned, /100% MDF Tampo e base de 25mm/);
});

test("keeps single-sentence SR descriptions whole instead of splitting at Medidas", () => {
  const parsed = parseProductPublicCopy({
    nome: "Roupeiro Capelinha Plus 5 portas",
    descricao:
      "Roupeiro Capelinha com Espelho, Côr Cinamomo, da Imop, Medidas: Alt 2,16m Larg 1,65m Prof 0,42m, Estrutura 100% MDP 15mm, 5 Portas de Bater.",
    medidas: null,
  });
  assert.equal(parsed.blocks.length, 1);
  assert.equal(parsed.blocks[0].kind, "paragraph");
  assert.match(parsed.blocks[0].text, /Estrutura 100% MDP 15mm, 5 Portas de Bater/);
  assert.deepEqual(
    parsed.extractedMeasurements.map((m) => `${m.label}: ${m.value}`),
    ["Largura: 1,65 m", "Altura: 2,16 m", "Profundidade: 0,42 m"],
  );
});

test("decodes backtick-n bullet lists and removes standalone section header", () => {
  const parsed = parseProductPublicCopy({
    nome: "Cômoda Vitória Plus",
    descricao:
      "Características do produto:`n• Cômoda Vitória 5G1P, Côr Branco Brilho`n• 5 Gavetas com Corrediças Telescópicas`n• Acabamento UV",
    medidas: null,
  });
  assert.equal(parsed.blocks.length, 1);
  assert.equal(parsed.blocks[0].kind, "list");
  assert.deepEqual(parsed.blocks[0].items, [
    "Cômoda Vitória 5G1P, Côr Branco Brilho",
    "5 Gavetas com Corrediças Telescópicas",
    "Acabamento UV",
  ]);
});

test("removes duplicated standalone dimension blocks and merges short orphan subheadings", () => {
  const parsed = parseProductPublicCopy({
    nome: "Sofá Retrátil 2,00 m Linho Bege A230 Sidney",
    descricao:
      "Sofá Retrátil 2,00 m Linho Bege A230 Sidney\n\nNosso Sofá Retrátil Sidney é elegante.\n\nMEDIDAS DO SOFÁ:\n\nAltura: 96 cm\n\nLargura: 2.00 m\n\nProfundidade fechado: 1.08 m\n\nProfundidade aberto: 1.40 m\n\nEstrutura\n\nSua estrutura é produzida em madeira maciça.",
    medidas: null,
  });
  assert.equal(parsed.blocks.length, 2);
  assert.deepEqual(parsed.blocks, [
    { kind: "paragraph", text: "Nosso Sofá Retrátil Sidney é elegante." },
    { kind: "paragraph", text: "Estrutura: Sua estrutura é produzida em madeira maciça." },
  ]);
  assert.equal(parsed.extractedMeasurements.length, 4);
});

test("rescues marketing copy trapped in medidas and moves disclaimers to disclaimers", () => {
  const parsed = parseProductPublicCopy({
    nome: "Bancada Nevada 1,80 m",
    descricao:
      "Disponibilidade no fornecedor: Off/Savana - DISPONÍVEL x67\n\nLarg:1,80m Alt: 0,50m Prof: 0,45m\n\nITENS DECORATIVOS E OUTROS PRODUTOS NÃO INCLUSOS",
    medidas:
      "Larg:1,80m Alt: 0,50m Prof: 0,45m\n\n100% MDF Tampo e base de 25mm com bordas chanfradas.",
  });
  assert.deepEqual(parsed.blocks, [
    { kind: "paragraph", text: "100% MDF Tampo e base de 25mm com bordas chanfradas." },
  ]);
  assert.deepEqual(parsed.disclaimers, ["ITENS DECORATIVOS E OUTROS PRODUTOS NÃO INCLUSOS"]);
});
