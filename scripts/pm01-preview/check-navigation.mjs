import assert from "node:assert/strict";

const origin = "http://127.0.0.1:5187";
for (const path of [
  "/",
  "/?all=true&q=poltrona",
  "/categoria/sofas",
  "/produto/page-demo-0",
  "/moveis-nova-iguacu",
  "/scripts/pm01-preview/index.html?view=home",
]) {
  const response = await fetch(origin + path, { headers: { accept: "text/html" } });
  assert.equal(response.status, 200, `Refresh de ${path} deve abrir a prévia`);
  const html = await response.text();
  assert.match(html, /scripts\/pm01-preview\/app\.tsx/, `Entrada da aplicação ausente em ${path}`);
  console.log(`OK ${path}`);
}
