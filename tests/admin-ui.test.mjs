import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const width = Number(process.env.MOBI_TEST_WIDTH || 390);
const page = await browser.newPage({ viewport: { width, height: 900 } });
try {
  await page.goto("http://127.0.0.1:5175/admin");
  await page.getByRole("heading", { name: "Painel Mobi" }).waitFor();
  await page.evaluate(async () => {
    const source = await (await fetch("/src/routes/admin.tsx")).text();
    const moduleUrl = (part) => source.match(new RegExp('from "([^"]*' + part + '[^\\"]*)"'))[1];
    const React = (await import(moduleUrl("/react\\.js"))).default;
    const domUrl = performance
      .getEntriesByType("resource")
      .find((e) => e.name.includes("/react-dom_client.js")).name;
    const { createRoot } = (await import(domUrl)).default;
    const { QueryClient, QueryClientProvider } = await import(
      moduleUrl("@tanstack_react-query\\.js")
    );
    const { createRouter, createRootRoute, RouterProvider, createMemoryHistory } = await import(
      moduleUrl("@tanstack/react-router/dist/esm/index.dev\\.js")
    );
    const { AdminDashboard } = await import("/src/routes/admin.tsx");
    const { DEFAULT_HOMEPAGE_BANNERS } = await import("/src/lib/homepage-banners.ts");
    const products = Array.from({ length: 40 }, (_, i) => ({
      id: String(i),
      nome: "Produto teste " + i,
      slug: "produto-" + i,
      preco_atual: i < 2 ? 0 : i === 2 ? 500 : 1500,
      preco_atacado: i === 1 ? null : 300,
      url_imagem: "https://example.com/photo.png",
      categoria: i % 2 ? "Sofás" : "Poltronas",
      fornecedor: i % 2 ? "Tropical Móveis" : "Alpoim Distribuidora",
      sku: "SKU-" + i,
      descricao: "",
      cores: [],
      imagens: [],
      variacoes_preco: [],
      ordem: i,
      vitrine_semana_ordem: i >= 2 && i <= 5 ? i - 1 : null,
      vitrine_novidade: "automatico",
      vitrine_sala: "automatico",
      vitrine_descoberta: true,
    }));
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
          retry: false,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
        },
      },
    });
    qc.setQueryData(["admin-produtos"], products);
    qc.setQueryData(["admin-scraped-products"], []);
    qc.setQueryData(["admin-homepage-curation-status"], { available: true });
    qc.setQueryData(["admin-homepage-banners", "fixture-only"], {
      available: true,
      banners: DEFAULT_HOMEPAGE_BANNERS,
    });
    const rootRoute = createRootRoute({
      component: () =>
        React.createElement(AdminDashboard, { password: "fixture-only", onLogout: () => {} }),
    });
    const router = createRouter({
      routeTree: rootRoute,
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    const mount = document.createElement("div");
    mount.id = "ui-fixture";
    document.body.replaceChildren(mount);
    createRoot(mount).render(
      React.createElement(
        QueryClientProvider,
        { client: qc },
        React.createElement(RouterProvider, { router }),
      ),
    );
  });
  await page.getByRole("heading", { name: "Painel de Produtos" }).waitFor();
  const results = page.locator("text=/\\d+ produto\\(s\\) encontrado\\(s\\)/");
  await page.getByRole("button", { name: /Aguardando preço/ }).click();
  await results.filter({ hasText: "2 produto(s) encontrado(s)" }).waitFor();
  assert.equal(await page.getByLabel("Filtrar estado de publicação").inputValue(), "awaiting");
  await page.getByRole("button", { name: /^Total/ }).click();
  await page.getByLabel("Preço máximo (R$)").fill("500,00");
  await results.filter({ hasText: "3 produto(s) encontrado(s)" }).waitFor();
  await page.getByLabel("Preço mínimo (R$)").fill("500");
  await results.filter({ hasText: "1 produto(s) encontrado(s)" }).waitFor();
  await page.getByLabel("Preço mínimo (R$)").fill("900");
  await page.getByRole("alert").waitFor();
  await page.getByRole("button", { name: "Limpar filtros", exact: true }).click();
  await page.getByLabel("Filtrar fornecedor").selectOption("Tropical Móveis");
  await results.filter({ hasText: "20 produto(s) encontrado(s)" }).waitFor();
  await page.getByLabel("Filtrar categoria").selectOption("Poltronas");
  await results.filter({ hasText: "0 produto(s) encontrado(s)" }).waitFor();
  await page.getByRole("button", { name: /Aguardando preço/ }).click();
  await results.filter({ hasText: "2 produto(s) encontrado(s)" }).waitFor();
  assert.equal(await page.getByLabel("Filtrar fornecedor").inputValue(), "all");
  await page.getByLabel("Filtrar preço de").selectOption("supplier");
  await page.getByLabel("Preço máximo (R$)").fill("300");
  await results.filter({ hasText: "1 produto(s) encontrado(s)" }).waitFor();
  await page.getByRole("button", { name: "Limpar filtros", exact: true }).click();
  await page.getByLabel("Buscar produto no painel").fill("SKU-2");
  await results.filter({ hasText: "11 produto(s) encontrado(s)" }).waitFor();
  // Unsaved selections: exercise every curation option without writing to any database.
  const curation = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Vitrine da página inicial" }) });
  const saveButton = curation.getByRole("button", { name: "Salvar alterações", exact: true });
  assert.equal(await saveButton.isEnabled(), false);
  await curation.getByRole("button", { name: "Trocar produto da posição 1", exact: true }).click();
  await curation.getByLabel("Buscar produto", { exact: true }).fill("SKU-7");
  await curation.getByRole("button", { name: "Escolher Produto teste 7", exact: true }).click();
  assert.equal(
    await curation.getByLabel("Posição de Produto teste 7", { exact: true }).inputValue(),
    "0",
  );
  assert.equal(await saveButton.isEnabled(), true);
  await curation.getByRole("tab", { name: "Novidades", exact: true }).click();
  await curation
    .getByLabel("Novidades de Produto teste 0", { exact: true })
    .selectOption("incluir");
  assert.equal(
    await curation.getByLabel("Novidades de Produto teste 0", { exact: true }).inputValue(),
    "incluir",
  );
  await curation
    .getByLabel("Novidades de Produto teste 0", { exact: true })
    .selectOption("ocultar");
  await curation
    .getByLabel("Novidades de Produto teste 0", { exact: true })
    .selectOption("automatico");
  await curation.getByRole("tab", { name: "Para sua sala", exact: true }).click();
  await curation
    .getByLabel("Para sua sala de Produto teste 0", { exact: true })
    .selectOption("incluir");
  await curation.getByRole("tab", { name: "Descubra algo novo", exact: true }).click();
  await curation
    .getByRole("checkbox", { name: "Permitir Produto teste 0 em Descubra algo novo", exact: true })
    .uncheck();
  await curation.getByRole("tab", { name: "Para sua sala", exact: true }).click();
  assert.equal(
    await curation.getByLabel("Para sua sala de Produto teste 0", { exact: true }).inputValue(),
    "incluir",
  );
  await curation.getByRole("tab", { name: "Escolhas da semana", exact: true }).click();
  await curation.getByLabel("Posição de Produto teste 7", { exact: true }).selectOption("2");
  assert.equal(
    await curation.getByLabel("Posição de Produto teste 7", { exact: true }).inputValue(),
    "2",
  );
  await curation
    .getByRole("button", { name: "Remover Produto teste 7 da semana", exact: true })
    .click();
  await curation
    .getByRole("button", { name: "Adicionar produto na posição 4", exact: true })
    .click();
  await curation.getByRole("button", { name: "Cancelar troca", exact: true }).click();
  await curation.getByRole("button", { name: "Desfazer alterações", exact: true }).click();
  assert.equal(
    await curation.getByLabel("Posição de Produto teste 2", { exact: true }).inputValue(),
    "0",
  );
  assert.equal(await saveButton.isEnabled(), false);
  await curation.scrollIntoViewIfNeeded();
  await curation.screenshot({ path: ".vercel/curation-" + width + ".png" });
  await curation.getByRole("tab", { name: "Novidades", exact: true }).click();
  await curation.getByRole("button", { name: "Próxima", exact: true }).click();
  await curation.getByLabel("Novidades de Produto teste 6", { exact: true }).waitFor();
  await curation.getByLabel("Buscar produto", { exact: true }).fill("not-a-product");
  await curation
    .getByText("Nenhum produto encontrado. Tente outro nome ou referência.", { exact: true })
    .waitFor();
  await curation.getByLabel("Buscar produto", { exact: true }).fill("SKU-19");
  await curation
    .getByLabel("Novidades de Produto teste 19", { exact: true })
    .selectOption("ocultar");
  await curation.screenshot({ path: ".vercel/curation-options-" + width + ".png" });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  console.log(
    "PASS UI width " +
      width +
      ": filters, replacement with four selected, reorder/remove, cancel, all four tabs, settings persist, discard, pagination, empty state; no database writes.",
  );
} finally {
  await browser.close();
}
