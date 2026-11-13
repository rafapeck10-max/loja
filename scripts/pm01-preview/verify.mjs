import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const evidence = new URL("../../.output/pm01-evidence/", import.meta.url);
await mkdir(evidence, { recursive: true });
const errors = [],
  externalRequests = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).hostname !== "127.0.0.1") {
      externalRequests.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.goto("http://127.0.0.1:5187/scripts/pm01-preview/index.html");
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  await page.getByRole("heading", { name: "Visão geral", exact: true }).waitFor();
  assert.deepEqual(await page.locator(".ov-metric>strong").allTextContents(), ["4", "12", "3"]);
  assert.equal(await page.locator(".ov-unavailable").count(), 4);
  assert.equal(await page.locator(".ov-impact").count(), 4);
  const fonts = await page
    .locator(".ov-heading h1")
    .evaluate((el) => getComputedStyle(el).fontFamily);
  assert.ok(fonts.includes("sans-serif"));
  for (const width of [1440, 1024, 768, 390, 360, 844]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : width < 700 ? 844 : 1000 });
    assert.ok(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.body.scrollWidth <= innerWidth,
      ),
      `overflow at ${width}`,
    );
    assert.equal(await page.locator(".aw-sidebar").isVisible(), width >= 1024);
    if (width < 1024) {
      const trigger = page.getByRole("button", { name: "Abrir navegação" });
      await trigger.click();
      const drawer = page.getByRole("dialog", { name: "Navegação do painel" });
      await drawer.waitFor();
      for (let n = 0; n < 12; n++) {
        await page.keyboard.press("Tab");
        assert.ok(
          await drawer.evaluate((el) => el.contains(document.activeElement)),
          "focus escaped drawer",
        );
      }
      if (width === 390)
        await page.screenshot({ path: fileURLToPath(new URL("drawer-390.png", evidence)) });
      await page.keyboard.press("Escape");
      assert.ok(
        await trigger.evaluate((el) => el === document.activeElement),
        "focus did not return",
      );
    }
    await page.screenshot({
      path: fileURLToPath(new URL(`overview-${width}.png`, evidence)),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: /12 elegíveis/ }).click();
  assert.equal(await page.locator(".pm-product-list li").count(), 12);
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  await page.getByRole("button", { name: /2 aguardando preço/ }).click();
  assert.equal(await page.locator(".pm-product-list li").count(), 2);
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  await page.getByRole("button", { name: /^Revisar Roupeiro Capelinha/ }).click();
  assert.match(await page.getByRole("dialog").innerText(), /Roupeiro Capelinha/);
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  for (const [name, title] of [
    [/^Escolher produtos da vitrine/, "Páginas e vitrines"],
    [/^Trocar banners/, "Artes que apresentam a Mobi"],
    [/^3 coletados para revisão/, "Produtos coletados para revisão"],
  ]) {
    await page.getByRole("button", { name }).click();
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  }
  await page.getByLabel("Buscar produtos pelo nome ou SKU").fill("Poltrona");
  await page.getByRole("button", { name: "Buscar produtos", exact: true }).click();
  assert.equal(await page.locator(".pm-product-list li").count(), 1);
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  const help = page.getByRole("button", { name: "Ajuda do painel" });
  await help.click();
  await page.getByRole("heading", { name: "Como usar o Painel Mobi" }).waitFor();
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("aria-label") === "Ajuda do painel",
  );
  await page.getByText("Conferir estados da prévia", { exact: true }).click();
  const scenario = page.getByLabel("Cenário da prévia");
  await scenario.selectOption("error");
  assert.deepEqual(await page.locator(".ov-metric>strong").allTextContents(), ["—", "—", "—"]);
  await page.getByRole("heading", { name: "Não foi possível consultar o catálogo" }).waitFor();
  await page.getByRole("button", { name: "Atualizar dados", exact: true }).click();
  await page.getByRole("button", { name: "Atualizar dados", exact: true }).waitFor();
  assert.equal(await scenario.inputValue(), "success");
  await scenario.selectOption("loading");
  await page.getByRole("status").waitFor();
  await scenario.selectOption("queue-error");
  assert.equal(await page.locator(".ov-metric>strong").first().innerText(), "4");
  await page.getByRole("alert").waitFor();
  await scenario.selectOption("empty");
  assert.deepEqual(await page.locator(".ov-metric>strong").allTextContents(), ["0", "0", "0"]);
  await page.getByRole("heading", { name: "Seu catálogo está vazio" }).waitFor();
  await scenario.selectOption("queue-limit");
  await page.getByRole("button", { name: /3\+ coletados/ }).waitFor();
  await scenario.selectOption("success");
  await page.getByText("Conferir estados da prévia", { exact: true }).click();
  assert.deepEqual(errors, []);
  assert.ok(externalRequests.every((url) => url.startsWith("https://")));
  const report = {
    result: "passed",
    viewports: [1440, 1024, 768, 390, 360, 844],
    fonts,
    checks: [
      "three available metrics and four pending integration states",
      "unknown is not zero",
      "impact per issue",
      "shared workspace",
      "drawer focus trap and return",
      "sidebar and mobile layouts",
      "search",
      "shortcuts",
      "review exact product",
      "help",
      "error and retry",
      "loading",
      "partial failure",
      "empty",
      "bounded queue",
      "no horizontal overflow",
      "no page errors",
      "external requests blocked for isolated DOM checks",
    ],
    fixtureOnly: true,
    productionWritten: false,
    screenReaderTested: false,
  };
  await writeFile(new URL("report.json", evidence), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
