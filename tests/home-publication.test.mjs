import test from "node:test";
import assert from "node:assert/strict";
import {
  applyStudioWorkspaceCommand,
  normalizeStudioWorkspaceCommand,
} from "../src/lib/admin-studio-transport.ts";
import { emptyWorkspace, parseWorkspace } from "../src/lib/admin-studio.ts";
import {
  isProductionDeployment,
  shouldReadPublishedHomePage,
} from "../src/lib/home-publication.ts";
import {
  initialPageDraft,
  parsePublishedHomePage,
  sourceVersion,
} from "../src/lib/pages-shelves.ts";

const date = "2026-11-14T15:00:00.000Z";

test("home pública sem chave privilegiada exige configuração apenas em produção", () => {
  assert.equal(shouldReadPublishedHomePage(true, true), true);
  assert.equal(shouldReadPublishedHomePage(false, false), false);
  assert.throws(() => shouldReadPublishedHomePage(false, true), /não está configurada/i);
});

test("Vercel Preview without the privileged key is not treated as production", () => {
  assert.equal(isProductionDeployment("preview", "production"), false);
  assert.equal(isProductionDeployment("production", "production"), true);
  assert.equal(isProductionDeployment(undefined, "production"), true);
  assert.equal(isProductionDeployment(undefined, "development"), false);
});
const products = ["sofa-a", "sofa-b", "sala-c", "cozinha-d"].map((id) => ({
  id,
  nome: `Produto ${id}`,
  categoria: "Sofás",
  preco_atual: 500,
  preco_atacado: 300,
  url_imagem: "https://example.com/produto.jpg",
  fornecedor: "Fornecedor privado",
  created_at: date,
}));

function saveAndReview() {
  let current = { serverVersion: 0, workspace: emptyWorkspace() };
  const pages = initialPageDraft(products);
  pages.curation.weeklyIds = [products[0].id, products[1].id];
  current = applyStudioWorkspaceCommand(
    current,
    { action: "save", expectedServerVersion: 0, scope: "pages", value: pages },
    { date },
  );
  current = applyStudioWorkspaceCommand(
    current,
    { action: "review", expectedServerVersion: 1, scope: "pages" },
    { date },
  );
  return { current, pages };
}

test("publicar exige a última revisão conferida e mantém apenas IDs no snapshot público", () => {
  const { current, pages } = saveAndReview();
  const command = normalizeStudioWorkspaceCommand({
    action: "publishHomePage",
    expectedServerVersion: 2,
    reviewedRevisionId: 2,
  });
  assert.equal(command.action, "publishHomePage");
  assert.equal(command.reviewedRevisionId, 2);
  const next = applyStudioWorkspaceCommand(current, command, {
    date,
    products,
    homePublicationEnabled: true,
  });
  assert.equal(next.serverVersion, 3);
  assert.equal(next.workspace.revision, 3);
  assert.equal(next.workspace.history.length, 3);
  assert.equal(next.workspace.history[1].status, "reviewed");
  assert.equal(next.workspace.history[2].status, "applied");
  assert.equal(next.workspace.history[2].appliedRevisionId, 2);
  assert.deepEqual(next.workspace.entries.pages, pages);
  assert.deepEqual(next.workspace.publishedHomePage.shelves.weekly.productIds, [
    "sofa-a",
    "sofa-b",
  ]);
  assert.equal(
    JSON.stringify(parseWorkspace(JSON.stringify(next.workspace))).includes("fornecedor"),
    false,
  );
});

test("a projeção pública remove dados internos se um snapshot legado vier contaminado", () => {
  const polluted = {
    ...JSON.parse(JSON.stringify(products[0])),
    preco_atacado: 300,
    fornecedor: "Fornecedor privado",
  };
  const parsed = parsePublishedHomePage({
    version: 1,
    revisionId: 4,
    appliedAt: date,
    sections: initialPageDraft(products)
      .sections.filter((section) => section.id !== "discovery")
      .map(({ id, title, subtitle, type, enabled }) => ({ id, title, subtitle, type, enabled })),
    shelves: {
      weekly: { mode: "manual", productIds: [polluted.id] },
      new: { mode: "manual", productIds: [] },
      room: { mode: "automatico", productIds: [] },
    },
    preco_atacado: 300,
    fornecedor: "Fornecedor privado",
    baseVersion: "privada",
  });

  assert.deepEqual(Object.keys(parsed).sort(), [
    "appliedAt",
    "revisionId",
    "sections",
    "shelves",
    "version",
  ]);
  assert.equal(JSON.stringify(parsed).includes("preco_atacado"), false);
  assert.equal(JSON.stringify(parsed).includes("fornecedor"), false);
  assert.equal(JSON.stringify(parsed).includes("baseVersion"), false);
});

test("snapshot público mantém topo e convite final e não desativa blocos estruturais", () => {
  const { current } = saveAndReview();
  const next = applyStudioWorkspaceCommand(
    current,
    { action: "publishHomePage", expectedServerVersion: 2, reviewedRevisionId: 2 },
    { date, products, homePublicationEnabled: true },
  );
  const published = next.workspace.publishedHomePage;
  assert.throws(
    () => parsePublishedHomePage({ ...published, sections: [...published.sections].reverse() }),
    /inválida/i,
  );
  assert.throws(
    () =>
      parsePublishedHomePage({
        ...published,
        sections: published.sections.map((section) =>
          section.id === "intro" ? { ...section, enabled: false } : section,
        ),
      }),
    /inválida/i,
  );
});

test("publicação falha com trava desligada, versão concorrente, revisão errada ou catálogo inelegível", () => {
  const { current } = saveAndReview();
  const command = { action: "publishHomePage", expectedServerVersion: 2, reviewedRevisionId: 2 };
  assert.throws(
    () =>
      applyStudioWorkspaceCommand(current, command, {
        date,
        products,
        homePublicationEnabled: false,
      }),
    /desligada|habilitada/i,
  );
  assert.throws(
    () =>
      applyStudioWorkspaceCommand(
        current,
        { ...command, expectedServerVersion: 1 },
        { date, products, homePublicationEnabled: true },
      ),
    /conflito/i,
  );
  assert.throws(
    () =>
      applyStudioWorkspaceCommand(
        current,
        { ...command, reviewedRevisionId: 1 },
        { date, products, homePublicationEnabled: true },
      ),
    /revisada|conferida/i,
  );
  assert.throws(
    () =>
      applyStudioWorkspaceCommand(current, command, {
        date,
        products: products.map((p, i) => (i ? p : { ...p, preco_atual: 0 })),
        homePublicationEnabled: true,
      }),
    /condições|catálogo|preço/i,
  );
  assert.equal(current.workspace.publishedHomePage, undefined);
  assert.equal(current.workspace.revision, 2);
});
