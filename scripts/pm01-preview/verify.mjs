import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const evidence = new URL("../../.output/pm01-evidence/", import.meta.url);
await mkdir(evidence, { recursive: true });
const errors = [];
const externalRequests = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).hostname !== "127.0.0.1") {
      externalRequests.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.goto("http://127.0.0.1:5187/scripts/pm01-preview/index.html");
  await page.getByRole("heading", { name: "Visão geral", exact: true }).waitFor();
  assert.deepEqual(await page.locator(".ov-metric strong").allTextContents(), ["8", "2", "2", "3"]);
  assert.equal(await page.locator(".ov-issues li").count(), 4);
  for (const width of [1440, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
    const sizes = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    assert.ok(
      sizes.body <= width && sizes.document <= width,
      `horizontal overflow at ${width}: ${JSON.stringify(sizes)}`,
    );
    await page.screenshot({
      path: new URL(`overview-${width}.png`, evidence).pathname.replace(/^\/(\w:)/, "$1"),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: /^Publicados/ }).click();
  assert.equal(await page.locator(".preview-products li").count(), 8);
  await page.getByRole("button", { name: "Voltar à Visão geral" }).click();
  await page.getByRole("button", { name: /^Aguardando preço/ }).click();
  assert.equal(await page.locator(".preview-products li").count(), 2);
  await page.getByRole("button", { name: "Voltar à Visão geral" }).click();
  await page.getByRole("button", { name: /^Revisar Sofá Nuvem/ }).click();
  assert.match(await page.getByRole("dialog").innerText(), /Sofá Nuvem/);
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  for (const [name, heading] of [
    [/^Escolher produtos da vitrine/, "Vitrine da página inicial"],
    [/^Trocar banners/, "Banner da página inicial"],
    [/^Para revisão/, "Produtos coletados para revisão"],
  ]) {
    await page.getByRole("button", { name }).click();
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
    await page.getByRole("button", { name: "Voltar à Visão geral" }).click();
  }
  await page.getByText("Conferir estados da prévia", { exact: true }).click();
  const scenario = page.getByLabel("Cenário da prévia");
  await scenario.selectOption("error");
  assert.deepEqual(await page.locator(".ov-metric strong").allTextContents(), ["—", "—", "—", "—"]);
  assert.equal(await page.locator(".ov-metric:disabled").count(), 4);
  await page.getByRole("heading", { name: "Não foi possível consultar o catálogo" }).waitFor();
  await page.screenshot({
    path: new URL("overview-error.png", evidence).pathname.replace(/^\/(\w:)/, "$1"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Atualizar dados" }).click();
  await page.getByRole("button", { name: "Atualizar dados" }).waitFor();
  assert.equal(await scenario.inputValue(), "success");
  await scenario.selectOption("loading");
  assert.deepEqual(await page.locator(".ov-metric strong").allTextContents(), ["—", "—", "—", "—"]);
  await page.getByRole("status").waitFor();
  await scenario.selectOption("queue-error");
  assert.deepEqual(await page.locator(".ov-metric strong").allTextContents(), ["8", "2", "2", "—"]);
  await scenario.selectOption("empty");
  assert.deepEqual(await page.locator(".ov-metric strong").allTextContents(), ["0", "0", "0", "0"]);
  await page.getByRole("heading", { name: "Seu catálogo está vazio" }).waitFor();
  await scenario.selectOption("queue-limit");
  assert.deepEqual(await page.locator(".ov-metric strong").allTextContents(), [
    "8",
    "2",
    "2",
    "3+",
  ]);
  await page
    .getByText("retornados pela consulta. A fila pode conter mais itens.", { exact: false })
    .waitFor();
  await scenario.selectOption("success");
  await page.getByText("Conferir estados da prévia", { exact: true }).click();
  assert.deepEqual(errors, []);
  assert.deepEqual(externalRequests, []);
  const report = {
    result: "passed",
    viewports: [1440, 1024, 768, 390, 360],
    checks: [
      "counts",
      "filtered navigation",
      "exact product in review",
      "shortcuts",
      "error",
      "retry",
      "loading",
      "partial source failure",
      "empty",
      "no horizontal overflow",
      "no page errors",
      "no external requests",
    ],
    fixtureOnly: true,
    productionWritten: false,
  };
  await writeFile(new URL("report.json", evidence), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
