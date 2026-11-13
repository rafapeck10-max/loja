// Isolated PostgreSQL validation. Supply a temporary PGlite module path, not credentials.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createSupabaseStudioRepository } from "../src/lib/admin-studio-supabase.ts";
import { createStudioRepositoryTransport } from "../src/lib/admin-studio-repository.ts";

if (!process.env.MOBI_PGLITE_MODULE)
  throw new Error("Informe MOBI_PGLITE_MODULE para o PostgreSQL temporário.");
const { PGlite } = await import(pathToFileURL(process.env.MOBI_PGLITE_MODULE).href);
const db = new PGlite();
try {
  await db.exec(
    "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;",
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261112161958_add_mobi_studio_workspace.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`SET ROLE ${role}`);
    await assert.rejects(
      db.query("SELECT * FROM public.mobi_studio_workspace"),
      /permission denied/,
    );
    await assert.rejects(db.query("SELECT public.mobi_studio_read()"), /permission denied/);
    await assert.rejects(
      db.query("SELECT public.mobi_studio_compare_and_swap(0, '{}'::jsonb)"),
      /permission denied/,
    );
    await db.exec("RESET ROLE");
  }
  await db.exec("SET ROLE service_role");
  const rpc = async (name, args) => {
    try {
      const result =
        name === "mobi_studio_read"
          ? await db.query("SELECT public.mobi_studio_read() AS value")
          : await db.query(
              "SELECT public.mobi_studio_compare_and_swap($1::bigint, $2::jsonb) AS value",
              [args.p_expected_version, JSON.stringify(args.p_workspace)],
            );
      return { data: result.rows[0].value, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message } };
    }
  };
  const transport = createStudioRepositoryTransport(createSupabaseStudioRepository(rpc));
  const save = (value) => ({ action: "save", expectedServerVersion: 0, scope: "content", value });
  const outcomes = await Promise.allSettled([
    transport.change(save({ text: "A" })),
    transport.change(save({ text: "B" })),
  ]);
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter((x) => x.status === "rejected").length, 1);
  assert.equal((await transport.read()).serverVersion, 1);
  await transport.change({ action: "review", expectedServerVersion: 1, scope: "content" });
  const restored = await transport.change({
    action: "restore",
    expectedServerVersion: 2,
    revisionId: 1,
  });
  assert.equal(restored.workspace.history.length, 3);
  assert.equal(restored.serverVersion, 3);
  await assert.rejects(
    db.query("UPDATE public.mobi_studio_workspace SET workspace = '{}'::jsonb"),
    /check constraint/,
  );
  await assert.rejects(db.query("DELETE FROM public.mobi_studio_workspace"), /permission denied/);
  assert.equal((await transport.read()).serverVersion, 3);
  console.log(
    "PASS: SQL executado em PostgreSQL isolado; RLS/grants, RPCs, conflito, revisão, restauração e JSON inválido verificados.",
  );
} finally {
  await db.close();
}
