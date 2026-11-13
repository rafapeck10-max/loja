import assert from "node:assert/strict";
import { test } from "node:test";
import {
  initialEvolutionData,
  validateEvolutionData,
  validateEvolutionManifest,
  importEvolutionJson,
  updateEvolutionTracking,
  searchEvolution,
  buildEvolutionRequest,
  exportEvolutionMarkdown,
  updateEvolutionTrackingDraft,
} from "../src/lib/evolution.ts";

test("initial catalog keeps all references separate from unassessed Mobi implementation", () => {
  const data = initialEvolutionData();
  assert.equal(data.manifest.features.length, 141);
  assert.equal(data.manifest.pages.length, 38);
  assert.equal(Object.keys(data.tracking).length, 141);
  assert.deepEqual(data.selectedIds, []);
  assert.equal(data.tracking["MM-HOME-01"].implementation, "nao_iniciado");
  assert.equal(data.tracking["MM-HOME-01"].observation, "nao_avaliado");
  assert.equal(data.tracking["MM-HOME-01"].activation, "nao_verificada");
  assert.deepEqual(validateEvolutionData(data), []);
  data.manifest.features[0].title = "mutated";
  assert.notEqual(initialEvolutionData().manifest.features[0].title, "mutated");
});

test("manifest import validates counts, duplicates, every required field and references", () => {
  for (const mutate of [
    (m) => m.features.pop(),
    (m) => m.pages.pop(),
    (m) => {
      m.features[1].id = m.features[0].id;
    },
    (m) => {
      m.features[0].id = "MM-GLOBAL-99";
    },
    (m) => {
      m.date = "2026-02-31";
    },
    (m) => {
      m.pages[1].id = m.pages[0].id;
    },
    (m) => {
      delete m.features[140].rollback;
    },
    (m) => {
      m.features[0].sources = ["MM-P99"];
    },
    (m) => {
      m.features[0].dependencies = ["MM-MISSING-01"];
    },
    (m) => {
      m.pages[0].groups = ["MISSING"];
    },
    (m) => {
      m.features[0].selected = "yes";
    },
    (m) => {
      m.production_requires_explicit_version_approval = false;
    },
    (m) => {
      m.viewports_observed = [{ width: "1440", height: 900 }];
    },
  ]) {
    const manifest = initialEvolutionData().manifest;
    mutate(manifest);
    assert.ok(validateEvolutionManifest(manifest).length, "invalid manifest must be rejected");
  }
  assert.ok(validateEvolutionManifest(null).length);
});

test("invalid import preserves previous data and enforces size; reference status never becomes tracking", () => {
  const previous = initialEvolutionData();
  previous.selectedIds = ["MM-HOME-01"];
  const bad = importEvolutionJson("{", previous);
  assert.equal(bad.data, previous);
  assert.ok(bad.errors.length);
  assert.equal(importEvolutionJson(" ".repeat(2_000_001), previous).data, previous);
  const manifest = structuredClone(previous.manifest);
  manifest.features[0].implementation_status = "validado";
  manifest.features[0].selected = true;
  const imported = importEvolutionJson(JSON.stringify(manifest), previous);
  assert.deepEqual(imported.errors, []);
  assert.equal(imported.data.tracking["MM-GLOBAL-01"].implementation, "nao_iniciado");
  assert.deepEqual(imported.data.selectedIds, ["MM-HOME-01"]);
});

test("validated requires evidence and desktop/mobile checks; rejected updates are atomic", () => {
  const data = initialEvolutionData();
  const rejected = updateEvolutionTracking(data, "MM-HOME-01", { implementation: "validado" });
  assert.equal(rejected.data, data);
  assert.ok(rejected.errors.length);
  const accepted = updateEvolutionTracking(data, "MM-HOME-01", {
    implementation: "validado",
    evidence: "https://preview.example/resultado",
    desktopChecked: true,
    mobileChecked: true,
  });
  assert.deepEqual(accepted.errors, []);
  assert.equal(accepted.data.tracking["MM-HOME-01"].activation, "nao_verificada");
  assert.equal(data.tracking["MM-HOME-01"].implementation, "nao_iniciado");
  assert.ok(
    updateEvolutionTracking(data, "MM-HOME-01", { branch: "javascript:alert(1)" }).errors.length,
  );
});

test("full snapshot rejects malformed tracking, foreign IDs, exclusions and request fields", () => {
  for (const mutate of [
    (d) => {
      delete d.tracking["MM-HOME-01"];
    },
    (d) => {
      d.tracking["MM-HOME-01"].mobileChecked = "yes";
    },
    (d) => {
      d.selectedIds = ["MM-BOGUS-01"];
    },
    (d) => {
      d.request.excludedIds = ["MM-BOGUS-01"];
    },
    (d) => {
      d.request.mode = "AUTO_PUBLISH";
    },
    (d) => {
      d.request.need = 5;
    },
    (d) => {
      d.tracking["MM-HOME-01"].activation = "ativo";
    },
  ]) {
    const data = initialEvolutionData();
    mutate(data);
    assert.ok(validateEvolutionData(data).length);
    assert.ok(importEvolutionJson(JSON.stringify(data), initialEvolutionData()).errors.length);
  }
});

test("search covers page names/IDs and groups, accents and capability filters", () => {
  const data = initialEvolutionData();
  assert.ok(searchEvolution(data, { query: "pagina inicial" }).some((f) => f.id === "MM-HOME-01"));
  assert.ok(searchEvolution(data, { query: "MM-P01" }).some((f) => f.id === "MM-HOME-01"));
  assert.ok(
    searchEvolution(data, { query: "CMS", capability: "disponivel" }).some(
      (f) => f.id === "MM-CMS-02",
    ),
  );
  assert.equal(
    searchEvolution(data, { query: "MM-CMS-02", capability: "a_desenvolver" }).length,
    0,
  );
  assert.equal(searchEvolution(data, { implementation: "validado" }).length, 0);
  data.tracking["MM-HOME-01"].observation = "parcial";
  assert.deepEqual(
    searchEvolution(data, { observation: "parcial" }).map((feature) => feature.id),
    ["MM-HOME-01"],
  );
});

test("request exclusion wins, dependencies are explicit and export cannot authorize publication", () => {
  const data = initialEvolutionData();
  data.selectedIds = ["MM-HOME-01", "MM-HOME-02"];
  data.request.excludedIds = ["MM-HOME-02"];
  data.request.need = "Melhorar a entrada da loja";
  data.request.adaptation = "Usar ativos oficiais Mobi";
  const request = buildEvolutionRequest(data);
  assert.deepEqual(request.selected_ids, ["MM-HOME-01"]);
  assert.deepEqual(request.excluded_ids, ["MM-HOME-02"]);
  assert.ok(request.dependencies.includes("catalogo_publico_valido"));
  assert.equal(request.publish, false);
  assert.equal(request.application_policy, "ADAPTAR_MOBI");
  assert.equal(request.production_requires_explicit_version_approval, true);
  assert.deepEqual(request.development_environments, ["local", "github_isolated_branch"]);
  assert.equal(request.spec_version, "1.1");
  const markdown = exportEvolutionMarkdown(data);
  assert.match(markdown, /MM-HOME-01/);
  assert.match(markdown, /MM-HOME-02/);
  assert.match(markdown, /aprovação explícita/i);
  assert.match(markdown, /catalogo_publico_valido/);
  assert.match(markdown, /Usar ativos oficiais Mobi/);
  assert.throws(() => buildEvolutionRequest(initialEvolutionData()));
});

test("every manifest field rejects null and every malformed payload returns errors without throwing", () => {
  const source = initialEvolutionData().manifest;
  for (const section of [null, "features", "pages"]) {
    const fields = Object.keys(section ? source[section][0] : source);
    for (const field of fields) {
      const manifest = structuredClone(source);
      const target = section ? manifest[section][0] : manifest;
      target[field] = null;
      assert.ok(validateEvolutionManifest(manifest).length, `${section ?? "root"}.${field}`);
    }
  }
  for (const json of [
    "null",
    "[]",
    "42",
    '"string"',
    '{"schemaVersion":1}',
    '{"features":[null],"pages":[null]}',
  ]) {
    const previous = initialEvolutionData();
    const result = importEvolutionJson(json, previous);
    assert.equal(result.data, previous);
    assert.ok(result.errors.length);
  }
});

test("full backup roundtrip preserves explicit evidence, request and selection", () => {
  const source = initialEvolutionData();
  source.selectedIds = ["MM-CMS-02"];
  source.request.need = "Revisar vitrines";
  source.tracking["MM-CMS-02"] = {
    ...source.tracking["MM-CMS-02"],
    observation: "parcial",
    implementation: "validado",
    activation: "inativo",
    evidence: "Relatório desktop/mobile em docs/revisao.md",
    desktopChecked: true,
    mobileChecked: true,
  };
  const result = importEvolutionJson(JSON.stringify(source), initialEvolutionData());
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.data, source);
});

test("per-requirement drafts survive a parent roundtrip and do not promote real tracking before registration", () => {
  const original = initialEvolutionData();
  const edited = updateEvolutionTrackingDraft(original, "MM-HOME-01", {
    owner: "Rafael",
    evidence: "docs/evidencia.md",
    implementation: "validado",
  });
  assert.deepEqual(edited.errors, []);
  assert.equal(edited.data.tracking["MM-HOME-01"].implementation, "nao_iniciado");
  assert.equal(edited.data.tracking["MM-HOME-01"].owner, "");
  const another = updateEvolutionTrackingDraft(edited.data, "MM-HOME-02", { owner: "Equipe" });
  const restored = importEvolutionJson(JSON.stringify(another.data), original);
  assert.deepEqual(restored.errors, []);
  assert.equal(restored.data.trackingDrafts["MM-HOME-01"].owner, "Rafael");
  assert.equal(restored.data.trackingDrafts["MM-HOME-01"].evidence, "docs/evidencia.md");
  const rejected = updateEvolutionTracking(
    restored.data,
    "MM-HOME-01",
    restored.data.trackingDrafts["MM-HOME-01"],
  );
  assert.ok(rejected.errors.length);
  assert.equal(rejected.data, restored.data);
  const completed = updateEvolutionTrackingDraft(restored.data, "MM-HOME-01", {
    desktopChecked: true,
    mobileChecked: true,
  });
  const registered = updateEvolutionTracking(
    completed.data,
    "MM-HOME-01",
    completed.data.trackingDrafts["MM-HOME-01"],
  );
  assert.deepEqual(registered.errors, []);
  assert.equal(registered.data.tracking["MM-HOME-01"].implementation, "validado");
  assert.equal(registered.data.trackingDrafts["MM-HOME-01"], undefined);
  assert.equal(registered.data.trackingDrafts["MM-HOME-02"].owner, "Equipe");
  assert.equal(original.trackingDrafts["MM-HOME-01"], undefined);
});

test("draft schema permits unfinished links/status but rejects foreign IDs and malformed values", () => {
  const original = initialEvolutionData();
  const draft = updateEvolutionTrackingDraft(original, "MM-HOME-01", {
    branch: "https://",
    implementation: "validado",
  });
  assert.deepEqual(draft.errors, []);
  assert.deepEqual(validateEvolutionData(draft.data), []);
  assert.ok(
    updateEvolutionTracking(draft.data, "MM-HOME-01", draft.data.trackingDrafts["MM-HOME-01"])
      .errors.length,
  );
  assert.ok(
    updateEvolutionTrackingDraft(original, "MM-MISSING-01", { owner: "Rafael" }).errors.length,
  );
  for (const changes of [{ owner: 42 }, { implementation: "AUTO" }, { mobileChecked: "yes" }]) {
    const result = updateEvolutionTrackingDraft(original, "MM-HOME-01", changes);
    assert.ok(result.errors.length);
    assert.equal(result.data, original);
  }
  const legacy = initialEvolutionData();
  delete legacy.trackingDrafts;
  assert.deepEqual(validateEvolutionData(legacy), []);
});

test("delayed file import detects intervening selection or tracking edits and preserves latest state", async () => {
  const started = initialEvolutionData();
  const fileRead = Promise.resolve(JSON.stringify(started.manifest));
  const current = updateEvolutionTrackingDraft(started, "MM-HOME-01", {
    owner: "Editado durante leitura",
  }).data;
  current.selectedIds = ["MM-HOME-02"];
  const result = importEvolutionJson(await fileRead, current, started);
  assert.equal(result.data, current);
  assert.ok(result.errors.some((error) => /mudou|conflito/i.test(error)));
  assert.deepEqual(result.data.selectedIds, ["MM-HOME-02"]);
  assert.equal(result.data.trackingDrafts["MM-HOME-01"].owner, "Editado durante leitura");
  const unchanged = importEvolutionJson(await fileRead, structuredClone(started), started);
  assert.deepEqual(unchanged.errors, []);
});
