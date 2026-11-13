-- Read-only inventory for mobi-loja. Does not export catalog rows or credentials.
-- Run using an administrative connection to the confirmed project.
BEGIN TRANSACTION READ ONLY;

SELECT name, to_regclass('public.' || name) IS NOT NULL AS exists
FROM unnest(ARRAY['produtos','scraped_products','configuracoes',
  'homepage_banners','produto_preco_historico']) AS name;

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('produtos','scraped_products','configuracoes',
    'homepage_banners','produto_preco_historico')
ORDER BY table_name, ordinal_position;

SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

SELECT tablename, policyname, roles, cmd
FROM pg_policies WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon','authenticated','service_role')
ORDER BY table_name, grantee, privilege_type;

SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;
ROLLBACK;
