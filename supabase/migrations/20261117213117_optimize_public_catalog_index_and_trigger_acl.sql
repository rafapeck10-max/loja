-- Versioned record of Supabase migration 20261117213117 applied to mobi-loja.
-- Adds a partial catalog index matching the storefront query and restricts trigger
-- SECURITY DEFINER functions to service_role; no product prices or records are altered.

SET LOCAL lock_timeout = '5s';

CREATE INDEX IF NOT EXISTS produtos_public_catalog_ordem_id_idx
  ON public.produtos (ordem ASC, id ASC)
  WHERE preco_atacado > 0 AND preco_atual > 0 AND url_imagem <> '';

REVOKE ALL ON FUNCTION public.registrar_historico_preco_produto() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_historico_preco_produto() TO service_role;

REVOKE ALL ON FUNCTION public.validar_preco_produto() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validar_preco_produto() TO service_role;
