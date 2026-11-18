-- Applied through Supabase MCP. No prices, stock, policies or permissions change.
set local lock_timeout = '5s';
alter table public.produtos add column if not exists vitrine_black_friday boolean;
comment on column public.produtos.vitrine_black_friday is 'Black Friday: true inclui, false oculta, null mantém seleção automática por oferta. Não altera preço.';
notify pgrst, 'reload schema';
